'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FinanceDashboard from './FinanceDashboard';
import FinanceTrackingBoard from './FinanceTrackingBoard';
import type { FinanceTrackingFilters } from './FinanceTrackingBoard';
import type { FinanceDashboardSummary, FinanceProjectRecord, FinanceProjectStatus } from '../types/finance';

type TabKey = 'dashboard' | 'tracking';

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'tracking', label: 'Tracking', icon: '📋' },
];

const EMPTY_FILTERS: FinanceTrackingFilters = {
  search: '',
  overdueOnly: false,
  deadline: 'ALL',
  projectId: '',
  amount: 'ALL',
};

export default function FinanceBoardPageContent({ readOnly = false }: { readOnly?: boolean }) {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [projects, setProjects] = useState<FinanceProjectRecord[]>([]);
  const [filters, setFilters] = useState<FinanceTrackingFilters>(EMPTY_FILTERS);
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
    };
  }, [projects]);

  const handleTerminStatusChange = useCallback((projectId: string, updatedProject: FinanceProjectRecord) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));
  }, []);

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${activeTab === 'tracking' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      <div className="flex shrink-0 flex-col gap-6 p-5 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Board Finance</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-500">Kelola dan pantau project finance.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex w-fit rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key === 'dashboard') setFilters(EMPTY_FILTERS);
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'}`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'tracking' && (
            <FinanceTrackingFilterBar projects={projects} filters={filters} onChange={setFilters} />
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="m-5 md:m-8 rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-500">
          Memuat data finance...
        </div>
      ) : projects.length === 0 ? (
        <div className="m-5 md:m-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <p className="text-base font-semibold text-gray-800 dark:text-slate-200">Belum ada data finance</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-500">Mulai dengan membuka halaman Form untuk input project finance pertama.</p>
        </div>
      ) : activeTab === 'dashboard' ? (
        <div className="flex-1 p-5 md:p-8">
          <FinanceDashboard summary={summary} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5 pt-1 md:px-8 md:pb-8">
          <FinanceTrackingBoard projects={projects} filters={filters} onStatusChange={handleTerminStatusChange} readOnly={readOnly} />
        </div>
      )}
    </div>
  );
}

function FinanceTrackingFilterBar({
  projects,
  filters,
  onChange,
}: {
  projects: FinanceProjectRecord[];
  filters: FinanceTrackingFilters;
  onChange: React.Dispatch<React.SetStateAction<FinanceTrackingFilters>>;
}) {
  const activeFilterCount = [
    filters.search,
    filters.overdueOnly,
    filters.deadline !== 'ALL',
    filters.projectId,
    filters.amount !== 'ALL',
  ].filter(Boolean).length;

  const updateFilter = <K extends keyof FinanceTrackingFilters>(key: K, value: FinanceTrackingFilters[K]) => {
    onChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
      <label className="relative min-w-[180px] flex-1 sm:flex-none">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">⌕</span>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Cari proyek / klien"
          className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-200"
        />
      </label>

      <button
        type="button"
        onClick={() => updateFilter('overdueOnly', !filters.overdueOnly)}
        className={`h-10 rounded-xl border px-3 text-xs font-semibold transition ${filters.overdueOnly ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-400'}`}
      >
        Overdue
      </button>

      <select value={filters.deadline} onChange={(e) => updateFilter('deadline', e.target.value as FinanceTrackingFilters['deadline'])} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 outline-none dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-300">
        <option value="ALL">Semua Deadline</option>
        <option value="TODAY">Hari Ini</option>
        <option value="NEXT_7_DAYS">7 Hari Ke Depan</option>
        <option value="THIS_MONTH">Bulan Ini</option>
        <option value="OVERDUE">Terlambat</option>
      </select>

      <select value={filters.projectId} onChange={(e) => updateFilter('projectId', e.target.value)} className="h-10 max-w-[190px] rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 outline-none dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-300">
        <option value="">Semua Proyek</option>
        {[...projects].sort((a, b) => a.projectName.localeCompare(b.projectName, 'id')).map((project) => (
          <option key={project.id} value={project.id}>{project.projectName}</option>
        ))}
      </select>

      <select value={filters.amount} onChange={(e) => updateFilter('amount', e.target.value as FinanceTrackingFilters['amount'])} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 outline-none dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-300">
        <option value="ALL">Semua Nilai</option>
        <option value="UNDER_50M">&lt; Rp50 jt</option>
        <option value="50M_TO_100M">Rp50–100 jt</option>
        <option value="100M_TO_250M">Rp100–250 jt</option>
        <option value="OVER_250M">&gt; Rp250 jt</option>
      </select>

      {activeFilterCount > 0 && (
        <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">
          Reset ({activeFilterCount})
        </button>
      )}
    </div>
  );
}
