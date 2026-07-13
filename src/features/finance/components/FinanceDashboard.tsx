'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Ringkasan Status Termin</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Pantau kesiapan penagihan dan realisasi pencairan setiap termin.</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-white/[0.04] dark:text-slate-400">
            {summary.terminBillingSummary.reduce((total, item) => total + item.count, 0)} Termin
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TerminStatusPanel
            title="Status Penagihan"
            subtitle="Kesiapan termin untuk mulai ditagihkan"
            items={summary.terminBillingSummary}
            tone="billing"
          />
          <TerminStatusPanel
            title="Status Pencairan"
            subtitle="Realisasi dana yang sudah atau belum cair"
            items={summary.terminDisbursementSummary}
            tone="disbursement"
          />
        </div>
      </section>
    </div>
  );
}

function TerminStatusPanel({
  title,
  subtitle,
  items,
  tone,
}: {
  title: string;
  subtitle: string;
  items: Array<{
    status: string;
    label: string;
    count: number;
    totalValue: number;
    terminDetails: Array<{ projectId: string; projectName: string; count: number; totalValue: number }>;
  }>;
  tone: 'billing' | 'disbursement';
}) {
  const totalCount = items.reduce((total, item) => total + item.count, 0);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">{title}</h3>
        <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-500">{subtitle}</p>
      </div>

      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-slate-500">⌕</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Cari nama project..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/20 dark:border-white/[0.08] dark:bg-slate-900/60 dark:text-slate-200 dark:placeholder:text-slate-600"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => {
          const active = index === 1;
          const activeClasses = tone === 'billing'
            ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
            : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300';
          const inactiveClasses = 'border-gray-200 bg-white text-gray-600 dark:border-white/[0.07] dark:bg-slate-900/60 dark:text-slate-400';
          const ratio = totalCount === 0 ? 0 : (item.count / totalCount) * 100;
          const normalizedQuery = searchQuery.trim().toLocaleLowerCase('id');
          const visibleDetails = normalizedQuery
            ? item.terminDetails.filter((detail) => detail.projectName.toLocaleLowerCase('id').includes(normalizedQuery))
            : item.terminDetails;

          return (
            <div key={item.status} className={`rounded-2xl border p-4 ${active ? activeClasses : inactiveClasses}`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide">{item.label}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="mt-1 text-[11px] opacity-75">termin</p>
                </div>
                <span className="rounded-full bg-black/[0.05] px-2 py-1 text-[10px] font-bold dark:bg-white/[0.06]">{ratio.toFixed(1)}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/[0.08]">
                <div className="h-full rounded-full bg-current opacity-70" style={{ width: `${ratio}%` }} />
              </div>
              <p className="mt-3 text-xs font-semibold">{formatCurrency(item.totalValue)}</p>

              <div className="mt-4 border-t border-current/15 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Dari Project</p>
                  <span className="text-[10px] font-semibold opacity-60">{visibleDetails.length} project</span>
                </div>

                <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                  {visibleDetails.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-current/20 px-2 py-3 text-center text-[10px] opacity-60">Tidak ada project yang cocok.</p>
                  ) : (
                    visibleDetails.map((detail) => (
                      <div key={detail.projectName} className="rounded-xl border border-current/15 bg-white/50 px-3 py-2 dark:bg-black/10">
                        <Link
                          href={`/finance/project/${detail.projectId}`}
                          className="block truncate text-[11px] font-semibold underline-offset-2 transition hover:underline"
                          title={`Lihat detail ${detail.projectName}`}
                        >
                          {detail.projectName}
                        </Link>
                        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] opacity-75">
                          <span>{detail.count} termin</span>
                          <span className="font-semibold">{formatCurrency(detail.totalValue)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
