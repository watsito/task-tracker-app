'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FinanceProjectRecord } from '@/features/finance/types/finance';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function FinanceReportsContent() {
  const [projects, setProjects] = useState<FinanceProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/finance-projects');
        const data = await response.json();
        if (active && response.ok && Array.isArray(data)) setProjects(data);
      } catch {
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const totalValue = useMemo(() => projects.reduce((sum, project) => sum + project.totalProject, 0), [projects]);
  const totalTermin = useMemo(() => projects.reduce((sum, project) => sum + project.termins.length, 0), [projects]);

  const exportCsv = () => {
    const rows = [
      ['Client', 'Project', 'Status', 'Date Start', 'Date End', 'Total Project', 'Termin Count', 'Termin Detail'].join(','),
      ...projects.map((project) => [
        project.clientName,
        project.projectName,
        project.status,
        project.dateStart ?? '',
        project.dateEnd ?? '',
        String(project.totalProject),
        String(project.termins.length),
        project.termins.map((termin) => `${termin.name}:${termin.percentage}%:${termin.billingDate ?? '-'}:${termin.description}`).join(' | '),
      ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ];

    triggerDownload(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' }), 'finance-projects.csv');
  };

  const exportJson = () => {
    triggerDownload(new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' }), 'finance-projects.json');
  };

  return (
    <div className="flex flex-col gap-8 p-5 md:p-8">
      <section className="grid gap-4 md:grid-cols-3">
        <Card label="Total Project" value={String(projects.length)} />
        <Card label="Total Nilai Project" value={formatCurrency(totalValue)} />
        <Card label="Total Termin" value={String(totalTermin)} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Export Report Finance</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Export data finance project untuk kebutuhan reporting.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={exportCsv} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.04]">Export CSV</button>
            <button type="button" onClick={exportJson} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500">Export JSON</button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-slate-500">Memuat report finance...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-white/[0.06]">
              <thead className="bg-gray-50 dark:bg-white/[0.03]">
                <tr>
                  {['Klien', 'Project', 'Status', 'Total', 'Termin', 'Keterangan'].map((label) => (
                    <th key={label} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-slate-100">{project.clientName}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-slate-300">{project.projectName}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400">{project.status}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-slate-200">{formatCurrency(project.totalProject)}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400">{project.termins.length} termin</td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400">{project.notes || '-'}</td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-slate-500">Belum ada data finance untuk report.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
