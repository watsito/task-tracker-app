'use client';

import type { MarketingLeadSourceEntry } from './MarketingReportsContent';

export default function MarketingReportStats({
  entries,
  channelBreakdown,
}: {
  entries: MarketingLeadSourceEntry[];
  channelBreakdown: Record<string, number>;
}) {
  const totalLeads = entries.reduce((sum, entry) => sum + entry.totalLeads, 0);
  const totalEntries = entries.length;
  const averageLeads = totalEntries > 0 ? (totalLeads / totalEntries).toFixed(1) : '0';
  const topChannel = Object.entries(channelBreakdown).sort(([, a], [, b]) => b - a)[0];
  const latest = entries[0];
  const previous = entries[1];
  const growth = latest && previous
    ? previous.totalLeads === 0
      ? latest.totalLeads > 0 ? 100 : 0
      : ((latest.totalLeads - previous.totalLeads) / previous.totalLeads) * 100
    : null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <StatCard label="Total Periode" value={totalEntries} sub="lead source tersimpan" accent="text-indigo-500" />
      <StatCard label="Total Leads" value={totalLeads} sub="akumulasi semua periode" accent="text-emerald-500" />
      <StatCard label="Rata-rata" value={averageLeads} sub="leads per periode" accent="text-sky-500" />
      <StatCard label="Top Channel" value={topChannel ? topChannel[0] : '-'} sub={topChannel ? `${topChannel[1]} leads` : 'belum ada data'} accent="text-amber-500" />
      <StatCard label="Growth" value={growth === null ? '-' : `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`} sub={latest && previous ? 'periode terbaru vs sebelumnya' : 'butuh 2 periode'} accent={growth !== null && growth >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-slate-900/80">
      <span className={`text-xs font-semibold uppercase tracking-wider ${accent}`}>{label}</span>
      <p className="mt-2 text-3xl font-black tabular-nums text-gray-900 dark:text-slate-100">{value}</p>
      <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">{sub}</p>
    </div>
  );
}
