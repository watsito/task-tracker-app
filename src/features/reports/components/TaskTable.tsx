'use client';

import { useState, useMemo } from 'react';
import { useTaskStore } from '@/features/tasks/store/taskStore';
import { Task, TaskStatus, TaskPriority } from '@/features/tasks/types/task';

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  Low:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  High:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  'To Do':       'bg-slate-500/15 text-slate-400 border-slate-500/30',
  'In Progress': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Review':      'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Done':        'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export default function TaskTable() {
  const { tasks } = useTaskStore();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [sortKey, setSortKey] = useState<keyof Task>('createdAt');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let list = tasks;
    if (!showArchived) list = list.filter((t) => !t.deletedAt);
    if (filterStatus !== 'all') list = list.filter((t) => t.status === filterStatus);
    if (filterPriority !== 'all') list = list.filter((t) => t.priority === filterPriority);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    // Find root tasks (tasks that have no parent, or their parent is not in the filtered list)
    const mainTasks = list.filter(t => !t.parentId || !list.some(p => p.id === t.parentId));

    mainTasks.sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      return sortAsc ? cmp : -cmp;
    });

    const result: Task[] = [];
    mainTasks.forEach(parent => {
      result.push(parent);
      const children = list.filter(t => t.parentId === parent.id);
      children.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      result.push(...children);
    });

    return result;
  }, [tasks, search, filterStatus, filterPriority, showArchived, sortKey, sortAsc]);

  const toggleSort = (key: keyof Task) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: keyof Task }) => (
    <span className={`ml-1 text-[10px] ${sortKey === col ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-600'}`}>
      {sortKey === col ? (sortAsc ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.07] dark:bg-slate-900/80">
      {/* Table header bar */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-gray-200 p-4 dark:border-white/[0.06]">
        {/* Search */}
        <div className="relative flex-1 min-w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            id="task-table-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari task..."
            className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-8 pr-3 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500/40 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-600"
          />
        </div>

        {/* Status filter */}
        <select
          id="filter-status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="all">Semua Status</option>
          {(['To Do', 'In Progress', 'Review', 'Done'] as TaskStatus[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          id="filter-priority"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="all">Semua Prioritas</option>
          {(['Low', 'Medium', 'High', 'Urgent'] as TaskPriority[]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Archived toggle */}
        <button
          id="show-archived-toggle"
          onClick={() => setShowArchived((v) => !v)}
          className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
            showArchived
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-gray-300 bg-gray-100 text-gray-500 hover:text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          {showArchived ? '🗄 Tampilkan Arsip' : '🗄 Arsip'}
        </button>

        <span className="ml-auto text-xs text-gray-400 dark:text-slate-600">
          {filtered.length} task
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/[0.05]">
              {([
                ['title', 'Judul'],
                ['status', 'Status'],
                ['priority', 'Prioritas'],
                ['dueDate', 'Deadline'],
                ['createdAt', 'Dibuat'],
              ] as [keyof Task, string][]).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="cursor-pointer px-4 py-3 text-left font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {label}<SortIcon col={key} />
                </th>
              ))}
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Team</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400 dark:text-slate-600">
                  Tidak ada task yang sesuai filter
                </td>
              </tr>
            ) : (
              filtered.map((task) => {
                const isSubtask = !!task.parentId && filtered.some(t => t.id === task.parentId);
                const parentTask = isSubtask ? tasks.find(t => t.id === task.parentId) : null;
                return (
                  <tr
                    key={task.id}
                    className={`border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-white/[0.04] dark:hover:bg-white/[0.02] ${
                      task.deletedAt ? 'opacity-40' : ''
                    } ${isSubtask ? 'bg-gray-50 dark:bg-slate-900/30' : ''}`}
                  >
                    <td className={`px-4 py-3 ${isSubtask ? 'pl-8 border-l-2 border-indigo-500/30' : ''}`}>
                      <div className="flex items-center gap-2">
                        {isSubtask && <span className="text-gray-400 font-bold mr-1 dark:text-slate-500">↳</span>}
                        {task.deletedAt && (
                          <span title="Diarsipkan" className="text-red-400/60">🗄</span>
                        )}
                        <span className={`font-medium line-clamp-1 ${isSubtask ? 'text-gray-600 dark:text-slate-300' : 'text-gray-900 dark:text-slate-100'}`}>{task.title}</span>
                      </div>
                      {task.description && (
                        <p className={`mt-0.5 line-clamp-1 ${isSubtask ? 'text-gray-400 text-[10px] dark:text-slate-500' : 'text-gray-400 text-xs dark:text-slate-500'}`}>{task.description}</p>
                      )}
                      {parentTask && (
                        <p className="mt-1 text-[9px] text-gray-400 dark:text-slate-600">Parent: {parentTask.title}</p>
                      )}
                    </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[task.status]}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_BADGE[task.priority]}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-500">
                    {task.dueDate ? task.dueDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-500">
                    {task.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-medium dark:text-slate-400">
                    {task.team || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {task.assigneeId ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[9px] font-bold text-white" title={task.assigneeId}>
                        {task.assigneeId.slice(-1).toUpperCase()}
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-slate-700">—</span>
                    )}
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
