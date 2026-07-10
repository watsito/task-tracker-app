'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface OperationalDashboardData {
  summary: {
    totalTasks: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
  };
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  topAssignees: { id: string; name: string; tasks: number; byStatus: Record<string, number> }[];
  topProjects: { id: string; name: string; tasks: number; done: number; completionRate: number }[];
}

export default function OperationalDashboard() {
  const [data, setData] = useState<OperationalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/operational')
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => setData(result))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusChartData = useMemo(() => ({
    labels: Object.keys(data?.byStatus ?? {}),
    datasets: [{
      data: Object.values(data?.byStatus ?? {}),
      backgroundColor: ['rgba(100, 116, 139, 0.85)', 'rgba(59, 130, 246, 0.85)', 'rgba(251, 191, 36, 0.85)', 'rgba(16, 185, 129, 0.85)'],
      borderColor: ['rgba(100, 116, 139, 1)', 'rgba(59, 130, 246, 1)', 'rgba(251, 191, 36, 1)', 'rgba(16, 185, 129, 1)'],
      borderWidth: 1,
    }],
  }), [data]);

  const priorityChartData = useMemo(() => ({
    labels: Object.keys(data?.byPriority ?? {}),
    datasets: [{
      data: Object.values(data?.byPriority ?? {}),
      backgroundColor: ['rgba(16, 185, 129, 0.85)', 'rgba(14, 165, 233, 0.85)', 'rgba(251, 191, 36, 0.85)', 'rgba(239, 68, 68, 0.85)'],
      borderColor: ['rgba(16, 185, 129, 1)', 'rgba(14, 165, 233, 1)', 'rgba(251, 191, 36, 1)', 'rgba(239, 68, 68, 1)'],
      borderWidth: 1,
    }],
  }), [data]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500 dark:border-white/10" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-5 text-sm text-gray-400 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-500">
          Gagal memuat dashboard operational.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-8">
      <div>
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 transition hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeftIcon />
          Back to Task Board
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-indigo-500 dark:text-indigo-300">Operational Dashboard</p>
            <h1 className="mt-1 text-xl font-black tracking-tight text-gray-900 dark:text-white">Task Overview</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Ringkasan task operasional berdasarkan data yang tersedia di schema saat ini.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Tasks" value={data.summary.totalTasks} desc="semua task aktif" accent="📋" />
        <StatCard label="In Progress" value={data.summary.inProgress} desc="sedang dikerjakan" accent="🚧" />
        <StatCard label="Overdue" value={data.summary.overdue} desc="melewati deadline" accent="⏰" />
        <StatCard label="Completion Rate" value={`${data.summary.completionRate}%`} desc="task selesai" accent="✅" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Tasks by Status">
          <div className="h-72">
            <Doughnut data={statusChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </ChartCard>
        <ChartCard title="Tasks by Priority">
          <div className="h-72">
            <Doughnut data={priorityChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TableCard title="Top Assignees">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Assignee</th>
                <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Tasks</th>
                <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Done</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {data.topAssignees.map((assignee) => (
                <tr key={assignee.id}>
                  <td className="py-2.5 text-sm font-semibold text-gray-900 dark:text-slate-100">{assignee.name}</td>
                  <td className="py-2.5 text-right text-sm font-bold tabular-nums text-gray-800 dark:text-slate-200">{assignee.tasks}</td>
                  <td className="py-2.5 text-right text-sm tabular-nums text-gray-500 dark:text-slate-400">{assignee.byStatus.Done ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <TableCard title="Top Projects">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Project</th>
                <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Tasks</th>
                <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {data.topProjects.map((project) => (
                <tr key={project.id}>
                  <td className="py-2.5 text-sm font-semibold text-gray-900 dark:text-slate-100">{project.name}</td>
                  <td className="py-2.5 text-right text-sm font-bold tabular-nums text-gray-800 dark:text-slate-200">{project.tasks}</td>
                  <td className="py-2.5 text-right text-sm tabular-nums text-gray-500 dark:text-slate-400">{project.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>
    </div>
  );
}

function StatCard({ label, value, desc, accent }: { label: string; value: string | number; desc: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-slate-900/80">
      <div className="flex items-center gap-2">
        <span className="text-lg">{accent}</span>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-black tabular-nums text-gray-900 dark:text-white">{value}</p>
      <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">{desc}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-slate-900/80">
      <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function TableCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-slate-900/80">
      <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-slate-100">{title}</h3>
      {children}
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
