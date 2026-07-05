import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import OdooIntegrationPanel from '@/features/integrations/components/OdooIntegrationPanel';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integrations — Task Tracker',
  description: 'Kelola integrasi Task Tracker dengan aplikasi eksternal seperti Odoo.',
};

const COMING_SOON = [
  { name: 'Jira', icon: '🔷', desc: 'Sinkronisasi issue dan sprint' },
  { name: 'Slack', icon: '💬', desc: 'Notifikasi perubahan task' },
  { name: 'Google Workspace', icon: '📅', desc: 'Sync ke Google Tasks & Calendar' },
  { name: 'GitHub', icon: '🐙', desc: 'Link task ke pull request' },
];

export default function IntegrationsPage() {
  return (
    <AuthGuard>
      <AppHeader />

      {/* Main content */}
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-5 py-10 md:px-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-indigo-500/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Integrations</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">Hubungkan Task Tracker ke aplikasi eksternal Anda</p>
            </div>
          </div>
        </div>

        {/* Architecture notice */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 dark:border-amber-500/20 dark:bg-amber-500/10">
          <span className="mt-0.5 text-amber-600 dark:text-amber-400">🔗</span>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Bridge Architecture</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-600/80 dark:text-amber-400/70">
              Semua komunikasi ke Odoo dikelola oleh <code className="rounded bg-amber-100 px-1 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">odooService.ts</code>.
              Ganti stub dengan implementasi nyata saat siap tanpa mengubah komponen UI atau store.
            </p>
          </div>
        </div>

        {/* Active integrations */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">
            Tersedia
          </h2>
          <OdooIntegrationPanel />
        </section>

        {/* Coming soon */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">
            Segera Hadir
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {COMING_SOON.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3.5 rounded-xl border border-gray-200 bg-white px-4 py-3.5 opacity-50 dark:border-white/[0.06] dark:bg-slate-900/60"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-300">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-500">{item.desc}</p>
                </div>
                <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-slate-700/50 dark:text-slate-500">
                  Soon
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Data flow diagram */}
        <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-slate-900/60">
          <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-slate-300">Alur Data Sinkronisasi</h2>
          <div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs">
            {[
              { label: 'Task Tracker', sub: 'Zustand Store', color: 'from-indigo-600 to-purple-700' },
              null,
              { label: 'odooService.ts', sub: 'Bridge Layer', color: 'from-violet-600 to-indigo-700' },
              null,
              { label: 'Odoo API', sub: 'JSON-RPC', color: 'from-[#714B67] to-[#017E84]' },
              null,
              { label: 'project.task', sub: 'Odoo Model', color: 'from-emerald-600 to-teal-700' },
            ].map((item, i) =>
              item === null ? (
                <svg key={i} width="24" height="16" viewBox="0 0 24 16" fill="none" className="text-gray-400 dark:text-slate-600">
                  <path d="M1 8h18M14 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <div key={item.label} className={`flex flex-col items-center gap-1 rounded-xl bg-gradient-to-br ${item.color} px-4 py-2.5 shadow-lg`}>
                  <span className="font-semibold text-white">{item.label}</span>
                  <span className="text-[10px] text-white/60">{item.sub}</span>
                </div>
              )
            )}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
