'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { OdooProject, OdooProjectStage } from '../types/task';
import OdooProjectCard from './OdooProjectCard';

type OdooProjectsResponse = {
  stages: OdooProjectStage[];
  projects: OdooProject[];
  success?: boolean;
  errorMessage?: string;
};

type ColumnStyle = {
  accentFrom: string;
  accentTo: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  glowColor: string;
};

const COLUMN_STYLES: ColumnStyle[] = [
  {
    accentFrom: 'from-slate-600',
    accentTo: 'to-slate-700',
    borderColor: 'border-slate-600/50',
    badgeBg: 'bg-slate-600/40',
    badgeText: 'text-slate-300',
    glowColor: 'shadow-slate-500/10',
  },
  {
    accentFrom: 'from-blue-600',
    accentTo: 'to-indigo-700',
    borderColor: 'border-blue-500/40',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    glowColor: 'shadow-blue-500/10',
  },
  {
    accentFrom: 'from-emerald-600',
    accentTo: 'to-teal-700',
    borderColor: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    glowColor: 'shadow-emerald-500/10',
  },
  {
    accentFrom: 'from-rose-600',
    accentTo: 'to-red-700',
    borderColor: 'border-rose-500/40',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    glowColor: 'shadow-rose-500/10',
  },
  {
    accentFrom: 'from-violet-600',
    accentTo: 'to-purple-700',
    borderColor: 'border-violet-500/40',
    badgeBg: 'bg-violet-500/20',
    badgeText: 'text-violet-300',
    glowColor: 'shadow-violet-500/10',
  },
];

function getColumnStyle(index: number) {
  return COLUMN_STYLES[index % COLUMN_STYLES.length];
}

export default function OdooBoard() {
  const [stages, setStages] = useState<OdooProjectStage[]>([]);
  const [projects, setProjects] = useState<OdooProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/integrations/odoo/projects');
        const data = (await response.json()) as OdooProjectsResponse;

        if (!active) return;

        if (!response.ok || !Array.isArray(data.stages) || !Array.isArray(data.projects)) {
          setError(data.errorMessage ?? 'Gagal memuat project Odoo.');
          setStages([]);
          setProjects([]);
          return;
        }

        const sortedStages = [...data.stages].sort((a, b) => a.sequence - b.sequence);
        setStages(sortedStages);
        setProjects(data.projects);
      } catch {
        if (!active) return;
        setError('Tidak bisa mengambil data project Odoo.');
        setStages([]);
        setProjects([]);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  const projectsByStageId = useMemo(() => {
    return stages.reduce<Record<number, OdooProject[]>>((acc, stage) => {
      acc[stage.id] = projects.filter((project) => project.stageId === stage.id);
      return acc;
    }, {});
  }, [projects, stages]);

  const totalTaskCount = projects.reduce((total, project) => total + project.taskCount, 0);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mt-0.5 text-sm text-slate-400">
            {isLoading ? 'Memuat project dari Odoo...' : `${projects.length} project Odoo · ${totalTaskCount} total task`}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <Link href="/dashboard/odoo" className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
            <ChartIcon />
            View Dashboard
          </Link>
          <button type="button" onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-95">
            <RefreshIcon />
            Refresh Odoo
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-3">
        <div className="flex h-full min-h-0 w-max min-w-full gap-4 pr-1">
          {stages.map((stage, index) => {
            const stageProjects = projectsByStageId[stage.id] ?? [];
            const style = getColumnStyle(index);

            return (
              <section key={stage.id} id={`column-stage-${stage.id}`} className={`flex h-full min-h-0 w-[min(86vw,24rem)] shrink-0 flex-col overflow-hidden rounded-2xl border ${style.borderColor} bg-white shadow-lg ${style.glowColor} dark:bg-slate-900/60 sm:w-[22rem] lg:w-[24rem]`}>
                <div className={`flex shrink-0 items-center justify-between rounded-t-2xl bg-gradient-to-r ${style.accentFrom} ${style.accentTo} px-4 py-3`}>
                  <span className="text-sm font-semibold text-white drop-shadow">{stage.name}</span>
                  <span className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${style.badgeBg} ${style.badgeText}`}>{stageProjects.length}</span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain p-3">
                  {isLoading ? (
                    <div className="mt-auto mb-auto flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 py-8 text-center dark:border-white/10">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500" />
                      <span className="text-xs text-gray-400 dark:text-slate-500">Memuat project...</span>
                    </div>
                  ) : stageProjects.length === 0 ? (
                    <div className="mt-auto mb-auto flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 py-8 text-center dark:border-white/10">
                      <span className="text-2xl opacity-30">📁</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">No projects here</span>
                    </div>
                  ) : (
                    stageProjects.map((project) => <OdooProjectCard key={project.id} project={project} />)
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10" />
      <path d="M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}
