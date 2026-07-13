type OdooConfig = {
  url: string;
  database: string;
  username: string;
  password: string;
};

type XmlRpcPrimitive = string | number | boolean | null;
type XmlRpcValue = XmlRpcPrimitive | XmlRpcValue[] | { [key: string]: XmlRpcValue };

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function stripXmlDeclaration(xml: string) {
  return xml.replace(/^\s*<\?xml[^>]*\?>\s*/i, '').trim();
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildValueXml(value: unknown): string {
  if (value === null || value === undefined) {
    return '<value><nil/></value>';
  }

  if (Array.isArray(value)) {
    return `<value><array><data>${value.map((item) => buildValueXml(item)).join('')}</data></array></value>`;
  }

  if (typeof value === 'object') {
    const members = Object.entries(value as Record<string, unknown>)
      .map(([key, memberValue]) => `<member><name>${escapeXml(key)}</name>${buildValueXml(memberValue)}</member>`)
      .join('');
    return `<value><struct>${members}</struct></value>`;
  }

  if (typeof value === 'boolean') {
    return `<value><boolean>${value ? '1' : '0'}</boolean></value>`;
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? `<value><int>${value}</int></value>`
      : `<value><double>${value}</double></value>`;
  }

  return `<value><string>${escapeXml(String(value))}</string></value>`;
}

function buildMethodCall(method: string, params: unknown[]) {
  const paramsXml = params.map((param) => `<param>${buildValueXml(param)}</param>`).join('');
  return `<?xml version="1.0"?><methodCall><methodName>${escapeXml(method)}</methodName><params>${paramsXml}</params></methodCall>`;
}

function getDirectChildBlocks(xml: string, tagName: string) {
  const blocks: string[] = [];
  const openTag = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  let index = 0;

  while (index < xml.length) {
    const start = xml.indexOf(openTag, index);
    if (start === -1) break;

    const startTagEnd = xml.indexOf('>', start);
    if (startTagEnd === -1) break;

    let depth = 1;
    let cursor = startTagEnd + 1;

    while (depth > 0) {
      const nextOpen = xml.indexOf(openTag, cursor);
      const nextClose = xml.indexOf(closeTag, cursor);

      if (nextClose === -1) {
        throw new Error(`Malformed XML-RPC response: closing tag ${closeTag} not found.`);
      }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        const nestedTagEnd = xml.indexOf('>', nextOpen);
        if (nestedTagEnd === -1) {
          throw new Error(`Malformed XML-RPC response: opening tag ${openTag} not closed.`);
        }
        depth += 1;
        cursor = nestedTagEnd + 1;
      } else {
        depth -= 1;
        cursor = nextClose + closeTag.length;
      }
    }

    blocks.push(xml.slice(start, cursor));
    index = cursor;
  }

  return blocks;
}

function getInnerXml(block: string, tagName: string) {
  const startTagEnd = block.indexOf('>');
  const closeTag = `</${tagName}>`;
  const end = block.lastIndexOf(closeTag);

  if (startTagEnd === -1 || end === -1) {
    throw new Error(`Malformed XML-RPC block for tag ${tagName}.`);
  }

  return block.slice(startTagEnd + 1, end);
}

function getSingleTagInnerXml(xml: string, tagName: string) {
  const blocks = getDirectChildBlocks(xml, tagName);
  if (blocks.length === 0) {
    throw new Error(`Malformed XML-RPC response: tag <${tagName}> not found.`);
  }
  return getInnerXml(blocks[0], tagName);
}

