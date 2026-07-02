'use client';

import { useTaskStore } from '@/features/tasks/store/taskStore';
import { calculateSummary } from '../utils/exportUtils';
import { TaskStatus, TaskPriority } from '@/features/tasks/types/task';

// ─── Config ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TaskStatus, { color: string; bg: string; label: string }> = {
  'To Do':      { color: 'bg-slate-400',   bg: 'bg-slate-400/15', label: 'To Do' },
  'In Progress':{ color: 'bg-blue-400',    bg: 'bg-blue-400/15',  label: 'In Progress' },
  'Review':     { color: 'bg-amber-400',   bg: 'bg-amber-400/15', label: 'Review' },
  'Done':       { color: 'bg-emerald-400', bg: 'bg-emerald-400/15',label: 'Done' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; text: string }> = {
  Low:    { color: 'bg-emerald-400', text: 'text-emerald-400' },
  Medium: { color: 'bg-sky-400',     text: 'text-sky-400' },
  High:   { color: 'bg-amber-400',   text: 'text-amber-400' },
  Urgent: { color: 'bg-red-400',     text: 'text-red-400' },
};

// ─── Sub-components ────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-2xl border border-white/[0.07] bg-slate-900/80 p-5`}>
      <span className={`text-xs font-semibold uppercase tracking-wider ${accent}`}>{label}</span>
      <span className="text-3xl font-bold tabular-nums text-slate-100">{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}

function BarRow({ label, count, total, colorClass }: {
  label: string; count: number; total: number; colorClass: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-right text-xs text-slate-400">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-xs font-semibold tabular-nums text-slate-300">{count}</span>
      <span className="w-9 text-right text-[11px] text-slate-600">{Math.round(pct)}%</span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function ReportStats() {
  const { tasks } = useTaskStore();
  const s = calculateSummary(tasks);

  return (
    <div className="flex flex-col gap-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Tasks"  value={s.total}    sub={`${s.archived} diarsipkan`} accent="text-indigo-400" />
        <KpiCard label="Active"       value={s.active}   sub="belum diarsipkan"            accent="text-sky-400" />
        <KpiCard label="Selesai"      value={s.byStatus['Done']} sub="status Done"          accent="text-emerald-400" />
        <KpiCard
          label="Completion Rate"
          value={`${s.completionRate}%`}
          sub={`${s.byStatus['Done']} dari ${s.active} tasks`}
          accent={s.completionRate >= 75 ? 'text-emerald-400' : s.completionRate >= 40 ? 'text-amber-400' : 'text-red-400'}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status distribution */}
        <div className="rounded-2xl border border-white/[0.07] bg-slate-900/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Distribusi Status</h3>
          <div className="flex flex-col gap-3">
            {(Object.entries(s.byStatus) as [TaskStatus, number][]).map(([status, count]) => (
              <BarRow
                key={status}
                label={STATUS_CONFIG[status].label}
                count={count}
                total={s.active}
                colorClass={STATUS_CONFIG[status].color}
              />
            ))}
          </div>
        </div>

        {/* Priority distribution */}
        <div className="rounded-2xl border border-white/[0.07] bg-slate-900/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Distribusi Prioritas</h3>
          <div className="flex flex-col gap-3">
            {(Object.entries(s.byPriority) as [TaskPriority, number][]).map(([priority, count]) => (
              <BarRow
                key={priority}
                label={priority}
                count={count}
                total={s.active}
                colorClass={PRIORITY_CONFIG[priority].color}
              />
            ))}
          </div>
          {/* Completion ring visual */}
          <div className="mt-5 flex items-center gap-4 border-t border-white/[0.05] pt-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
              <svg className="-rotate-90" width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke={s.completionRate >= 75 ? '#34d399' : s.completionRate >= 40 ? '#fbbf24' : '#f87171'}
                  strokeWidth="8"
                  strokeDasharray={`${(s.completionRate / 100) * 163.4} 163.4`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-bold text-slate-200">{s.completionRate}%</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Tingkat Penyelesaian</p>
              <p className="text-xs text-slate-500">{s.byStatus['Done']} task selesai dari {s.active} aktif</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
