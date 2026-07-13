'use client';

import { useEffect, useMemo, useState } from 'react';
import FinanceDashboard from './FinanceDashboard';
import type { FinanceDashboardSummary, FinanceProjectRecord, FinanceProjectStatus } from '../types/finance';

type TabKey = 'dashboard' | 'tracking';

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'tracking', label: 'Tracking', icon: '📋' },
];

const STATUS_META: Record<FinanceProjectStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
  DONE: { label: 'Done', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

type TerminWithProject = FinanceProjectRecord['termins'][number] & {
  projectId: string;
  projectName: string;
  totalValue: number;
};

function groupTerminsByProject(termins: TerminWithProject[]) {
  const grouped = new Map<string, { projectId: string; projectName: string; count: number; totalValue: number }>();

  for (const termin of termins) {
    const existing = grouped.get(termin.projectName);
    grouped.set(termin.projectName, {
      projectId: termin.projectId,
      projectName: termin.projectName,
      count: (existing?.count ?? 0) + 1,
      totalValue: (existing?.totalValue ?? 0) + termin.totalValue,
    });
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.projectName.localeCompare(b.projectName, 'id', { sensitivity: 'base' })
  );
}

export default function FinanceBoardPageContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [projects, setProjects] = useState<FinanceProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch('/api/finance-projects');
        const data = await response.json();
        if (active && response.ok && Array.isArray(data)) {
          setProjects(data);
        }
      } catch {
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, []);

  const summary = useMemo<FinanceDashboardSummary>(() => {
    const totalProjects = projects.length;
    const totalProjectValue = projects.reduce((total, project) => total + project.totalProject, 0);
    const totalTerminAmount = projects.reduce(
      (total, project) => total + project.termins.reduce((terminTotal, termin) => terminTotal + (project.totalProject * termin.percentage) / 100, 0),
      0
    );
    const statuses: FinanceProjectStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE'];
    const allTermins = projects.flatMap((project) =>
      project.termins.map((termin) => ({
        ...termin,
        projectId: project.id,
        projectName: project.projectName,
        totalValue: (project.totalProject * termin.percentage) / 100,
      }))
    );

    return {
      totalProjects,
      totalProjectValue,
      totalTerminAmount,
      averageTerminPerProject: totalProjects === 0 ? 0 : projects.reduce((total, project) => total + project.termins.length, 0) / totalProjects,
      byStatus: statuses.map((status) => ({
        status,
        count: projects.filter((project) => project.status === status).length,
        totalValue: projects.filter((project) => project.status === status).reduce((total, project) => total + project.totalProject, 0),
      })),
      terminBillingSummary: [
        {
          status: 'NOT_BILLABLE',
          label: 'Belum bisa ditagihkan',
          count: allTermins.filter((termin) => termin.billingStatus === 'NOT_BILLABLE').length,
          totalValue: allTermins.filter((termin) => termin.billingStatus === 'NOT_BILLABLE').reduce((total, termin) => total + termin.totalValue, 0),
          terminDetails: groupTerminsByProject(allTermins.filter((termin) => termin.billingStatus === 'NOT_BILLABLE')),
        },
        {
          status: 'BILLABLE',
          label: 'Sudah bisa ditagihkan',
          count: allTermins.filter((termin) => termin.billingStatus === 'BILLABLE').length,
          totalValue: allTermins.filter((termin) => termin.billingStatus === 'BILLABLE').reduce((total, termin) => total + termin.totalValue, 0),
          terminDetails: groupTerminsByProject(allTermins.filter((termin) => termin.billingStatus === 'BILLABLE')),
        },
      ],
      terminDisbursementSummary: [
        {
          status: 'NOT_DISBURSED',
          label: 'Belum Cair',
          count: allTermins.filter((termin) => termin.disbursementStatus === 'NOT_DISBURSED').length,
          totalValue: allTermins.filter((termin) => termin.disbursementStatus === 'NOT_DISBURSED').reduce((total, termin) => total + termin.totalValue, 0),
          terminDetails: groupTerminsByProject(allTermins.filter((termin) => termin.disbursementStatus === 'NOT_DISBURSED')),
        },
        {
          status: 'DISBURSED',
          label: 'Sudah Cair',
          count: allTermins.filter((termin) => termin.disbursementStatus === 'DISBURSED').length,
          totalValue: allTermins.filter((termin) => termin.disbursementStatus === 'DISBURSED').reduce((total, termin) => total + termin.totalValue, 0),
          terminDetails: groupTerminsByProject(allTermins.filter((termin) => termin.disbursementStatus === 'DISBURSED')),
        },
      ],
    };
  }, [projects]);

  const projectsByStatus = useMemo(() => {
    const grouped: Record<FinanceProjectStatus, FinanceProjectRecord[]> = {
      PENDING: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const project of projects) {
      grouped[project.status].push(project);
    }
    return grouped;
  }, [projects]);

  return (
    <div className="flex flex-col gap-6 p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Board Finance</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-500">Kelola dan pantau project finance.</p>
        </div>
      </div>

      <div className="inline-flex w-fit rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-500">
          Memuat data finance...
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <p className="text-base font-semibold text-gray-800 dark:text-slate-200">Belum ada data finance</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-500">Mulai dengan membuka halaman Form untuk input project finance pertama.</p>
        </div>
      ) : activeTab === 'dashboard' ? (
        <FinanceDashboard summary={summary} />
      ) : (
        <TrackingView projectsByStatus={projectsByStatus} />
      )}
    </div>
  );
}

function TrackingView({ projectsByStatus }: { projectsByStatus: Record<FinanceProjectStatus, FinanceProjectRecord[]> }) {
  const statuses: FinanceProjectStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE'];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {statuses.map((status) => {
        const meta = STATUS_META[status];
        const statusProjects = projectsByStatus[status];

        return (
          <section key={status} className="flex flex-col gap-4">
            <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${meta.bgColor}`}>
              <span className={`text-sm font-bold ${meta.color}`}>{meta.label}</span>
              <span className={`flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-bold ${meta.color} bg-white/60 dark:bg-black/20`}>
                {statusProjects.length}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {statusProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-xs text-gray-400 dark:border-white/[0.06] dark:bg-slate-900/60 dark:text-slate-500">
                  Tidak ada project
                </div>
              ) : (
                statusProjects.map((project) => (
                  <div key={project.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-white/[0.07] dark:bg-slate-800/60 dark:hover:border-white/[0.14]">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">{project.projectName}</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{project.clientName}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{formatCurrency(project.totalProject)}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-white/[0.04] dark:text-slate-400">
                        {project.termins.length} termin
                      </span>
                    </div>
                    {project.dateStart && project.dateEnd && (
                      <p className="mt-2 text-[11px] text-gray-400 dark:text-slate-500">
                        {new Date(project.dateStart).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} - {new Date(project.dateEnd).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
