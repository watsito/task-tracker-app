/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║                    ODOO INTEGRATION BRIDGE                          ║
 * ║                                                                      ║
 * ║  Ini adalah lapisan jembatan (bridge layer) antara Task Tracker      ║
 * ║  dan Odoo. Semua interaksi dengan Odoo API HARUS melalui file ini.  ║
 * ║                                                                      ║
 * ║  Odoo External API menggunakan protokol XML-RPC pada dua endpoint:   ║
 * ║    • /web/dataset/call_kw  (JSON-RPC, direkomendasikan untuk web)    ║
 * ║    • /xmlrpc/2/common      (autentikasi)                             ║
 * ║    • /xmlrpc/2/object      (operasi CRUD pada model Odoo)            ║
 * ║                                                                      ║
 * ║  Model Odoo yang digunakan: project.task                             ║
 * ║                                                                      ║
 * ║  STATUS: BRIDGE STUB — Siap disambungkan ke Odoo nyata.             ║
 * ║  Ganti setiap blok "// TODO: [IMPLEMENT]" dengan implementasi nyata. ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { Task, TaskStatus } from '@/features/tasks/types/task';
import {
  OdooConfig,
  OdooConnectionResult,
  OdooSyncResult,
  OdooTaskPayload,
} from '../types/integration';

// ─── Priority Mapper ───────────────────────────────────────────────────────
/**
 * Odoo hanya mengenal dua level prioritas: '0' (normal) dan '1' (urgent).
 * Kita memetakan 4 level Task Tracker ke format Odoo.
 */
function mapPriorityToOdoo(priority: Task['priority']): '0' | '1' {
  return priority === 'Urgent' || priority === 'High' ? '1' : '0';
}

// ─── Status → Stage Mapper ─────────────────────────────────────────────────
/**
 * Odoo menggunakan `stage_id` (foreign key) untuk status Kanban.
 * ID stage bersifat dinamis per-project di Odoo.
 *
 * TODO: [IMPLEMENT] Fetch stage IDs dari Odoo project saat koneksi berhasil,
 *       lalu simpan mapping ini di integrationStore.
 *
 * Contoh mapping yang perlu diisi oleh admin saat setup:
 *   'To Do'       → stage_id: 1  (atau nama stage Odoo yang sesuai)
 *   'In Progress' → stage_id: 2
 *   'Review'      → stage_id: 3
 *   'Done'        → stage_id: 4 (atau stage "Done" di Odoo)
 */
const STAGE_MAP: Record<TaskStatus, number | undefined> = {
  'To Do': undefined,       // TODO: Isi dengan stage_id dari Odoo
  'In Progress': undefined, // TODO: Isi dengan stage_id dari Odoo
  'Review': undefined,      // TODO: Isi dengan stage_id dari Odoo
  'Done': undefined,        // TODO: Isi dengan stage_id dari Odoo
};

// ─── Task Serializer ───────────────────────────────────────────────────────
/**
 * Mengubah Task Tracker object menjadi payload yang siap dikirim ke Odoo.
 * Ini adalah satu-satunya tempat di mana field mapping didefinisikan.
 */
