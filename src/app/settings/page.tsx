'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import { useAuthStore } from '@/features/tasks/store/authStore';
import { UserManagement } from '@/app/users/page';
import { PageKey, PAGES, PAGE_LABELS } from '@/features/tasks/types/user';

type SettingsTab = 'users' | 'roles' | 'integrations';

const TABS: { key: SettingsTab; label: string; icon: string }[] = [
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'roles', label: 'Role & Permission', icon: '🛡️' },
  { key: 'integrations', label: 'Integrations', icon: '🔗' },
];

const COMING_SOON = [
  { name: 'Jira', icon: '🔷', desc: 'Sinkronisasi issue dan sprint' },
  { name: 'Slack', icon: '💬', desc: 'Notifikasi perubahan task' },
  { name: 'Google Workspace', icon: '📅', desc: 'Sync ke Google Tasks & Calendar' },
  { name: 'GitHub', icon: '🐙', desc: 'Link task ke pull request' },
];

export default function SettingsPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [activeTab, setActiveTab] = useState<SettingsTab>('users');

  if (currentUser?.role !== 'admin') {
    return (
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-5 py-10">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-5 text-sm text-red-300">
          Halaman ini hanya bisa diakses oleh admin.
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg shadow-slate-500/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Pengaturan</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Kelola user, role, dan integrasi aplikasi</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-gray-900 text-white shadow-lg dark:bg-white/10 dark:text-slate-100'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'roles' && <RoleAndPermission />}
      {activeTab === 'integrations' && <IntegrationsTab />}
    </main>
  );
}

// ─── Role & Permission Tab ─────────────────────────────────────────────────

type RoleKey = 'admin' | 'member-ops' | 'member-mkt' | 'member-mgmt' | 'member-all' | 'member-finance';

type RoleOption = {
  key: RoleKey;
  label: string;
  desc: string;
  icon: string;
};

type RolePageAccess = Record<RoleKey, Record<PageKey, boolean>>;

const ROLE_PERMISSION_STORAGE_KEY = 'task_tracker_role_page_access';

const DEFAULT_ROLE_PAGE_ACCESS: RolePageAccess = {
  admin: {
    board: true,
    reports: true,
    integrations: true,
    form: true,
    users: true,
    settings: true,
    operationalDashboard: true,
    financeBoard: true,
    financeForm: true,
  },
  'member-ops': {
    board: true,
    reports: true,
    integrations: false,
    form: false,
    users: false,
    settings: false,
    operationalDashboard: true,
    financeBoard: false,
    financeForm: false,
  },
  'member-mkt': {
    board: true,
    reports: true,
    integrations: false,
    form: true,
    users: false,
    settings: false,
    operationalDashboard: false,
    financeBoard: false,
    financeForm: false,
  },
  'member-mgmt': {
    board: true,
    reports: false,
    integrations: false,
    form: false,
    users: false,
    settings: false,
    operationalDashboard: false,
    financeBoard: false,
    financeForm: false,
  },
  'member-all': {
    board: true,
    reports: true,
    integrations: true,
    form: true,
    users: false,
    settings: false,
    operationalDashboard: true,
    financeBoard: true,
    financeForm: true,
  },
  'member-finance': {
    board: false,
    reports: false,
    integrations: false,
    form: false,
    users: false,
    settings: false,
    operationalDashboard: false,
    financeBoard: true,
    financeForm: true,
  },
};

const ROLE_OPTIONS: RoleOption[] = [
  { key: 'admin', label: 'Admin', desc: 'Full access semua halaman & department', icon: '👑' },
  { key: 'member-ops', label: 'Member - Operational', desc: 'Akses task board & project', icon: '📋' },
  { key: 'member-mkt', label: 'Member - Marketing', desc: 'Akses lead sources & form', icon: '📣' },
  { key: 'member-mgmt', label: 'Member - Management', desc: 'Akses management board overview', icon: '📊' },
  { key: 'member-all', label: 'Member - Operational & Marketing', desc: 'Akses semua department', icon: '🔄' },
  { key: 'member-finance', label: 'Member - Finance', desc: 'Akses project finance & report', icon: '💼' },
];