function parseValueBlock(valueBlock: string): XmlRpcValue {
  const inner = getInnerXml(valueBlock, 'value').trim();

  if (!inner) return '';
  if (!inner.startsWith('<')) return decodeXml(inner);
  if (inner.startsWith('<string>')) return decodeXml(getInnerXml(inner, 'string'));
  if (inner.startsWith('<int>')) return Number.parseInt(decodeXml(getInnerXml(inner, 'int')), 10);
  if (inner.startsWith('<i4>')) return Number.parseInt(decodeXml(getInnerXml(inner, 'i4')), 10);
  if (inner.startsWith('<double>')) return Number.parseFloat(decodeXml(getInnerXml(inner, 'double')));
  if (inner.startsWith('<boolean>')) return decodeXml(getInnerXml(inner, 'boolean')) === '1';
  if (inner.startsWith('<nil/>')) return null;
  if (inner.startsWith('<dateTime.iso8601>')) return decodeXml(getInnerXml(inner, 'dateTime.iso8601'));

  if (inner.startsWith('<array>')) {
    const dataInner = getSingleTagInnerXml(getInnerXml(inner, 'array'), 'data');
    return getDirectChildBlocks(dataInner, 'value').map((block) => parseValueBlock(block));
  }

  if (inner.startsWith('<struct>')) {
    const structInner = getInnerXml(inner, 'struct');
    const members = getDirectChildBlocks(structInner, 'member');
    const result: Record<string, XmlRpcValue> = {};

    for (const member of members) {
      const memberInner = getInnerXml(member, 'member');
      const name = decodeXml(getSingleTagInnerXml(memberInner, 'name'));
      const valueBlock = getDirectChildBlocks(memberInner, 'value')[0];
      result[name] = parseValueBlock(valueBlock);
    }

    return result;
  }

  throw new Error(`Unsupported XML-RPC value: ${inner.slice(0, 80)}`);
}

function parseMethodResponse(xml: string) {
  const normalized = stripXmlDeclaration(xml);

  if (/<title>/i.test(normalized)) {
    throw new Error('Endpoint Odoo mengembalikan HTML, bukan XML-RPC. Periksa URL Odoo atau proteksi server/Vercel.');
  }

  if (normalized.includes('<fault>')) {
    const faultInner = getSingleTagInnerXml(normalized, 'fault');
    const valueBlock = getDirectChildBlocks(faultInner, 'value')[0];
    const parsedFault = parseValueBlock(valueBlock);

    if (parsedFault && typeof parsedFault === 'object' && !Array.isArray(parsedFault)) {
      const faultString = parsedFault.faultString;
      throw new Error(typeof faultString === 'string' ? faultString : 'XML-RPC fault response from Odoo.');
    }

    throw new Error('XML-RPC fault response from Odoo.');
  }

  const paramsInner = getSingleTagInnerXml(normalized, 'params');
  const paramInner = getSingleTagInnerXml(paramsInner, 'param');
  const valueBlock = getDirectChildBlocks(paramInner, 'value')[0];
  return parseValueBlock(valueBlock);
}

export function getOdooConfig(): OdooConfig {
  const url = process.env.ODOO_URL?.trim();
  const database = process.env.ODOO_DB?.trim();
  const username = process.env.ODOO_USERNAME?.trim();
  const password = process.env.ODOO_PASSWORD?.trim() || process.env.ODOO_API_KEY?.trim();

  if (!url || !database || !username || !password) {
    throw new Error('ODOO_URL, ODOO_DB, ODOO_USERNAME, dan ODOO_PASSWORD/ODOO_API_KEY harus diisi di .env.');
  }

  return { url: url.replace(/\/$/, ''), database, username, password };
}

async function xmlRpcCall<T>(endpoint: string, method: string, params: unknown[]) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      Accept: 'text/xml',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
    body: buildMethodCall(method, params),
    cache: 'no-store',
    redirect: 'follow',
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Odoo merespons HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  return parseMethodResponse(text) as T;
}

export async function authenticateOdoo() {
  const { url, database, username, password } = getOdooConfig();
  const version = await xmlRpcCall<Record<string, XmlRpcValue>>(`${url}/xmlrpc/2/common`, 'version', []);
  const uid = await xmlRpcCall<number>(`${url}/xmlrpc/2/common`, 'authenticate', [database, username, password, {}]);

  if (!uid) {
    throw new Error('Autentikasi ke Odoo gagal. Periksa kembali kredensial di .env.');
  }

  return { url, database, username, password, uid, version };
}

export async function executeKw<T>(
  database: string,
  uid: number,
  password: string,
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {}
) {
  const { url } = getOdooConfig();
  return xmlRpcCall<T>(`${url}/xmlrpc/2/object`, 'execute_kw', [database, uid, password, model, method, args, kwargs]);
}
