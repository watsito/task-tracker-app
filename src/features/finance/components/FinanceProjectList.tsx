'use client';

import Link from 'next/link';
import type { FinanceProjectRecord, FinanceTerminStatus } from '../types/finance';

interface FinanceProjectListProps {
  projects: FinanceProjectRecord[];
  deletingId: string | null;
  onDelete: (id: string) => void;
}

const TERMIN_STATUS_META: Record<FinanceTerminStatus, { label: string; classes: string }> = {
  OUTSTANDING: { label: 'Outstanding', classes: 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300' },
  TO_INVOICE: { label: 'To Invoice', classes: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300' },
  OPEN_INVOICE: { label: 'Open Invoice', classes: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300' },
  PAID: { label: 'Paid', classes: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300' },
};

const TERMIN_STATUS_ORDER: FinanceTerminStatus[] = ['OUTSTANDING', 'TO_INVOICE', 'OPEN_INVOICE', 'PAID'];

function getTerminStatusCounts(project: FinanceProjectRecord) {
  return TERMIN_STATUS_ORDER.map((status) => ({
    status,
    count: project.termins.filter((termin) => termin.termStatus === status).length,
  })).filter((item) => item.count > 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function FinanceProjectList({ projects, deletingId, onDelete }: FinanceProjectListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
        <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Data Finance Project</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Daftar project finance yang sudah diinput</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-white/[0.06]">
          <thead className="bg-gray-50 dark:bg-white/[0.03]">
            <tr>
              {['Klien', 'Project', 'Periode', 'Total', 'Status', 'Termin', 'Aksi'].map((label) => (
                <th key={label} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-slate-500">
                  Belum ada project finance.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-slate-100">{project.clientName}</td>
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-slate-300">{project.projectName}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400">{formatDate(project.dateStart)} - {formatDate(project.dateEnd)}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-slate-200">{formatCurrency(project.totalProject)}</td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-[180px] flex-wrap gap-1.5">
                      {getTerminStatusCounts(project).map(({ status, count }) => (
                        <span key={status} className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TERMIN_STATUS_META[status].classes}`}>
                          {count} {TERMIN_STATUS_META[status].label}
                        </span>
                      ))}
                      {project.termins.length === 0 && <span className="text-xs text-gray-400 dark:text-slate-500">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-slate-400">{project.termins.length} termin</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/finance/project/${project.id}`} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20">
                        Detail
                      </Link>
                      <Link href={`/finance/form?id=${project.id}`} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.04]">
                        Edit
                      </Link>
                      <button type="button" onClick={() => onDelete(project.id)} disabled={deletingId === project.id} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10">
                        {deletingId === project.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
