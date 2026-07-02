'use client';

import { useState } from 'react';
import { useIntegrationStore } from '../store/integrationStore';
import { useTaskStore } from '@/features/tasks/store/taskStore';
import { OdooConfig } from '../types/integration';

const EMPTY_CONFIG: OdooConfig = {
  url: '',
  database: '',
  username: '',
  apiKey: '',
};

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    connected: 'bg-emerald-400 shadow-emerald-400/50',
    connecting: 'bg-amber-400 shadow-amber-400/50 animate-pulse',
    error: 'bg-red-400 shadow-red-400/50',
    disconnected: 'bg-slate-600',
  };
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full shadow-md ${colors[status] ?? colors.disconnected}`}
    />
  );
}

export default function OdooIntegrationPanel() {
  const {
    odooConfig,
    integrationStatus,
    connectionError,
    lastConnectedAt,
    syncRecords,
    setOdooConfig,
    testConnection,
    disconnect,
    syncAllTasks,
  } = useIntegrationStore();

  const { tasks } = useTaskStore();

  const [form, setForm] = useState<OdooConfig>(odooConfig ?? EMPTY_CONFIG);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isConnected = integrationStatus === 'connected';
  const activeTasks = tasks.filter((t) => !t.deletedAt);
  const syncedCount = Object.values(syncRecords).filter((r) => r.status === 'synced').length;
  const failedCount = Object.values(syncRecords).filter((r) => r.status === 'failed').length;

  const handleTest = async () => {
    setOdooConfig(form);
    setIsTesting(true);
    await testConnection();
    setIsTesting(false);
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    await syncAllTasks(tasks);
    setIsSyncing(false);
  };

  const handleField = (key: keyof OdooConfig, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      {/* Card header — always visible */}
      <button
        id="odoo-panel-toggle"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-3">
          {/* Odoo logo mark */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#714B67] to-[#017E84]">
            <OdooIcon />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">Odoo</span>
              <StatusDot status={integrationStatus} />
              <span className={`text-xs font-medium capitalize ${
                isConnected ? 'text-emerald-400' : integrationStatus === 'error' ? 'text-red-400' : 'text-slate-500'
              }`}>
                {integrationStatus === 'connected'
                  ? 'Terhubung'
                  : integrationStatus === 'connecting'
                  ? 'Menghubungkan...'
                  : integrationStatus === 'error'
                  ? 'Error'
                  : 'Belum terhubung'}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Sinkronisasi task ke project.task Odoo via JSON-RPC API
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="hidden flex-col items-end gap-0.5 sm:flex">
              <span className="text-xs font-semibold text-emerald-400">{syncedCount} synced</span>
              {failedCount > 0 && (
                <span className="text-[11px] text-red-400">{failedCount} failed</span>
              )}
            </div>
          )}
          <ChevronIcon open={expanded} />
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-white/[0.06]">
          {/* Connection form */}
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">
                URL Odoo <span className="text-slate-600">(https://...)</span>
              </label>
              <input
                id="odoo-url"
                type="url"
                value={form.url}
                onChange={(e) => handleField('url', e.target.value)}
                placeholder="https://mycompany.odoo.com"
                disabled={isConnected}
                className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Nama Database</label>
              <input
                id="odoo-database"
                type="text"
                value={form.database}
                onChange={(e) => handleField('database', e.target.value)}
                placeholder="mycompany"
                disabled={isConnected}
                className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Username / Email</label>
              <input
                id="odoo-username"
                type="email"
                value={form.username}
                onChange={(e) => handleField('username', e.target.value)}
                placeholder="admin@mycompany.com"
                disabled={isConnected}
                className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">
                API Key <span className="text-slate-600">(Settings → API Keys)</span>
              </label>
              <div className="relative">
                <input
                  id="odoo-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={form.apiKey}
                  onChange={(e) => handleField('apiKey', e.target.value)}
                  placeholder="••••••••••••••••"
                  disabled={isConnected}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showApiKey ? '🙈' : '👁'}
                </button>
              </div>
            </div>
          </div>

          {/* Error message */}
          {connectionError && (
            <div className="mx-5 mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <span className="mt-0.5 text-red-400">⚠</span>
              <div>
                <p className="text-xs font-semibold text-red-400">Koneksi Gagal</p>
                <p className="mt-0.5 text-xs text-red-400/70">{connectionError}</p>
              </div>
            </div>
          )}

          {/* Connection info if connected */}
          {isConnected && odooConfig && (
            <div className="mx-5 mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-400">✓ Terhubung ke Odoo</p>
                  <p className="mt-0.5 text-xs text-emerald-400/70">
                    {odooConfig.url} · UID: {odooConfig.uid}
                    {lastConnectedAt && (
                      <> · Sejak {lastConnectedAt.toLocaleTimeString('id-ID')}</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {!isConnected ? (
                <button
                  id="odoo-test-connection"
                  onClick={handleTest}
                  disabled={isTesting || !form.url || !form.apiKey}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isTesting ? (
                    <><span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" /> Menguji...</>
                  ) : (
                    <><PlugIcon /> Uji Koneksi</>
                  )}
                </button>
              ) : (
                <>
                  <button
                    id="odoo-sync-all"
                    onClick={handleSyncAll}
                    disabled={isSyncing}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500 active:scale-95 disabled:opacity-60"
                  >
                    {isSyncing ? (
                      <><span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" /> Sync ({activeTasks.length} tasks)...</>
                    ) : (
                      <><SyncIcon /> Sync Semua ({activeTasks.length} tasks)</>
                    )}
                  </button>
                  <button
                    id="odoo-disconnect"
                    onClick={disconnect}
                    className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                  >
                    Putuskan
                  </button>
                </>
              )}
            </div>

            {/* Sync summary */}
            {isConnected && (
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="text-emerald-400 font-medium">{syncedCount} synced</span>
                {failedCount > 0 && <span className="text-red-400 font-medium">{failedCount} failed</span>}
                <span>{activeTasks.length - syncedCount - failedCount} belum</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OdooIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="white" fillOpacity="0.15" />
      <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function PlugIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}