function RoleAndPermission() {
  const [selectedRole, setSelectedRole] = useState<RoleKey>('admin');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [rolePageAccess, setRolePageAccess] = useState<RolePageAccess>(() => {
    if (typeof window === 'undefined') return DEFAULT_ROLE_PAGE_ACCESS;
    try {
      const stored = localStorage.getItem(ROLE_PERMISSION_STORAGE_KEY);
      if (!stored) return DEFAULT_ROLE_PAGE_ACCESS;
      const parsed = JSON.parse(stored) as Partial<RolePageAccess>;
      return {
        admin: { ...DEFAULT_ROLE_PAGE_ACCESS.admin, ...(parsed.admin ?? {}) },
        'member-ops': { ...DEFAULT_ROLE_PAGE_ACCESS['member-ops'], ...(parsed['member-ops'] ?? {}) },
        'member-mkt': { ...DEFAULT_ROLE_PAGE_ACCESS['member-mkt'], ...(parsed['member-mkt'] ?? {}) },
        'member-mgmt': { ...DEFAULT_ROLE_PAGE_ACCESS['member-mgmt'], ...(parsed['member-mgmt'] ?? {}) },
        'member-all': { ...DEFAULT_ROLE_PAGE_ACCESS['member-all'], ...(parsed['member-all'] ?? {}) },
        'member-finance': { ...DEFAULT_ROLE_PAGE_ACCESS['member-finance'], ...(parsed['member-finance'] ?? {}) },
      };
    } catch {
      return DEFAULT_ROLE_PAGE_ACCESS;
    }
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const togglePageAccess = (page: PageKey) => {
    setRolePageAccess((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [page]: !prev[selectedRole][page],
      },
    }));
  };

  const handleSavePermissions = () => {
    setSaving(true);
    try {
      localStorage.setItem(ROLE_PERMISSION_STORAGE_KEY, JSON.stringify(rolePageAccess));
      showToast('Permission role berhasil disimpan.');
    } catch {
      showToast('Gagal menyimpan permission role.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
      {/* Role Selector */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Role</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Pilih role untuk melihat & mengatur hak akses</p>
        <div className="mt-4 grid gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelectedRole(opt.key)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                selectedRole === opt.key
                  ? 'border-indigo-400/40 bg-indigo-500/10 ring-1 ring-indigo-500/20'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1]'
              }`}
            >
              <span className="text-lg">{opt.icon}</span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${selectedRole === opt.key ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-slate-200'}`}>{opt.label}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500">{opt.desc}</p>
              </div>
              {selectedRole === opt.key && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-indigo-500 dark:text-indigo-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Hak Akses Halaman */}
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-lg">{ROLE_OPTIONS.find((r) => r.key === selectedRole)?.icon}</span>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">{ROLE_OPTIONS.find((r) => r.key === selectedRole)?.label}</h2>
              <p className="text-[11px] text-gray-500 dark:text-slate-500">Hak akses halaman untuk role ini</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs text-gray-400 dark:text-slate-500">Pilih halaman mana saja yang bisa diakses oleh role ini</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {PAGES.map((page) => {
              const allowed = rolePageAccess[selectedRole][page];
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => togglePageAccess(page)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                    allowed
                      ? 'border-emerald-400/20 bg-emerald-500/8 hover:bg-emerald-500/12'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={`text-xs font-medium ${allowed ? 'text-gray-800 dark:text-slate-200' : 'text-gray-400 dark:text-slate-500'}`}>
                    {PAGE_LABELS[page]}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${allowed ? 'text-emerald-500' : 'text-gray-400 dark:text-slate-600'}`}>
                    {allowed ? 'On' : 'Off'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 dark:border-white/[0.06]">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSavePermissions}
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan Permission'}
            </button>
          </div>
        </div>
      </section>

      {toast && (
        <div className={`fixed right-5 top-5 z-[100] flex max-w-md items-start gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl shadow-black/40 backdrop-blur-md transition-all duration-300 ${
          toast.type === 'success'
            ? 'border-emerald-400/20 bg-emerald-500/15 text-emerald-300'
            : 'border-red-400/20 bg-red-500/15 text-red-300'
        }`}>
          <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
            toast.type === 'success'
              ? 'bg-emerald-500/20'
              : 'bg-red-500/20'
          }`}>
            {toast.type === 'success' ? <CheckIcon /> : <CloseIcon />}
          </div>
          <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >
            <CloseIcon />
          </button>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M18 6L6 18" /><path d="M6 6l12 12" />
    </svg>
  );
}

