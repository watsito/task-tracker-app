'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

type OdooDashboardData = {
  summary: {
    totalProjects: number;
    inProgress: number;
    done: number;
    totalTasks: number;
  };
  byStage: { id: number; name: string; projects: number; tasks: number }[];
  topAssignees: { id: number | string; name: string; projects: number; tasks: number }[];
  topProjects: { id: number; name: string; stageName: string; ownerName: string; tasks: number }[];
};

const STAGE_COLORS = [
  'rgba(100, 116, 139, 0.88)',
  'rgba(37, 99, 235, 0.88)',
  'rgba(16, 185, 129, 0.88)',
  'rgba(225, 29, 72, 0.88)',
  'rgba(124, 58, 237, 0.88)',
  'rgba(234, 88, 12, 0.88)',
];

export default function OdooDashboard() {
  const [data, setData] = useState<OdooDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/integrations/odoo/dashboard')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? 'Gagal memuat dashboard Odoo.');
        return result as OdooDashboardData;
      })
      .then(setData)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const projectStageChart = useMemo(() => ({
    labels: data?.byStage.map((stage) => stage.name) ?? [],
    datasets: [{
      data: data?.byStage.map((stage) => stage.projects) ?? [],
      backgroundColor: STAGE_COLORS,
      borderColor: STAGE_COLORS.map((color) => color.replace('0.88', '1')),
      borderWidth: 1,
    }],
  }), [data]);

  const taskStageChart = useMemo(() => ({
    labels: data?.byStage.map((stage) => stage.name) ?? [],
    datasets: [{
      data: data?.byStage.map((stage) => stage.tasks) ?? [],
      backgroundColor: STAGE_COLORS,
      borderColor: STAGE_COLORS.map((color) => color.replace('0.88', '1')),
      borderWidth: 1,
    }],
  }), [data]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#714B67] dark:border-white/10" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-xl rounded-2xl border border-red-300 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error ?? 'Gagal memuat dashboard Odoo.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-8">
      <div className="relative overflow-hidden rounded-3xl border border-[#714B67]/20 bg-gradient-to-br from-[#714B67] via-[#5c3d56] to-[#017E84] p-6 text-white shadow-xl shadow-[#714B67]/15">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/10 bg-white/[0.05]" />
        <div className="relative">
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-white/70 transition hover:text-white">
            <ArrowLeftIcon />
            Back to Project Board
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-white/60">Odoo 16 Live View</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Project Intelligence</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">Ringkasan project dan task langsung dari Odoo melalui akses XML-RPC read-only.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Projects" value={data.summary.totalProjects} desc="seluruh project Odoo" accent="P" color="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" />
        <StatCard label="In Progress" value={data.summary.inProgress} desc="project sedang berjalan" accent="I" color="bg-blue-600 text-white" />
        <StatCard label="Done" value={data.summary.done} desc="project selesai" accent="D" color="bg-emerald-600 text-white" />
        <StatCard label="Total Tasks" value={data.summary.totalTasks} desc="task lintas project" accent="T" color="bg-[#714B67] text-white" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Projects by Stage" subtitle="Distribusi project pada setiap stage Odoo">
          <Doughnut data={projectStageChart} options={chartOptions} />
        </ChartCard>
        <ChartCard title="Tasks by Project Stage" subtitle="Jumlah task berdasarkan stage project induknya">
          <Doughnut data={taskStageChart} options={chartOptions} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TableCard title="Top Project Owners" subtitle="Owner dengan beban task terbanyak">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                <HeaderCell>Owner</HeaderCell>
                <HeaderCell align="right">Projects</HeaderCell>
                <HeaderCell align="right">Tasks</HeaderCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {data.topAssignees.map((assignee) => (
                <tr key={assignee.id}>
                  <td className="py-3 font-semibold text-gray-900 dark:text-slate-100">{assignee.name}</td>
                  <td className="py-3 text-right tabular-nums text-gray-500 dark:text-slate-400">{assignee.projects}</td>
                  <td className="py-3 text-right font-bold tabular-nums text-[#714B67] dark:text-teal-300">{assignee.tasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <TableCard title="Top Projects" subtitle="Project dengan jumlah task terbanyak">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                <HeaderCell>Project</HeaderCell>
                <HeaderCell>Stage</HeaderCell>
                <HeaderCell align="right">Tasks</HeaderCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {data.topProjects.map((project) => (
                <tr key={project.id}>
                  <td className="max-w-52 py-3 pr-3">
                    <p className="truncate font-semibold text-gray-900 dark:text-slate-100">{project.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-slate-500">{project.ownerName}</p>
                  </td>
                  <td className="py-3 text-xs text-gray-500 dark:text-slate-400">{project.stageName}</td>
                  <td className="py-3 text-right font-bold tabular-nums text-[#714B67] dark:text-teal-300">{project.tasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>
    </div>
  );
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        padding: 18,
        usePointStyle: true,
      },
    },
  },
};

function StatCard({ label, value, desc, accent, color }: { label: string; value: number; desc: string; accent: string; color: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/[0.07] dark:bg-slate-900/80">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black ${color}`}>{accent}</span>
      </div>
      <p className="mt-3 text-3xl font-black tabular-nums text-gray-900 dark:text-white">{value}</p>
      <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">{desc}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-slate-900/80">
      <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">{title}</h2>
      <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">{subtitle}</p>
      <div className="mt-5 h-72">{children}</div>
    </section>
  );
}

function TableCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-slate-900/80">
      <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">{title}</h2>
      <p className="mb-4 mt-1 text-xs text-gray-500 dark:text-slate-500">{subtitle}</p>
      {children}
    </section>
  );
}

function HeaderCell({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <th className={`pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );
}
