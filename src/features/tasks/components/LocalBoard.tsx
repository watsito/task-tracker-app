'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { TaskStatus, TaskPriority, Task } from '../types/task';
import { Milestone, Project } from '@/features/projects/types/project';
import LocalTaskCard from './LocalTaskCard';
import { isTaskDueSoon, isTaskOverdue } from '@/features/reports/utils/exportUtils';
import {
  DndContext,
  DragEndEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';

const COLUMNS: {
  status: TaskStatus;
  label: string;
  accentFrom: string;
  accentTo: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  glowColor: string;
}[] = [
  {
    status: 'To Do',
    label: 'To Do',
    accentFrom: 'from-slate-600',
    accentTo: 'to-slate-700',
    borderColor: 'border-slate-600/50',
    badgeBg: 'bg-slate-600/40',
    badgeText: 'text-slate-300',
    glowColor: 'shadow-slate-500/10',
  },
  {
    status: 'In Progress',
    label: 'In Progress',
    accentFrom: 'from-blue-600',
    accentTo: 'to-indigo-700',
    borderColor: 'border-blue-500/40',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    glowColor: 'shadow-blue-500/10',
  },
  {
    status: 'Review',
    label: 'Review',
    accentFrom: 'from-amber-500',
    accentTo: 'to-orange-600',
    borderColor: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    glowColor: 'shadow-amber-500/10',
  },
  {
    status: 'Done',
    label: 'Done',
    accentFrom: 'from-emerald-600',
    accentTo: 'to-teal-700',
    borderColor: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    glowColor: 'shadow-emerald-500/10',
  },
];

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const TEAMS = ['Frontend', 'Backend', 'Design', 'QA', 'Management', 'Marketing', 'Product'];

interface TaskModalProps {
  defaultStatus: TaskStatus;
  editTask?: Task | null;
  onClose: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  created: 'membuat task',
  status_changed: 'mengubah status',
  priority_changed: 'mengubah prioritas',
  assignee_changed: 'mengubah assignee',
  team_changed: 'mengubah tim',
  title_changed: 'mengubah judul',
  archived: 'mengarsipkan task',
  restored: 'memulihkan task',
};

function AuditLogItem({ log }: { log: { action: string; oldValue: unknown; newValue: unknown; createdAt: string; user: { name: string } } }) {
  const date = new Date(log.createdAt);
  const timeStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const actionLabel = ACTION_LABELS[log.action] || log.action;

  let detail = '';
  if (log.action === 'status_changed' || log.action === 'priority_changed') {
    detail = `: ${log.oldValue} → ${log.newValue}`;
  } else if (log.action === 'title_changed') {
    detail = `: \"${String(log.oldValue).slice(0, 30)}\" → \"${String(log.newValue).slice(0, 30)}\"`;
  }

  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-white/[0.02] px-3 py-2">
      <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-300">
          <span className="font-semibold text-slate-200">{log.user.name}</span>{' '}
          {actionLabel}{detail}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500">{timeStr}</p>
      </div>
    </div>
  );
}

