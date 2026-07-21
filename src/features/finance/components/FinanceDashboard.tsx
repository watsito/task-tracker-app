'use client';

import { useMemo } from 'react';
import type { FinanceDashboardSummary } from '../types/finance';

interface FinanceDashboardProps {
  summary: FinanceDashboardSummary;
}

const STATUS_LABELS: Record<FinanceDashboardSummary['byStatus'][number]['status'], string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const STATUS_COLORS: Record<FinanceDashboardSummary['byStatus'][number]['status'], string> = {
  PENDING: 'from-amber-500 to-orange-500',
  IN_PROGRESS: 'from-blue-600 to-indigo-700',
  DONE: 'from-emerald-600 to-teal-700',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FinanceDashboard({ summary }: FinanceDashboardProps) {
  const totalStatusCount = useMemo(
    () => summary.byStatus.reduce((total, item) => total + item.count, 0),
    [summary.byStatus]
  );

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Project" value={String(summary.totalProjects)} sub="Data finance aktif" icon="📁" />
        <StatCard label="Total Nilai Project" value={formatCurrency(summary.totalProjectValue)} sub="Akumulasi seluruh project" icon="💰" />
        <StatCard label="Total Nilai Termin" value={formatCurrency(summary.totalTerminAmount)} sub="Estimasi nominal termin" icon="🧾" />
        <StatCard label="Rata-rata Termin" value={summary.averageTerminPerProject.toFixed(1)} sub="Per project" icon="📊" />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Distribusi Status Finance</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Ringkasan status project finance saat ini</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-white/[0.04] dark:text-slate-400">
            {totalStatusCount} Project
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {summary.byStatus.map((item) => {
            const ratio = totalStatusCount === 0 ? 0 : (item.count / totalStatusCount) * 100;
            return (
              <div key={item.status} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white ${STATUS_COLORS[item.status]}`}>
                  {STATUS_LABELS[item.status]}
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-slate-100">{item.count}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">{ratio.toFixed(1)}% dari seluruh project</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.08]">
                  <div className={`h-full rounded-full bg-gradient-to-r ${STATUS_COLORS[item.status]}`} style={{ width: `${ratio}%` }} />
                </div>
                <p className="mt-3 text-xs font-semibold text-gray-700 dark:text-slate-300">{formatCurrency(item.totalValue)}</p>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">{sub}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xl dark:bg-indigo-500/10">{icon}</div>
      </div>
    </div>
  );
}