// ─── Integrations Tab ──────────────────────────────────────────────────────

type OdooConnectionStatus = 'loading' | 'connected' | 'error';

type OdooConnectionResponse = {
  success: boolean;
  uid?: number;
  serverVersion?: string | null;
  protocolVersion?: number | null;
  url?: string;
  database?: string;
  username?: string;
  errorMessage?: string;
};

function IntegrationsTab() {
  const [status, setStatus] = useState<OdooConnectionStatus>('loading');
  const [connection, setConnection] = useState<OdooConnectionResponse | null>(null);

  useEffect(() => {
    let active = true;

    const loadConnection = async () => {
      setStatus('loading');

      try {
        const response = await fetch('/api/integrations/odoo/test');
        const data = (await response.json()) as OdooConnectionResponse;

        if (!active) return;

        setConnection(data);
        setStatus(response.ok && data.success ? 'connected' : 'error');
      } catch {
        if (!active) return;

        setConnection({
          success: false,
          errorMessage: 'Tidak bisa mengecek koneksi Odoo dari browser.',
        });
        setStatus('error');
      }
    };

    void loadConnection();

    return () => {
      active = false;
    };
  }, []);

  const statusStyles: Record<OdooConnectionStatus, string> = {
    loading: 'bg-amber-400 shadow-amber-400/50 animate-pulse',
    connected: 'bg-emerald-400 shadow-emerald-400/50',
    error: 'bg-red-400 shadow-red-400/50',
  };

  const statusLabel: Record<OdooConnectionStatus, string> = {
    loading: 'Mengecek koneksi...',
    connected: 'Terhubung ke Odoo',
    error: 'Koneksi Odoo gagal',
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#714B67] to-[#017E84] shadow-lg shadow-[#714B67]/20">
              <OdooStatusIcon />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Odoo 16</h2>
                <span className={`inline-block h-2 w-2 rounded-full shadow-md ${statusStyles[status]}`} />
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-500">Status koneksi Odoo dari konfigurasi `.env` server</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.04]"
          >
            Cek Ulang
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className={`rounded-xl border px-4 py-3 ${status === 'connected' ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10' : status === 'error' ? 'border-red-300 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10' : 'border-amber-300 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'}`}>
            <p className={`text-sm font-semibold ${status === 'connected' ? 'text-emerald-700 dark:text-emerald-400' : status === 'error' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-300'}`}>
              {statusLabel[status]}
            </p>
            <p className={`mt-1 text-xs ${status === 'connected' ? 'text-emerald-600/80 dark:text-emerald-400/70' : status === 'error' ? 'text-red-600/80 dark:text-red-400/70' : 'text-amber-600/80 dark:text-amber-400/70'}`}>
              {status === 'connected'
                ? 'Server berhasil melakukan autentikasi XML-RPC ke Odoo.'
                : connection?.errorMessage ?? 'Sedang memeriksa koneksi ke Odoo.'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="URL Odoo" value={connection?.url ?? '-'} />
            <InfoCard label="Database" value={connection?.database ?? '-'} />
            <InfoCard label="UID" value={connection?.uid ? String(connection.uid) : '-'} />
            <InfoCard label="Versi Server" value={connection?.serverVersion ?? '-'} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Segera Hadir</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {COMING_SOON.map((item) => (
            <div key={item.name} className="flex items-center gap-3.5 rounded-xl border border-gray-200 bg-white px-4 py-3.5 opacity-50 dark:border-white/[0.06] dark:bg-slate-900/60">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-300">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-500">{item.desc}</p>
              </div>
              <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-slate-700/50 dark:text-slate-500">Soon</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-gray-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function OdooStatusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="white" fillOpacity="0.15" />
      <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
