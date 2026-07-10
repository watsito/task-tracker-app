'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';

const CHANNELS = [
  { key: 'email', label: 'Email', icon: '📧' },
  { key: 'googleAds', label: 'Google Ads', icon: '🔍' },
  { key: 'metaAds', label: 'Meta Ads', icon: '📣' },
  { key: 'tender', label: 'Tender', icon: '📥' },
  { key: 'socialMedia', label: 'Social Media', icon: '📱' },
  { key: 'linkedin', label: 'Linkedin', icon: '🎯' },
  { key: 'referral', label: 'Referral', icon: '👥' },
  { key: 'inboundWa', label: 'WhatsApp', icon: '☎️' },
  { key: 'web', label: 'Web', icon: '🌐' },
  { key: 'ka', label: 'KA', icon: '👩🏻‍💻' },
  { key: 'mes', label: 'MES', icon: '🕵🏼' },
  { key: 'community', label: 'Community MES/KA/Event', icon: '👤' },
  { key: 'other', label: 'Other', icon: '🔁' },
] as const;

type ChannelKey = (typeof CHANNELS)[number]['key'];

interface LeadEntryItem {
  id: string;
  channel: string;
  name: string;
  phoneNumber: string;
  email: string;
  companyName: string;
  jobTitle: string;
  typeOfNeed: string;
  infoSource: string;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
}

interface LeadSourceDetail {
  id: string;
  title: string;
  monthLabel: string;
  period: string;
  totalLeads: number;
  entries: LeadEntryItem[];
}

export default function DashboardMarketingDetailsPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <DashboardMarketingDetailsContent />
    </AuthGuard>
  );
}

function DashboardMarketingDetailsContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const defaultChannel = searchParams.get('channel');
  const [detail, setDetail] = useState<LeadSourceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedChannel] = useState<ChannelKey | 'all'>(() => defaultChannel && CHANNELS.some((channel) => channel.key === defaultChannel) ? defaultChannel as ChannelKey : 'all');
  const [selectedNeedType, setSelectedNeedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (!params?.id) return;

    const load = async () => {
      try {
        if (params.id === 'all') {
          const response = await fetch('/api/lead-sources');
          const data = response.ok ? await response.json() : [];
          if (!Array.isArray(data)) {
            setDetail(null);
            return;
          }

          const combinedEntries = data.flatMap((entry) =>
            (entry.entries ?? []).map((lead: LeadEntryItem) => ({
              ...lead,
              createdBy: lead.createdBy ?? entry.createdBy,
            }))
          );

          const aggregateChannels: Record<string, number> = {};
          data.forEach((entry) => {
            CHANNELS.forEach((channel) => {
              aggregateChannels[channel.key] = (aggregateChannels[channel.key] || 0) + (entry.channels?.[channel.key] ?? 0);
            });
          });

          setDetail({
            id: 'all',
            title: 'Semua Periode',
            monthLabel: 'Semua Bulan',
            period: 'Akumulasi seluruh periode',
            totalLeads: data.reduce((sum, entry) => sum + (entry.totalLeads ?? 0), 0),
            entries: combinedEntries,
          });
          return;
        }

        const response = await fetch(`/api/lead-sources/${params.id}`);
        const data = response.ok ? await response.json() : null;
        setDetail(data);
      } catch {
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [params?.id, searchParams]);

  const availableNeedTypes = useMemo(() => {
    const values = new Set<string>();
    detail?.entries.forEach((entry) => {
      if (entry.typeOfNeed) values.add(entry.typeOfNeed);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [detail]);

  const filteredEntries = useMemo(() => {
    if (!detail) return [];
    const query = search.trim().toLowerCase();
    return detail.entries.filter((entry) => {
      const matchesChannel = selectedChannel === 'all' || entry.channel === selectedChannel;
      const matchesNeedType = selectedNeedType === 'all' || entry.typeOfNeed === selectedNeedType;
      const matchesSearch = !query || [
        entry.name,
        entry.phoneNumber,
        entry.email,
        entry.companyName,
        entry.jobTitle,
        entry.typeOfNeed,
        entry.infoSource,
        entry.createdBy?.name ?? '',
      ].some((value) => value.toLowerCase().includes(query));
      return matchesChannel && matchesNeedType && matchesSearch;
    });
  }, [detail, search, selectedChannel, selectedNeedType]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / ITEMS_PER_PAGE));
  const effectivePage = Math.max(1, Math.min(currentPage, totalPages));
  const paginatedEntries = useMemo(() => {
    const start = (effectivePage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEntries, effectivePage]);
  const pageStart = filteredEntries.length === 0 ? 0 : (effectivePage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(effectivePage * ITEMS_PER_PAGE, filteredEntries.length);
  const selectedChannelMeta = selectedChannel === 'all'
    ? { icon: '📋', label: 'Semua Channel' }
    : CHANNELS.find((channel) => channel.key === selectedChannel) ?? { icon: '📌', label: selectedChannel };

  if (loading) {
    return (
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-10 md:px-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500 dark:border-white/10" />
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 transition hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeftIcon />
          Back to Dashboard
        </Link>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <p className="text-sm text-gray-400 dark:text-slate-500">Detail dashboard tidak ditemukan.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 transition hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeftIcon />
        Back to Dashboard
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-2xl">{selectedChannelMeta.icon}</span>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
          Detail Input: {selectedChannelMeta.label}
        </h1>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${detail.id === 'all' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'}`}>
          {detail.id === 'all' ? 'Mode: Semua Periode' : 'Mode: Periode Tertentu'}
        </span>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          {filteredEntries.length} leads
        </span>
      </div>


      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_220px] lg:grid-cols-[1fr_220px_220px]">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search leads..." className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
        <select value={selectedNeedType} onChange={(e) => { setSelectedNeedType(e.target.value); setCurrentPage(1); }} className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
          <option value="all">All Need Types</option>
          {availableNeedTypes.map((needType) => (<option key={needType} value={needType}>{needType}</option>))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <p className="text-sm text-gray-400 dark:text-slate-500">Belum ada detail lead yang cocok dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">#</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Phone</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Company</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Position</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Need Type</th>
                    {selectedChannel === 'other' && (
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Information Source</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                  {paginatedEntries.map((entry, index) => {
                    const channel = CHANNELS.find((item) => item.key === entry.channel);
                    const rowNumber = (effectivePage - 1) * ITEMS_PER_PAGE + index + 1;
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-slate-100">{rowNumber}.</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-slate-100">{entry.name} - {channel?.label ?? entry.channel}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">{entry.phoneNumber}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">{entry.email}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">{entry.companyName}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">{entry.jobTitle}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">{entry.typeOfNeed || '-'}</td>
                        {selectedChannel === 'other' && (
                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">{entry.infoSource || '-'}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02] sm:flex-row">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Menampilkan <span className="font-semibold text-gray-700 dark:text-slate-200">{pageStart}</span>–<span className="font-semibold text-gray-700 dark:text-slate-200">{pageEnd}</span> dari <span className="font-semibold text-gray-700 dark:text-slate-200">{filteredEntries.length}</span> data
                </p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={effectivePage === 1} className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                    <ArrowLeftIcon />
                    Sebelumnya
                  </button>
                  <span className="px-1 text-xs font-semibold text-gray-600 dark:text-slate-400">{effectivePage} / {totalPages}</span>
                  <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={effectivePage === totalPages} className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                    Berikutnya
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
    </svg>
  );
}
