import { NextResponse } from 'next/server';
import xmlrpc from 'xmlrpc';

type OdooVersionInfo = {
  server_version?: string;
  protocol_version?: number;
};

function getOdooConfig() {
  const url = process.env.ODOO_URL?.trim();
  const database = process.env.ODOO_DB?.trim();
  const username = process.env.ODOO_USERNAME?.trim();
  const password = process.env.ODOO_PASSWORD?.trim() || process.env.ODOO_API_KEY?.trim();

  if (!url || !database || !username || !password) {
    throw new Error('ODOO_URL, ODOO_DB, ODOO_USERNAME, dan ODOO_PASSWORD/ODOO_API_KEY harus diisi di .env.');
  }

  return { url, database, username, password };
}

function createMethodCaller<T>(client: xmlrpc.Client, method: string, params: unknown[]) {
  return new Promise<T>((resolve, reject) => {
    client.methodCall(method, params, (error, value) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(value as T);
    });
  });
}

export async function GET() {
  try {
    const { url, database, username, password } = getOdooConfig();
    const normalizedUrl = url.replace(/\/$/, '');
    const commonClient = xmlrpc.createSecureClient({
      url: `${normalizedUrl}/xmlrpc/2/common`,
    });

    const version = await createMethodCaller<OdooVersionInfo>(commonClient, 'version', []);
    const uid = await createMethodCaller<number>(commonClient, 'authenticate', [
      database,
      username,
      password,
      {},
    ]);

    if (!uid) {
      return NextResponse.json(
        {
          success: false,
          errorMessage: 'Autentikasi ke Odoo gagal. Periksa kembali kredensial di .env.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      uid,
      serverVersion: version.server_version ?? null,
      protocolVersion: version.protocol_version ?? null,
      url: normalizedUrl,
      database,
      username,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Gagal menghubungkan ke Odoo.';

    return NextResponse.json(
      {
        success: false,
        errorMessage,
      },
      { status: 500 }
    );
  }
}
