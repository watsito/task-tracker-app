'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MarketingLeadEntryDetail, MarketingLeadSourceEntry } from './MarketingReportsContent';

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  googleAds: 'Google Ads',
  metaAds: 'Meta Ads',
  tender: 'Tender',
  socialMedia: 'Social Media',
  linkedin: 'Linkedin',
  referral: 'Referral',
  inboundWa: 'WhatsApp',
  web: 'Web',
  ka: 'KA',
  mes: 'MES',
  community: 'Community',
  other: 'Other',
};

type LeadEntryExportItem = MarketingLeadEntryDetail & {
  leadSourceId: string;
  leadSourceTitle: string;
  leadSourcePeriod: string;
};

export default function MarketingExportPanel({
  entries,
  leadEntries,
  channelBreakdown,
}: {
  entries: MarketingLeadSourceEntry[];
  leadEntries: LeadEntryExportItem[];
  channelBreakdown: Record<string, number>;
}) {
  const [justExported, setJustExported] = useState<'csv' | 'json' | 'pdf' | null>(null);

  const totalLeads = entries.reduce((sum, entry) => sum + entry.totalLeads, 0);
  const topChannel = Object.entries(channelBreakdown).sort(([, a], [, b]) => b - a)[0];

  const markDone = (format: 'csv' | 'json' | 'pdf') => {
    setJustExported(format);
    setTimeout(() => setJustExported(null), 2500);
  };

  const exportCsv = () => {
    const headers = [
      'LeadSourceTitle',
      'Period',
      'Channel',
      'Name',
      'PhoneNumber',
      'Email',
      'CompanyName',
      'JobTitle',
      'TypeOfNeed',
      'InformationSource',
      'InputBy',
      'InputDate',
    ];
    const rows = leadEntries.map((entry) => [
      entry.leadSourceTitle,
      entry.leadSourcePeriod,
      CHANNEL_LABELS[entry.channel] ?? entry.channel,
      entry.name,
      entry.phoneNumber,
      entry.email,
      entry.companyName,
      entry.jobTitle,
      entry.typeOfNeed,
      entry.infoSource || '-',
      entry.createdBy?.name ?? '-',
      new Date(entry.createdAt).toLocaleDateString('id-ID'),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'marketing-lead-detail-report.csv';
    link.click();
    URL.revokeObjectURL(url);
    markDone('csv');
  };

  const exportJson = () => {
    const payload = {
      exportDate: new Date().toISOString(),
      reportType: 'marketing-report',
      summary: {
        totalLeadSources: entries.length,
        totalLeads,
        topChannel: topChannel ? { key: topChannel[0], label: CHANNEL_LABELS[topChannel[0]] ?? topChannel[0], total: topChannel[1] } : null,
        channelBreakdown,
      },
      leadSources: entries,
      leadEntries,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'marketing-report.json';
    link.click();
    URL.revokeObjectURL(url);
    markDone('json');
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Marketing Report', 14, 16);

    doc.setFontSize(10);
    doc.text(`Total Lead Sources: ${entries.length}`, 14, 26);
    doc.text(`Total Leads: ${totalLeads}`, 14, 32);
    doc.text(`Top Channel: ${topChannel ? `${CHANNEL_LABELS[topChannel[0]] ?? topChannel[0]} (${topChannel[1]})` : '-'}`, 14, 38);

    autoTable(doc, {
      startY: 46,
      head: [['Channel', 'Total Leads']],
      body: Object.entries(channelBreakdown).sort(([, a], [, b]) => b - a).map(([channel, total]) => [CHANNEL_LABELS[channel] ?? channel, String(total)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
      head: [['Tanggal', 'Judul', 'Periode', 'Total Leads', 'Input Oleh']],
      body: entries.map((entry) => [
        new Date(entry.createdAt).toLocaleDateString('id-ID'),
        entry.title,
        entry.period,
        String(entry.totalLeads),
        entry.createdBy?.name ?? '-',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
    });

    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
      head: [['Channel', 'Nama', 'Phone', 'Email', 'Company', 'Position', 'Need Type', 'Source Info']],
      body: leadEntries.map((entry) => [
        CHANNEL_LABELS[entry.channel] ?? entry.channel,
        entry.name,
        entry.phoneNumber,
        entry.email,
        entry.companyName,
        entry.jobTitle,
        entry.typeOfNeed,
        entry.infoSource || '-',
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [244, 114, 182] },
    });

    doc.save('marketing-report.pdf');
    markDone('pdf');
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-slate-900/80">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg shadow-indigo-500/25">
          <ExportIcon />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200">Export Data Marketing</h3>
          <p className="text-xs text-gray-500 dark:text-slate-500">Format export sudah disesuaikan untuk kebutuhan marketing</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400">
        <p>Akan mengekspor <span className="font-semibold text-gray-800 dark:text-slate-200">{entries.length} lead source</span> dan <span className="font-semibold text-gray-800 dark:text-slate-200">{leadEntries.length} detail lead</span>.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button onClick={exportCsv} className="flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20">
          {justExported === 'csv' ? <CheckIcon /> : <CsvIcon />}
          {justExported === 'csv' ? 'Berhasil!' : 'CSV'}
        </button>
        <button onClick={exportJson} className="flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20">
          {justExported === 'json' ? <CheckIcon /> : <JsonIcon />}
          {justExported === 'json' ? 'Berhasil!' : 'JSON'}
        </button>
        <button onClick={exportPdf} className="flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20">
          {justExported === 'pdf' ? <CheckIcon /> : <PdfIcon />}
          {justExported === 'pdf' ? 'Berhasil!' : 'PDF'}
        </button>
      </div>
    </div>
  );
}

function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
function CsvIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
}
function JsonIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
function PdfIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15v-6h3a2 2 0 010 4h-3"/></svg>;
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
