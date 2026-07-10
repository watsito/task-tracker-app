import { NextResponse } from 'next/server';
import xmlrpc from 'xmlrpc';

type OdooMany2One = [number, string];

type OdooProjectStage = {
  id: number;
  name: string;
  sequence: number;
};

type OdooProjectRecord = {
  id: number;
  name: string;
  stage_id: false | OdooMany2One;
  is_favorite: boolean;
  user_id: false | OdooMany2One;
  tag_ids: number[];
  date_start: false | string;
  date: false | string;
};

type OdooTagRecord = {
  id: number;
  name: string;
};

type OdooTaskGroup = {
  project_id?: OdooMany2One;
  project_id_count: number;
};

function getOdooConfig() {
  const url = process.env.ODOO_URL?.trim();
  const database = process.env.ODOO_DB?.trim();
  const username = process.env.ODOO_USERNAME?.trim();
  const password = process.env.ODOO_PASSWORD?.trim() || process.env.ODOO_API_KEY?.trim();

  if (!url || !database || !username || !password) {
    throw new Error('ODOO_URL, ODOO_DB, ODOO_USERNAME, dan ODOO_PASSWORD/ODOO_API_KEY harus diisi di .env.');
  }

  return { url: url.replace(/\/$/, ''), database, username, password };
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

async function authenticate() {
  const { url, database, username, password } = getOdooConfig();
  const commonClient = xmlrpc.createSecureClient({
    url: `${url}/xmlrpc/2/common`,
  });

  const uid = await createMethodCaller<number>(commonClient, 'authenticate', [
    database,
    username,
    password,
    {},
  ]);

  if (!uid) {
    throw new Error('Autentikasi ke Odoo gagal. Periksa kembali kredensial di .env.');
  }

  const objectClient = xmlrpc.createSecureClient({
    url: `${url}/xmlrpc/2/object`,
  });

  return { url, database, username, password, uid, objectClient };
}

async function executeKw<T>(
  objectClient: xmlrpc.Client,
  database: string,
  uid: number,
  password: string,
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {}
) {
  return createMethodCaller<T>(objectClient, 'execute_kw', [
    database,
    uid,
    password,
    model,
    method,
    args,
    kwargs,
  ]);
}

function getInitials(name: string | undefined) {
  if (!name) return '?';
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return '?';

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export async function GET() {
  try {
    const { database, password, uid, objectClient } = await authenticate();

    const [stages, projects, taskGroups] = await Promise.all([
      executeKw<OdooProjectStage[]>(
        objectClient,
        database,
        uid,
        password,
        'project.project.stage',
        'search_read',
        [[]],
        { fields: ['id', 'name', 'sequence'], order: 'sequence asc' }
      ),
      executeKw<OdooProjectRecord[]>(
        objectClient,
        database,
        uid,
        password,
        'project.project',
        'search_read',
        [[]],
        {
          fields: ['id', 'name', 'stage_id', 'is_favorite', 'user_id', 'tag_ids', 'date_start', 'date'],
          order: 'name asc',
          limit: 500,
        }
      ),
      executeKw<OdooTaskGroup[]>(
        objectClient,
        database,
        uid,
        password,
        'project.task',
        'read_group',
        [[], ['project_id'], ['project_id']],
        {}
      ),
    ]);

    const tagIds = Array.from(new Set(projects.flatMap((project) => project.tag_ids)));
    const tags = tagIds.length
      ? await executeKw<OdooTagRecord[]>(
          objectClient,
          database,
          uid,
          password,
          'project.tags',
          'read',
          [tagIds],
          { fields: ['id', 'name'] }
        )
      : [];

    const taskCountByProjectId = new Map<number, number>(
      taskGroups
        .filter((group) => Array.isArray(group.project_id))
        .map((group) => [group.project_id![0], group.project_id_count])
    );

    const tagNameById = new Map<number, string>(tags.map((tag) => [tag.id, tag.name]));

    return NextResponse.json({
      stages: stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        sequence: stage.sequence,
      })),
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        stageId: Array.isArray(project.stage_id) ? project.stage_id[0] : null,
        stageName: Array.isArray(project.stage_id) ? project.stage_id[1] : 'Tanpa Stage',
        isFavorite: project.is_favorite,
        ownerId: Array.isArray(project.user_id) ? project.user_id[0] : null,
        ownerName: Array.isArray(project.user_id) ? project.user_id[1] : null,
        ownerInitials: getInitials(Array.isArray(project.user_id) ? project.user_id[1] : undefined),
        tagIds: project.tag_ids,
        tagNames: project.tag_ids.map((tagId) => tagNameById.get(tagId)).filter(Boolean),
        dateStart: project.date_start || null,
        dateEnd: project.date || null,
        taskCount: taskCountByProjectId.get(project.id) ?? 0,
      })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Gagal membaca project Odoo.';

    return NextResponse.json(
      {
        success: false,
        errorMessage,
      },
      { status: 500 }
    );
  }
}
