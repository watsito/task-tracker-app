'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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

export default function LeadSourceDetailPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <LeadSourceDetailContent />
    </AuthGuard>
  );
}

function LeadSourceDetailContent() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<LeadSourceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<ChannelKey | 'all'>('all');
  const [selectedNeedType, setSelectedNeedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/lead-sources/${params.id}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setDetail(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id]);

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
        <Link href="/lead-sources" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 transition hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeftIcon />
          Back to Lead Form
        </Link>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <p className="text-sm text-gray-400 dark:text-slate-500">Detail lead source tidak ditemukan.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
      <Link href="/lead-sources" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 transition hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeftIcon />
        Back to Lead Form
      </Link>

      <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-400">Channel Lead Details View</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-900 dark:text-white">{detail.title}</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{detail.monthLabel} • {detail.period} • {detail.totalLeads} leads</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setSelectedChannel('all'); setCurrentPage(1); }}
          className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${selectedChannel === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'}`}
        >
          Semua Channel
        </button>
        {CHANNELS.filter((channel) => detail.entries.some((entry) => entry.channel === channel.key)).map((channel) => (
          <button
            key={channel.key}
            type="button"
            onClick={() => { setSelectedChannel(channel.key); setCurrentPage(1); }}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${selectedChannel === channel.key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'}`}
          >
            {channel.icon} {channel.label}
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_220px] lg:grid-cols-[1fr_220px_220px]">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Search leads..."
          className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
        />
        <select
          value={selectedNeedType}
          onChange={(e) => { setSelectedNeedType(e.target.value); setCurrentPage(1); }}
          className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
        >
          <option value="all">All Need Types</option>
          {availableNeedTypes.map((needType) => (
            <option key={needType} value={needType}>{needType}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <p className="text-sm text-gray-400 dark:text-slate-500">Belum ada detail lead yang cocok dengan filter.</p>
          </div>
        ) : (
          <>
            {paginatedEntries.map((entry) => {
              const channel = CHANNELS.find((item) => item.key === entry.channel);
              return (
                <div key={entry.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{channel?.icon ?? '📌'}</span>
                        <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">{entry.name}</h2>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">{new Date(entry.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                      {channel?.label ?? entry.channel}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <DetailItem label="Phone Number" value={entry.phoneNumber} />
                    <DetailItem label="Email" value={entry.email} />
                    <DetailItem label="Company Name" value={entry.companyName} />
                    <DetailItem label="Position" value={entry.jobTitle} />
                    <DetailItem label="Need Type" value={entry.typeOfNeed || '-'} />
                    <DetailItem label="Source Info" value={entry.infoSource || '-'} />
                    <DetailItem label="Diinput Oleh" value={entry.createdBy?.name ?? '-'} />
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80 sm:flex-row">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Menampilkan <span className="font-semibold text-gray-700 dark:text-slate-200">{pageStart}</span>–<span className="font-semibold text-gray-700 dark:text-slate-200">{pageEnd}</span> dari <span className="font-semibold text-gray-700 dark:text-slate-200">{filteredEntries.length}</span> data
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={effectivePage === 1}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <ArrowLeftIcon />
                    Sebelumnya
                  </button>
                  <span className="px-1 text-xs font-semibold text-gray-600 dark:text-slate-400">
                    {effectivePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={effectivePage === totalPages}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    Berikutnya
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800 dark:text-slate-200">{value}</p>
    </div>
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
