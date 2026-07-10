'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

interface LeadSourceEntry {
  id: string;
  team: string;
  formType: string;
  title: string;
  monthLabel: string;
  period: string;
  channels: Record<string, number>;
  totalLeads: number;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
  updatedBy?: { id: string; name: string } | null;
}

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email', googleAds: 'Google Ads', metaAds: 'Meta Ads', tender: 'Tender',
  socialMedia: 'Social Media', linkedin: 'Linkedin', referral: 'Referral',
  inboundWa: 'Inbound WA', web: 'Web', ka: 'KA', mes: 'MES',
  community: 'Community', other: 'Other',
};

const CHANNEL_ICONS: Record<string, string> = {
  email: '📧', googleAds: '🔍', metaAds: '📣', tender: '📥',
  socialMedia: '📱', linkedin: '🎯', referral: '👥',
  inboundWa: '☎️', web: '🌐', ka: '👩🏻‍💻', mes: '🕵🏼',
  community: '👤', other: '🔁',
};

const CHANNEL_ORDER = ['email', 'googleAds', 'metaAds', 'tender', 'socialMedia', 'linkedin', 'referral', 'inboundWa', 'web', 'ka', 'mes', 'community', 'other'];

export default function MarketingDashboard() {
  const [entries, setEntries] = useState<LeadSourceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPeriodId, setSelectedPeriodId] = useState<'all' | string>('all');
  const [periodSearch, setPeriodSearch] = useState('');
  const { theme } = useTheme();

  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    fetch('/api/lead-sources')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setEntries(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPeriodDisplay = (periodText: string) => {
    const parts = periodText.split(' - ');
    if (parts.length === 2 && parts[0].trim() === parts[1].trim()) {
      return parts[0].trim();
    }
    return periodText;
  };

  const totalLeads = useMemo(() => entries.reduce((sum, e) => sum + e.totalLeads, 0), [entries]);
  const totalEntries = entries.length;
  const totalPages = Math.max(1, Math.ceil(entries.length / ITEMS_PER_PAGE));
  const effectivePage = Math.max(1, Math.min(currentPage, totalPages));
  const paginatedEntries = useMemo(() => {
    const start = (effectivePage - 1) * ITEMS_PER_PAGE;
    return entries.slice(start, start + ITEMS_PER_PAGE);
  }, [entries, effectivePage]);
  const pageStart = entries.length === 0 ? 0 : (effectivePage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(effectivePage * ITEMS_PER_PAGE, entries.length);

  const channelBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    entries.forEach((e) => {
      Object.entries(e.channels).forEach(([ch, count]) => {
        breakdown[ch] = (breakdown[ch] || 0) + count;
      });
    });
    return breakdown;
  }, [entries]);

  const latest = entries[0];
  const previous = entries[1];

  const filteredPeriods = useMemo(() => {
    const query = periodSearch.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) =>
      entry.title.toLowerCase().includes(query) ||
      entry.period.toLowerCase().includes(query) ||
      entry.monthLabel.toLowerCase().includes(query)
    );
  }, [entries, periodSearch]);

  const selectedPeriodEntry = selectedPeriodId === 'all'
    ? null
    : entries.find((entry) => entry.id === selectedPeriodId) ?? null;

  const detailPeriodData = useMemo(() => {
    if (selectedPeriodEntry) {
      return {
        id: selectedPeriodEntry.id,
        title: selectedPeriodEntry.title,
        period: selectedPeriodEntry.period,
        monthLabel: selectedPeriodEntry.monthLabel,
        totalLeads: selectedPeriodEntry.totalLeads,
        channels: selectedPeriodEntry.channels,
        isAggregate: false,
      };
    }

    const aggregateChannels: Record<string, number> = {};
    entries.forEach((entry) => {
      CHANNEL_ORDER.forEach((channel) => {
        aggregateChannels[channel] = (aggregateChannels[channel] || 0) + (entry.channels[channel] ?? 0);
      });
    });

    return {
      id: null,
      title: 'Semua Periode',
      period: 'Akumulasi seluruh periode',
      monthLabel: 'Semua Bulan',
      totalLeads: entries.reduce((sum, entry) => sum + entry.totalLeads, 0),
      channels: aggregateChannels,
      isAggregate: true,
    };
  }, [entries, selectedPeriodEntry]);

  const growth = useMemo(() => {
    if (!latest || !previous) return null;
    if (previous.totalLeads === 0) return latest.totalLeads > 0 ? 100 : 0;
    return ((latest.totalLeads - previous.totalLeads) / previous.totalLeads) * 100;
  }, [latest, previous]);

  const topChannels = useMemo(() => {
    return Object.entries(channelBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [channelBreakdown]);

  const bottomChannels = useMemo(() => {
    return Object.entries(channelBreakdown)
      .sort(([, a], [, b]) => a - b)
      .filter(([, v]) => v === 0)
      .slice(0, 5);
  }, [channelBreakdown]);

  const teamBreakdown = useMemo(() => {
    const tb: Record<string, number> = {};
    entries.forEach((e) => { tb[e.team] = (tb[e.team] || 0) + e.totalLeads; });
    return tb;
  }, [entries]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  const chartLabels = CHANNEL_ORDER.filter((ch) => channelBreakdown[ch] > 0).map((ch) => CHANNEL_LABELS[ch] || ch);
  const chartData = CHANNEL_ORDER.filter((ch) => channelBreakdown[ch] > 0).map((ch) => channelBreakdown[ch]);

  const lineChartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Leads',
      data: chartData,
      borderColor: 'rgba(99, 102, 241, 1)',
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
      borderWidth: 2.5,
      pointBackgroundColor: 'rgba(99, 102, 241, 1)',
      pointBorderColor: isDark ? '#0f172a' : '#e5e7eb',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      tension: 0.4,
      fill: true,
    }],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#e2e8f0' : '#1a1a1a',
        bodyColor: isDark ? '#cbd5e1' : '#4b5563',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: isDark ? '#94a3b8' : '#6b7280', font: { size: 11 }, maxRotation: 45 } },
      y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }, ticks: { color: isDark ? '#94a3b8' : '#6b7280', font: { size: 11 } }, beginAtZero: true },
    },
  };

  const teamLabels = Object.keys(teamBreakdown).sort((a, b) => teamBreakdown[b] - teamBreakdown[a]);
  const doughnutColors = [
    'rgba(99, 102, 241, 0.85)', 'rgba(168, 85, 247, 0.85)', 'rgba(236, 72, 153, 0.85)',
    'rgba(245, 158, 11, 0.85)', 'rgba(16, 185, 129, 0.85)', 'rgba(59, 130, 246, 0.85)',
    'rgba(239, 68, 68, 0.85)', 'rgba(139, 92, 246, 0.85)', 'rgba(20, 184, 166, 0.85)',
    'rgba(251, 146, 60, 0.85)', 'rgba(34, 197, 94, 0.85)', 'rgba(168, 162, 158, 0.85)',
    'rgba(14, 165, 233, 0.85)',
  ];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-indigo-500 dark:text-indigo-300">Marketing Dashboard</p>
          <h1 className="mt-1 text-xl font-black tracking-tight text-gray-900 dark:text-white">Ringkasan Data Form</h1>
        </div>
        <Link href="/lead-sources" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500">
          Input Data
        </Link>
      </div>

      {/* Stat Cards — Ringkasan Utama */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Entri */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Total Entri</p>
          </div>
          <p className="mt-2 text-3xl font-black tabular-nums text-gray-900 dark:text-white">{totalEntries}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">form sudah diisi</p>
        </div>

        {/* Total Leads + Growth */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Total Leads</p>
            </div>
            {growth !== null && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${growth >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'}`}>
                {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="mt-2 text-3xl font-black tabular-nums text-gray-900 dark:text-white">{totalLeads.toLocaleString()}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">{previous ? `vs ${previous.totalLeads.toLocaleString()} periode lalu` : 'semua periode'}</p>
        </div>

        {/* Top Channel */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Top Channel</p>
          </div>
          {topChannels[0] ? (
            <>
              <p className="mt-2 text-xl font-black text-gray-900 dark:text-white">{CHANNEL_ICONS[topChannels[0][0]]} {CHANNEL_LABELS[topChannels[0][0]] || topChannels[0][0]}</p>
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">{topChannels[0][1]} leads ({totalLeads > 0 ? ((topChannels[0][1] / totalLeads) * 100).toFixed(1) : 0}%)</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-400 dark:text-slate-500">Belum ada data</p>
          )}
        </div>

        {/* Periode Terakhir */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Periode Terakhir</p>
          </div>
          <p className="mt-2 text-lg font-black text-gray-900 dark:text-white truncate">{latest?.period ?? '-'}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">{latest ? `${latest.totalLeads} leads · oleh ${latest.createdBy?.name ?? '-'}` : 'belum ada data'}</p>
        </div>
      </div>

      {/* Detail Data Periode */}
      {entries.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Detail Input</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">{detailPeriodData.period} · {detailPeriodData.title} · {detailPeriodData.monthLabel}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={periodSearch}
                onChange={(e) => setPeriodSearch(e.target.value)}
                placeholder="Cari periode..."
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              />
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value as 'all' | string)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              >
                <option value="all">Semua Periode</option>
                {filteredPeriods.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.period} — {entry.title} ({entry.totalLeads} leads)
                  </option>
                ))}
              </select>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">{detailPeriodData.totalLeads} leads</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {CHANNEL_ORDER.map((ch) => {
                const val = detailPeriodData.channels[ch] ?? 0;
                const pct = detailPeriodData.totalLeads > 0 ? (val / detailPeriodData.totalLeads) * 100 : 0;
                const detailLink = detailPeriodData.isAggregate
                  ? `/dashboard/marketing/details/all?channel=${ch}`
                  : `/dashboard/marketing/details/${detailPeriodData.id}?channel=${ch}`;
                const cardClasses = `flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition ${
                  val > 0
                    ? 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-300 hover:bg-indigo-100/70 dark:border-indigo-500/20 dark:bg-indigo-500/5 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-500/10'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04]'
                }`;
                const content = (
                  <>
                    <span className="text-base">{CHANNEL_ICONS[ch]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-gray-500 dark:text-slate-500">{CHANNEL_LABELS[ch]}</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold tabular-nums ${val > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-600'}`}>{val}</p>
                        {val > 0 && <span className="text-[10px] text-gray-400 dark:text-slate-500">{pct.toFixed(0)}%</span>}
                      </div>
                      <p className="mt-0.5 text-[10px] text-indigo-500 dark:text-indigo-400">Klik untuk lihat detail</p>
                    </div>
                  </>
                );

                return (
                  <Link key={ch} href={detailLink} className={cardClasses}>
                    {content}
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Distribusi Leads per Channel (Akumulasi)</h3>
            <span className="rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">{totalLeads.toLocaleString()} total</span>
          </div>
          <div className="mt-5 h-64">
            {chartLabels.length > 0 ? <Line data={lineChartData} options={lineChartOptions} /> : <div className="flex h-full items-center justify-center"><p className="text-sm text-gray-400 dark:text-slate-500">Belum ada data.</p></div>}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Distribusi per Tim</h3>
          <div className="mt-4 h-56">
            {teamLabels.length > 0 ? (
              <Doughnut data={{ labels: teamLabels, datasets: [{ data: teamLabels.map((t) => teamBreakdown[t]), backgroundColor: doughnutColors.slice(0, teamLabels.length), borderColor: isDark ? '#0f172a' : '#ffffff', borderWidth: 3, hoverOffset: 8 }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom' as const, labels: { color: isDark ? '#94a3b8' : '#6b7280', padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } } }, tooltip: { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)', titleColor: isDark ? '#e2e8f0' : '#1a1a1a', bodyColor: isDark ? '#cbd5e1' : '#4b5563', borderColor: 'rgba(99, 102, 241, 0.3)', borderWidth: 1, cornerRadius: 12, padding: 12 } } }} />
            ) : <div className="flex h-full items-center justify-center"><p className="text-sm text-gray-400 dark:text-slate-500">Belum ada data.</p></div>}
          </div>
        </div>
      </div>

      {/* Perbandingan Periode + Channel Ranking */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Perbandingan Periode */}
        {latest && previous && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Perbandingan Periode</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Periode terakhir vs sebelumnya</p>
            <div className="mt-4 space-y-3">
              {CHANNEL_ORDER.filter((ch) => (latest.channels[ch] ?? 0) > 0 || (previous.channels[ch] ?? 0) > 0).slice(0, 6).map((ch) => {
                const curr = latest.channels[ch] ?? 0;
                const prev = previous.channels[ch] ?? 0;
                const diff = curr - prev;
                return (
                  <div key={ch} className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm">{CHANNEL_ICONS[ch]}</span>
                    <span className="w-24 text-xs font-medium text-gray-600 dark:text-slate-400">{CHANNEL_LABELS[ch]}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="w-8 text-right text-xs font-bold tabular-nums text-gray-900 dark:text-white">{curr}</span>
                      <span className="text-[10px] text-gray-400">vs</span>
                      <span className="w-8 text-xs tabular-nums text-gray-400 dark:text-slate-500">{prev}</span>
                    </div>
                    <span className={`w-14 text-right text-[11px] font-bold tabular-nums ${diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : diff < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'}`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Channel Ranking */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Ranking Channel</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Top & bottom performers</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Top Performers</p>
              {topChannels.length > 0 ? topChannels.map(([ch, count], i) => (
                <div key={ch} className="flex items-center gap-3 py-1.5">
                  <span className="w-5 text-center text-xs font-bold text-gray-400 dark:text-slate-500">#{i + 1}</span>
                  <span className="text-sm">{CHANNEL_ICONS[ch]}</span>
                  <span className="flex-1 text-xs font-medium text-gray-700 dark:text-slate-300">{CHANNEL_LABELS[ch] || ch}</span>
                  <div className="w-20 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" style={{ width: totalLeads > 0 ? `${(count / totalLeads) * 100}%` : '0%' }} />
                  </div>
                  <span className="w-10 text-right text-xs font-bold tabular-nums text-gray-900 dark:text-white">{count}</span>
                </div>
              )) : <p className="text-xs text-gray-400 dark:text-slate-500">Belum ada data</p>}
            </div>
            {bottomChannels.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400">Belum Ada Data</p>
                {bottomChannels.map(([ch]) => (
                  <div key={ch} className="flex items-center gap-3 py-1.5">
                    <span className="text-sm opacity-50">{CHANNEL_ICONS[ch]}</span>
                    <span className="flex-1 text-xs text-gray-400 dark:text-slate-500">{CHANNEL_LABELS[ch] || ch}</span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-600">0 leads</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Semua Entri */}
      {entries.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Semua Data Form</h3>
            {totalPages > 1 && (
              <p className="text-xs text-gray-400 dark:text-slate-500">
                Halaman {effectivePage} / {totalPages}
              </p>
            )}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                  <th className="pb-2 font-semibold text-gray-500 dark:text-slate-400">Periode</th>
                  <th className="pb-2 font-semibold text-gray-500 dark:text-slate-400">Judul</th>
                  <th className="pb-2 font-semibold text-gray-500 dark:text-slate-400">Tim</th>
                  <th className="pb-2 text-right font-semibold text-gray-500 dark:text-slate-400">Leads</th>
                  <th className="pb-2 font-semibold text-gray-500 dark:text-slate-400">Diisi Oleh</th>
                  <th className="pb-2 text-right font-semibold text-gray-500 dark:text-slate-400">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {paginatedEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-2.5 font-medium text-gray-800 dark:text-slate-200">{formatPeriodDisplay(e.period)}</td>
                    <td className="py-2.5 text-gray-600 dark:text-slate-400 truncate max-w-[200px]">{e.title}</td>
                    <td className="py-2.5 text-gray-600 dark:text-slate-400">{e.team}</td>
                    <td className="py-2.5 text-right font-bold tabular-nums text-gray-900 dark:text-white">{e.totalLeads}</td>
                    <td className="py-2.5 text-gray-500 dark:text-slate-500">{e.createdBy?.name ?? '-'}</td>
                    <td className="py-2.5 text-right text-gray-400 dark:text-slate-500">{new Date(e.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/[0.06] sm:flex-row">
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Menampilkan <span className="font-semibold text-gray-700 dark:text-slate-200">{pageStart}</span>–<span className="font-semibold text-gray-700 dark:text-slate-200">{pageEnd}</span> dari <span className="font-semibold text-gray-700 dark:text-slate-200">{entries.length}</span> data
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={effectivePage === 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Sebelumnya
                </button>
                <span className="px-1 text-xs font-semibold text-gray-600 dark:text-slate-400">
                  {effectivePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={effectivePage === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  Berikutnya
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
