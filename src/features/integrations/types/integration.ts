// ─── Odoo Connection Config ────────────────────────────────────────────────
export interface OdooConfig {
  /** Base URL Odoo, contoh: https://mycompany.odoo.com */
  url: string;
  /** Nama database Odoo */
  database: string;
  /** Username / email akun Odoo */
  username: string;
  /** API Key dari Odoo (Settings → Technical → API Keys) */
  apiKey: string;
  /** UID user Odoo — diisi otomatis setelah autentikasi berhasil */
  uid?: number;
}

// ─── Sync Status per Task ──────────────────────────────────────────────────
export type OdooSyncStatus =
  | 'idle'       // Belum pernah di-sync
  | 'pending'    // Antri untuk di-sync
  | 'syncing'    // Sedang dalam proses sync
  | 'synced'     // Berhasil sync ke Odoo
  | 'failed';    // Sync gagal

export interface OdooTaskRecord {
  /** Task ID lokal dari Task Tracker */
  localTaskId: string;
  /** ID record project.task di Odoo (diisi setelah sync berhasil) */
  odooTaskId?: number;
  status: OdooSyncStatus;
  lastSyncedAt?: Date;
  errorMessage?: string;
}

// ─── Sync Operation Result ─────────────────────────────────────────────────
export interface OdooSyncResult {
  success: boolean;
  odooTaskId?: number;
  errorMessage?: string;
}

// ─── Connection Test Result ────────────────────────────────────────────────
export interface OdooConnectionResult {
  success: boolean;
  uid?: number;
  serverVersion?: string;
  errorMessage?: string;
}

// ─── Odoo XML-RPC Payload shape (internal) ────────────────────────────────
/** Map dari Task Tracker field → Odoo project.task field */
export interface OdooTaskPayload {
  name: string;           // → project.task.name
  description: string;    // → project.task.description
  priority: '0' | '1';   // Odoo: '0' = normal, '1' = urgent
  stage_id?: number;      // → project.task.stage_id (kolom Kanban Odoo)
  user_ids?: number[];    // → project.task.user_ids (assignee)
}

// ─── Integration Feature State ─────────────────────────────────────────────
export type IntegrationStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