function serializeTaskForOdoo(task: Task): OdooTaskPayload {
  return {
    name: task.title,
    description: task.description,
    priority: mapPriorityToOdoo(task.priority),
    stage_id: STAGE_MAP[task.status],
    // user_ids: TODO — Map assigneeId ke Odoo user ID setelah fetch user list
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC BRIDGE API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Menguji koneksi ke server Odoo dengan mencoba autentikasi.
 *
 * Odoo JSON-RPC Auth endpoint:
 *   POST {url}/web/session/authenticate
 *   Body: { jsonrpc: "2.0", method: "call", params: { db, login, password } }
 *
 * TODO: [IMPLEMENT] Ganti simulasi di bawah dengan fetch nyata ke Odoo.
 *
 * @param config - Konfigurasi koneksi Odoo
 * @returns OdooConnectionResult dengan uid jika berhasil
 */
export async function testOdooConnection(
  config: OdooConfig
): Promise<OdooConnectionResult> {
  console.log('[OdooService] Testing connection to:', config.url);

  // ── STUB: Simulasi network delay ─────────────────────────────────────────
  await new Promise((r) => setTimeout(r, 1500));

  // TODO: [IMPLEMENT] Ganti blok ini dengan fetch nyata:
  //
  // const response = await fetch(`${config.url}/web/session/authenticate`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     jsonrpc: '2.0',
  //     method: 'call',
  //     id: 1,
  //     params: {
  //       db: config.database,
  //       login: config.username,
  //       password: config.apiKey,
  //     },
  //   }),
  // });
  // const data = await response.json();
  // if (data.result?.uid) {
  //   return { success: true, uid: data.result.uid, serverVersion: data.result.server_version };
  // }
  // return { success: false, errorMessage: data.error?.message };
  // ─────────────────────────────────────────────────────────────────────────

  // Simulasi: URL valid → sukses, URL invalid → gagal
  if (config.url.startsWith('https://') && config.apiKey.length >= 8) {
    return {
      success: true,
      uid: 2,
      serverVersion: '17.0',
    };
  }

  return {
    success: false,
    errorMessage:
      'Koneksi gagal. Pastikan URL menggunakan HTTPS dan API Key minimal 8 karakter.',
  };
}

/**
 * Mensinkronisasi satu task ke Odoo sebagai record project.task.
 *
 * Alur kerja:
 *   1. Jika task belum ada di Odoo → CREATE (execute_kw: create)
 *   2. Jika task sudah ada (ada odooTaskId) → WRITE (execute_kw: write)
 *
 * Odoo JSON-RPC Object endpoint:
 *   POST {url}/web/dataset/call_kw
 *   Body: { model: "project.task", method: "create"|"write", args: [...], kwargs: {} }
 *
 * TODO: [IMPLEMENT] Ganti simulasi di bawah dengan fetch nyata ke Odoo.
 *
 * @param task       - Task yang akan di-sync
 * @param config     - Konfigurasi koneksi Odoo
 * @param odooTaskId - ID Odoo jika task sudah ada (untuk update)
 * @returns OdooSyncResult
 */
export async function syncTaskToOdoo(
  task: Task,
  config: OdooConfig,
  odooTaskId?: number
): Promise<OdooSyncResult> {
  const payload = serializeTaskForOdoo(task);
  const operation = odooTaskId ? 'write' : 'create';

  console.log(`[OdooService] ${operation.toUpperCase()} task "${task.title}" →`, payload);

  // ── STUB: Simulasi network delay ─────────────────────────────────────────
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));

  // TODO: [IMPLEMENT] Ganti blok ini dengan fetch nyata:
  //
  // const headers = {
  //   'Content-Type': 'application/json',
  //   Cookie: `session_id=${sessionId}`, // Dari hasil testOdooConnection
  // };
  //
  // if (operation === 'create') {
  //   const response = await fetch(`${config.url}/web/dataset/call_kw`, {
  //     method: 'POST',
  //     headers,
  //     body: JSON.stringify({
  //       jsonrpc: '2.0', method: 'call', id: 1,
  //       params: {
  //         model: 'project.task',
  //         method: 'create',
  //         args: [payload],
  //         kwargs: { context: { lang: 'id_ID' } },
  //       },
  //     }),
  //   });
  //   const data = await response.json();
  //   return { success: true, odooTaskId: data.result };
  // }
  //
  // if (operation === 'write') {
  //   const response = await fetch(`${config.url}/web/dataset/call_kw`, {
  //     method: 'POST',
  //     headers,
  //     body: JSON.stringify({
  //       jsonrpc: '2.0', method: 'call', id: 1,
  //       params: {
  //         model: 'project.task',
  //         method: 'write',
  //         args: [[odooTaskId], payload],
  //         kwargs: {},
  //       },
  //     }),
  //   });
  //   const data = await response.json();
  //   return { success: data.result === true, odooTaskId };
  // }
  // ─────────────────────────────────────────────────────────────────────────

  // Simulasi: 90% berhasil
  if (Math.random() > 0.1) {
    const newOdooId = odooTaskId ?? Math.floor(10000 + Math.random() * 90000);
    return { success: true, odooTaskId: newOdooId };
  }

  return { success: false, errorMessage: 'Odoo server timeout (simulasi).' };
}

/**
 * Menghapus task dari Odoo (unlink).
 *
 * TODO: [IMPLEMENT] Digunakan ketika task di-soft-delete dan admin memilih
 * untuk menghapusnya juga dari Odoo.
 */
export async function deleteOdooTask(
  odooTaskId: number,
  config: OdooConfig
): Promise<boolean> {
  console.log(`[OdooService] DELETE odoo task #${odooTaskId}`);
  // TODO: [IMPLEMENT]
  // POST {url}/web/dataset/call_kw
  // { model: 'project.task', method: 'unlink', args: [[odooTaskId]] }
  await new Promise((r) => setTimeout(r, 500));
  return true;
}

/**
 * Fetch semua stage dari project Odoo untuk keperluan mapping status.
 *
 * TODO: [IMPLEMENT] Dipanggil sekali saat koneksi berhasil, hasilnya
 * disimpan di integrationStore untuk ditampilkan di UI mapping.
 */
export async function fetchOdooStages(
  _config: OdooConfig
): Promise<{ id: number; name: string }[]> {
  // TODO: [IMPLEMENT]
  // POST {url}/web/dataset/call_kw
  // { model: 'project.task.type', method: 'search_read',
  //   args: [[]], kwargs: { fields: ['id', 'name'], limit: 50 } }
  await new Promise((r) => setTimeout(r, 500));
  return [
    { id: 1, name: 'New' },
    { id: 2, name: 'In Progress' },
    { id: 3, name: 'Testing' },
    { id: 4, name: 'Done' },
  ];
}
