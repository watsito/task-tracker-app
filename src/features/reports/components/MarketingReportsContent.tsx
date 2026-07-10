'use client';

import { useEffect, useMemo, useState } from 'react';
import MarketingReportStats from './MarketingReportStats';
import MarketingChannelPerformance from './MarketingChannelPerformance';
import MarketingExportPanel from './MarketingExportPanel';

export interface MarketingLeadEntryDetail {
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

export interface MarketingLeadSourceEntry {
  id: string;
  title: string;
  monthLabel: string;
  period: string;
  channels: Record<string, number>;
  totalLeads: number;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
  entries?: MarketingLeadEntryDetail[];
}

export default function MarketingReportsContent() {
  const [entries, setEntries] = useState<MarketingLeadSourceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lead-sources')
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => { if (Array.isArray(data)) setEntries(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const channelBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    entries.forEach((entry) => {
      Object.entries(entry.channels).forEach(([channel, count]) => {
        breakdown[channel] = (breakdown[channel] || 0) + count;
      });
    });
    return breakdown;
  }, [entries]);

  const leadEntries = useMemo(() => {
    return entries.flatMap((entry) =>
      (entry.entries ?? []).map((lead) => ({
        ...lead,
        leadSourceId: entry.id,
        leadSourceTitle: entry.title,
        leadSourcePeriod: entry.period,
      }))
    );
  }, [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500 dark:border-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionLabel icon="📊" title="Ringkasan & Statistik Marketing" />
        <MarketingReportStats entries={entries} channelBreakdown={channelBreakdown} />
      </section>

      <section>
        <SectionLabel icon="📈" title="Performa Channel" />
        <MarketingChannelPerformance channelBreakdown={channelBreakdown} totalLeads={entries.reduce((sum, entry) => sum + entry.totalLeads, 0)} />
      </section>

      <section>
        <SectionLabel icon="📤" title="Export Data Marketing" />
        <MarketingExportPanel entries={entries} leadEntries={leadEntries} channelBreakdown={channelBreakdown} />
      </section>

      <section>
        <SectionLabel icon="📋" title="Semua Lead Source" />
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Tanggal</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Judul</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Periode</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Total Leads</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Input Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{new Date(entry.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-slate-100">{entry.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">{entry.period}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-gray-900 dark:text-white">{entry.totalLeads}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{entry.createdBy?.name ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span>{icon}</span>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{title}</h2>
      <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.05]" />
    </div>
  );
}