function TaskModal({ defaultStatus, editTask, onClose }: TaskModalProps) {
  const { tasks, addTask, updateTask } = useTaskStore();
  const [title, setTitle] = useState(editTask?.title || '');
  const [description, setDescription] = useState(editTask?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(editTask?.priority || 'Medium');
  const [status, setStatus] = useState<TaskStatus>(editTask?.status || defaultStatus);
  const [team, setTeam] = useState<string>(editTask?.team || '');
  const [projectId, setProjectId] = useState<string>(editTask?.projectId || '');
  const [milestoneId, setMilestoneId] = useState<string>(editTask?.milestoneId || '');
  const [dueDate, setDueDate] = useState<string>(editTask?.dueDate ? editTask.dueDate.toISOString().slice(0, 10) : '');
  const [parentId, setParentId] = useState<string>(editTask?.parentId || '');
  const [projects, setProjects] = useState<(Project & { milestones: Milestone[] })[]>([]);
  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; oldValue: unknown; newValue: unknown; createdAt: string; user: { name: string } }[]>([]);
  const [showAudit, setShowAudit] = useState(false);

  const availableParents = tasks.filter((t) => t.id !== editTask?.id && !t.parentId);
  const selectedProject = projects.find((project) => project.id === projectId);

  useEffect(() => {
    fetch('/api/projects')
      .then((response) => response.ok ? response.json() : [])
      .then((data: (Project & { milestones: Milestone[] })[]) => setProjects(data))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (editTask?.id) {
      fetch(`/api/audit-logs?taskId=${editTask.id}`)
        .then((r) => r.ok ? r.json() : [])
        .then((data) => { if (Array.isArray(data)) setAuditLogs(data); })
        .catch(() => {});
    }
  }, [editTask?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalParentId = parentId || null;
    const finalDueDate = dueDate ? new Date(`${dueDate}T23:59:59`) : null;

    if (editTask) {
      updateTask(editTask.id, { title: title.trim(), description: description.trim(), status, priority, team: team || null, parentId: finalParentId, projectId: projectId || null, milestoneId: milestoneId || null, dueDate: finalDueDate });
    } else {
      await addTask({ title: title.trim(), description: description.trim(), status, priority, assigneeId: null, parentId: finalParentId, team: team || null, projectId: projectId || null, milestoneId: milestoneId || null, dueDate: finalDueDate });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:shadow-black/50">
        <h2 className="mb-5 text-base font-semibold text-gray-900 dark:text-slate-100">{editTask ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-task-title" className="text-xs font-medium text-gray-500 dark:text-slate-400">Title *</label>
            <input id="new-task-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" required className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-500" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-task-description" className="text-xs font-medium text-gray-500 dark:text-slate-400">Description</label>
            <textarea id="new-task-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details..." rows={3} className="resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-500" />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="new-task-status" className="text-xs font-medium text-gray-500 dark:text-slate-400">Status</label>
              <select id="new-task-status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500/60 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
                {COLUMNS.map((c) => (
                  <option key={c.status} value={c.status}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="new-task-priority" className="text-xs font-medium text-gray-500 dark:text-slate-400">Priority</label>
              <select id="new-task-priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500/60 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-task-team" className="text-xs font-medium text-gray-500 dark:text-slate-400">Team</label>
            <select id="new-task-team" value={team} onChange={(e) => setTeam(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500/60 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
              <option value="">-- No Team Assigned --</option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-task-project" className="text-xs font-medium text-gray-500 dark:text-slate-400">Project</label>
              <select id="new-task-project" value={projectId} onChange={(e) => { setProjectId(e.target.value); setMilestoneId(''); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500/60 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
                <option value="">-- No Project --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-task-milestone" className="text-xs font-medium text-gray-500 dark:text-slate-400">Milestone</label>
              <select id="new-task-milestone" value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} disabled={!selectedProject} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500/60 disabled:opacity-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
                <option value="">-- No Milestone --</option>
                {selectedProject?.milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>{milestone.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-task-due-date" className="text-xs font-medium text-gray-500 dark:text-slate-400">Deadline</label>
            <input id="new-task-due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500/60 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-task-parent" className="text-xs font-medium text-gray-500 dark:text-slate-400">Jadikan Sub-tugas dari... (Opsional)</label>
            <select id="new-task-parent" value={parentId} onChange={(e) => setParentId(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500/60 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
              <option value="">-- Kosongkan jika ini Tugas Utama --</option>
              {availableParents.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-800 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200">Cancel</button>
            <button type="submit" id="submit-new-task" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 active:scale-95">{editTask ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>

        {editTask && auditLogs.length > 0 && (
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <button type="button" onClick={() => setShowAudit((v) => !v)} className="flex w-full items-center justify-between text-xs font-semibold text-slate-400 transition hover:text-slate-200">
              <span>Riwayat Perubahan ({auditLogs.length})</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${showAudit ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {showAudit && (
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <AuditLogItem key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface LocalBoardProps {
  readOnly?: boolean;
}

export default function LocalBoard({ readOnly = false }: LocalBoardProps) {
  const { tasks, moveTask, subscribeToTasks } = useTaskStore();
  const { currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'admin';

  const [modalState, setModalState] = useState<{ type: 'add', status: TaskStatus } | { type: 'edit', task: Task } | null>(null);
  const [activeTab, setActiveTab] = useState<TaskStatus>('To Do');
  const [filterMyTasks, setFilterMyTasks] = useState(false);
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToTasks();
    return () => unsubscribe();
  }, [subscribeToTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (readOnly) return;
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    moveTask(taskId, newStatus);
  };

  const activeTasks = tasks.filter((t) => {
    if (t.deletedAt) return false;
    if (t.parentId) return false;
    if (filterMyTasks && currentUser && t.assigneeId !== currentUser.id) return false;
    if (filterUrgentOnly && t.priority !== 'Urgent') return false;
    if (filterOverdueOnly && !isTaskOverdue(t)) return false;
    return true;
  });
  const deletedCount = tasks.filter((t) => !!t.deletedAt).length;
  const overdueCount = tasks.filter((t) => !t.parentId && isTaskOverdue(t)).length;
  const dueSoonCount = tasks.filter((t) => !t.parentId && isTaskDueSoon(t)).length;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mt-0.5 text-sm text-slate-400">
            {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}
            {isAdmin && deletedCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600 dark:bg-red-500/15 dark:text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                {deletedCount} archived
              </span>
            )}
          </p>
          {(overdueCount > 0 || dueSoonCount > 0) && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
              {overdueCount > 0 && (
                <span className="rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">{overdueCount} overdue</span>
              )}
              {dueSoonCount > 0 && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">{dueSoonCount} due soon</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="mr-2 hidden items-center gap-2 sm:flex">
            <button onClick={() => setFilterMyTasks(!filterMyTasks)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${filterMyTasks ? 'border-indigo-500 bg-indigo-600 text-white shadow-md' : 'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200'}`}>My Tasks</button>
            <button onClick={() => setFilterUrgentOnly(!filterUrgentOnly)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${filterUrgentOnly ? 'border-red-400 bg-red-500 text-white shadow-md' : 'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200'}`}>Urgent Only</button>
            <button onClick={() => setFilterOverdueOnly(!filterOverdueOnly)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${filterOverdueOnly ? 'border-rose-400 bg-rose-600 text-white shadow-md' : 'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200'}`}>Overdue {overdueCount > 0 ? `(${overdueCount})` : ''}</button>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/operational" className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
              <ChartIcon />
              View Dashboard
            </Link>
            {!readOnly && (
              <button id="add-task-btn" onClick={() => setModalState({ type: 'add', status: 'To Do' })} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-95">
                <PlusIcon />
                Add Task
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="-mx-6 flex shrink-0 overflow-x-auto px-6 pb-2 scrollbar-hide md:-mx-8 md:px-8 xl:hidden">
        <div className="flex gap-2">
          {COLUMNS.map((col) => {
            const isActive = activeTab === col.status;
            const colTasks = activeTasks.filter((t) => t.status === col.status);
            return (
              <button key={col.status} onClick={() => setActiveTab(col.status)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${isActive ? `bg-gradient-to-r ${col.accentFrom} ${col.accentTo} text-white shadow-lg` : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'}`}>
                {col.label}
                <span className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${isActive ? 'bg-black/20 text-white' : 'bg-white/10 text-slate-300'}`}>{colTasks.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      <DndContext sensors={readOnly ? [] : sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="grid h-full min-h-0 grid-cols-1 gap-4 pb-4 xl:grid-cols-4">
            {COLUMNS.map((col) => {
              const colTasks = activeTasks.filter((t) => t.status === col.status);
              const isActiveMobile = activeTab === col.status;

              return (
                <DroppableColumn key={col.status} col={col} colTasks={colTasks} isActiveMobile={isActiveMobile} isAdmin={isAdmin} readOnly={readOnly} onAddClick={() => setModalState({ type: 'add', status: col.status })} onEditClick={(task) => setModalState({ type: 'edit', task })} />
              );
            })}
          </div>
        </div>
      </DndContext>

      {!readOnly && modalState && (
        <TaskModal defaultStatus={modalState.type === 'add' ? modalState.status : modalState.task.status} editTask={modalState.type === 'edit' ? modalState.task : null} onClose={() => setModalState(null)} />
      )}
    </div>
  );
}

interface DroppableColumnProps {
  col: typeof COLUMNS[0];
  colTasks: Task[];
  isActiveMobile: boolean;
  isAdmin: boolean;
  readOnly?: boolean;
  onAddClick: () => void;
  onEditClick: (task: Task) => void;
}

function DroppableColumn({ col, colTasks, isActiveMobile, isAdmin, readOnly = false, onAddClick, onEditClick }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: col.status, disabled: readOnly });

  return (
    <section ref={setNodeRef} id={`column-${col.status.toLowerCase().replace(/\s+/g, '-')}`} className={`h-full min-h-0 flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${isOver ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-400 dark:bg-slate-800/80' : `${col.borderColor} bg-white dark:bg-slate-900/60`} shadow-lg ${col.glowColor} ${isActiveMobile ? 'flex' : 'hidden xl:flex'}`}>
      <div className={`flex shrink-0 items-center justify-between rounded-t-2xl bg-gradient-to-r ${col.accentFrom} ${col.accentTo} px-4 py-3`}>
        <span className="text-sm font-semibold text-white drop-shadow">{col.label}</span>
        <span className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${col.badgeBg} ${col.badgeText}`}>{colTasks.length}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain p-3">
        {colTasks.length === 0 ? (
          <div className="mt-auto mb-auto flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 py-8 text-center dark:border-white/10">
            <span className="text-2xl opacity-30">📋</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">No tasks here</span>
          </div>
        ) : (
          colTasks.map((task) => <LocalTaskCard key={task.id} task={task} isAdmin={isAdmin} readOnly={readOnly} onEdit={() => onEditClick(task)} />)
        )}
      </div>

      {!readOnly && (
        <button onClick={onAddClick} className="m-3 mt-0 flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 bg-gray-100/50 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-200/50 hover:text-gray-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/25 dark:hover:bg-white/10 dark:hover:text-slate-200">
          <PlusIcon />
          Add task
        </button>
      )}
    </section>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 2v12M2 8h12" />
    </svg>
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
