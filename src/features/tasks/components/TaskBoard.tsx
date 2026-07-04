'use client';

import { useState, useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { TaskStatus, TaskPriority, Task } from '../types/task';
import { Milestone, Project } from '@/features/projects/types/project';
import TaskCard from './TaskCard';
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

// ─── Column config ─────────────────────────────────────────────────────────
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

// ─── Task Modal (Add/Edit) ────────────────────────────────────────────────────────
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
    detail = `: "${String(log.oldValue).slice(0, 30)}" → "${String(log.newValue).slice(0, 30)}"`;
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
  
  const availableParents = tasks.filter(t => 
    t.id !== editTask?.id && 
    !t.parentId
  );
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <h2 className="mb-5 text-base font-semibold text-slate-100">{editTask ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-task-title" className="text-xs font-medium text-slate-400">Title *</label>
            <input
              id="new-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-task-description" className="text-xs font-medium text-slate-400">Description</label>
            <textarea
              id="new-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
              className="resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Status + Priority row */}
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="new-task-status" className="text-xs font-medium text-slate-400">Status</label>
              <select
                id="new-task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/60"
              >
                {COLUMNS.map((c) => (
                  <option key={c.status} value={c.status}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="new-task-priority" className="text-xs font-medium text-slate-400">Priority</label>
              <select
                id="new-task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/60"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Team row */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-task-team" className="text-xs font-medium text-slate-400">Team</label>
            <select
              id="new-task-team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/60"
            >
              <option value="">-- No Team Assigned --</option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-task-project" className="text-xs font-medium text-slate-400">Project</label>
              <select
                id="new-task-project"
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setMilestoneId('');
                }}
                className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/60"
              >
                <option value="">-- No Project --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-task-milestone" className="text-xs font-medium text-slate-400">Milestone</label>
              <select
                id="new-task-milestone"
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                disabled={!selectedProject}
                className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/60 disabled:opacity-50"
              >
                <option value="">-- No Milestone --</option>
                {selectedProject?.milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>{milestone.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-task-due-date" className="text-xs font-medium text-slate-400">Deadline</label>
            <input
              id="new-task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/60"
            />
          </div>

          {/* Parent Task Selection */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-task-parent" className="text-xs font-medium text-slate-400">Jadikan Sub-tugas dari... (Opsional)</label>
            <select
              id="new-task-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/60"
            >
              <option value="">-- Kosongkan jika ini Tugas Utama --</option>
              {availableParents.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-new-task"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 active:scale-95"
            >
              {editTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>

        {/* Audit Trail */}
        {editTask && auditLogs.length > 0 && (
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={() => setShowAudit((v) => !v)}
              className="flex w-full items-center justify-between text-xs font-semibold text-slate-400 transition hover:text-slate-200"
            >
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

// ─── Main Board ────────────────────────────────────────────────────────────
export default function TaskBoard() {
  const { tasks, moveTask, subscribeToTasks } = useTaskStore();
  const { currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'admin';

  const [modalState, setModalState] = useState<{ type: 'add', status: TaskStatus } | { type: 'edit', task: Task } | null>(null);
  const [activeTab, setActiveTab] = useState<TaskStatus>('To Do');
  const [viewMode, setViewMode] = useState<'board' | 'dashboard'>('board');
  
  // Advanced Filtering States
  const [filterMyTasks, setFilterMyTasks] = useState(false);
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToTasks();
    return () => unsubscribe();
  }, [subscribeToTasks]);

  // Drag & Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    moveTask(taskId, newStatus);
  };

  // Filter out soft-deleted tasks, apply advanced filters, and hide subtasks for main board view
  const activeTasks = tasks.filter((t) => {
    if (t.deletedAt) return false;
    if (t.parentId) return false; // Hide subtasks from main board
    if (filterMyTasks && currentUser && t.assigneeId !== currentUser.id) return false;
    if (filterUrgentOnly && t.priority !== 'Urgent') return false;
    if (filterOverdueOnly && !isTaskOverdue(t)) return false;
    return true;
  });
  const deletedCount = tasks.filter((t) => !!t.deletedAt).length;
  const overdueCount = tasks.filter((t) => !t.parentId && isTaskOverdue(t)).length;
  const dueSoonCount = tasks.filter((t) => !t.parentId && isTaskDueSoon(t)).length;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6 md:p-8">
      {/* Board header row */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              {viewMode === 'board' ? 'Project Board' : 'Dashboard'}
            </h1>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-0.5">
              <button
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === 'board'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BoardIcon />
                Board
              </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ChartIcon />
                Dashboard
              </button>
            </div>
          </div>
          {viewMode === 'board' && (
            <>
              <p className="mt-0.5 text-sm text-slate-400">
                {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}
                {isAdmin && deletedCount > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    {deletedCount} archived
                  </span>
                )}
              </p>
              {(overdueCount > 0 || dueSoonCount > 0) && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                  {overdueCount > 0 && (
                    <span className="rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-red-300">
                      {overdueCount} overdue
                    </span>
                  )}
                  {dueSoonCount > 0 && (
                    <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-amber-300">
                      {dueSoonCount} due soon
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {viewMode === 'board' && (
        <div className="flex items-center gap-3">
          {/* Filters */}
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <button
              onClick={() => setFilterMyTasks(!filterMyTasks)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filterMyTasks 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setFilterUrgentOnly(!filterUrgentOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filterUrgentOnly 
                  ? 'bg-red-500 border-red-400 text-white shadow-md' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              Urgent Only
            </button>
            <button
              onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filterOverdueOnly
                  ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              Overdue {overdueCount > 0 ? `(${overdueCount})` : ''}
            </button>
          </div>

          <button
            id="add-task-btn"
            onClick={() => setModalState({ type: 'add', status: 'To Do' })}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-95"
          >
            <PlusIcon />
            Add Task
          </button>
        </div>
        )}
      </div>

      {/* Mobile Tab Switcher */}
      {viewMode === 'board' && (
      <div className="flex shrink-0 xl:hidden overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 md:-mx-8 md:px-8">
        <div className="flex gap-2">
          {COLUMNS.map((col) => {
            const isActive = activeTab === col.status;
            const colTasks = activeTasks.filter((t) => t.status === col.status);
            return (
              <button
                key={col.status}
                onClick={() => setActiveTab(col.status)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-r ${col.accentFrom} ${col.accentTo} text-white shadow-lg`
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {col.label}
                <span className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  isActive ? 'bg-black/20 text-white' : 'bg-white/10 text-slate-300'
                }`}>
                  {colTasks.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {viewMode === 'board' ? (
        /* Kanban columns */
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="grid h-full min-h-0 grid-cols-1 gap-4 pb-4 xl:grid-cols-4">
              {COLUMNS.map((col) => {
                const colTasks = activeTasks.filter((t) => t.status === col.status);
                const isActiveMobile = activeTab === col.status;
                
                return (
                  <DroppableColumn
                    key={col.status}
                    col={col}
                    colTasks={colTasks}
                    isActiveMobile={isActiveMobile}
                    isAdmin={isAdmin}
                    onAddClick={() => setModalState({ type: 'add', status: col.status })}
                    onEditClick={(task) => setModalState({ type: 'edit', task })}
                  />
                );
              })}
            </div>
          </div>
        </DndContext>
      ) : (
        /* Dashboard view */
        <DashboardView />
      )}

      {/* Task Modal (Add/Edit) */}
      {modalState && (
        <TaskModal
          defaultStatus={modalState.type === 'add' ? modalState.status : modalState.task.status}
          editTask={modalState.type === 'edit' ? modalState.task : null}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}

// ─── Droppable Column ──────────────────────────────────────────────────────

interface DroppableColumnProps {
  col: typeof COLUMNS[0];
  colTasks: Task[];
  isActiveMobile: boolean;
  isAdmin: boolean;
  onAddClick: () => void;
  onEditClick: (task: Task) => void;
}

function DroppableColumn({ col, colTasks, isActiveMobile, isAdmin, onAddClick, onEditClick }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: col.status,
  });

  return (
    <section
      ref={setNodeRef}
      id={`column-${col.status.toLowerCase().replace(/\s+/g, '-')}`}
      className={`h-full min-h-0 flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
        isOver ? 'border-indigo-400 bg-slate-800/80' : `${col.borderColor} bg-slate-900/60`
      } shadow-lg ${col.glowColor} backdrop-blur-sm ${isActiveMobile ? 'flex' : 'hidden xl:flex'}`}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between rounded-t-2xl bg-gradient-to-r ${col.accentFrom} ${col.accentTo} px-4 py-3 shrink-0`}>
        <span className="text-sm font-semibold text-white drop-shadow">{col.label}</span>
        <span className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${col.badgeBg} ${col.badgeText}`}>
          {colTasks.length}
        </span>
      </div>

      {/* Task list */}
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain p-3">
        {colTasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 py-8 text-center mt-auto mb-auto">
            <span className="text-2xl opacity-30">📋</span>
            <span className="text-xs text-slate-500">No tasks here</span>
          </div>
        ) : (
          colTasks.map((task) => (
            <TaskCard key={task.id} task={task} isAdmin={isAdmin} onEdit={() => onEditClick(task)} />
          ))
        )}
      </div>

      {/* Column add button */}
      <button
        onClick={onAddClick}
        className="m-3 mt-0 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-white/20 hover:text-slate-300 shrink-0"
      >
        <PlusIcon />
        Add task
      </button>
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="1" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Dashboard View ─────────────────────────────────────────────────────────

import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

interface LeadSourceEntry {
  id: string;
  team: string;
  formType: string;
  title: string;
  monthLabel: string;
  period: string;
  channels: Record<string, number>;
  totalLeads: number;
  createdAt: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email', googleAds: 'Google Ads', metaAds: 'Meta Ads', tender: 'Tender',
  socialMedia: 'Social Media', linkedin: 'Linkedin', referral: 'Referral',
  inboundWa: 'Inbound WA', web: 'Web', ka: 'KA', mes: 'MES',
  community: 'Community', other: 'Other',
};

const CHANNEL_ORDER = ['email', 'googleAds', 'metaAds', 'tender', 'socialMedia', 'linkedin', 'referral', 'inboundWa', 'web', 'ka', 'mes', 'community', 'other'];

function DashboardView() {
  const [entries, setEntries] = useState<LeadSourceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lead-sources')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setEntries(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
      </div>
    );
  }

  const totalLeads = entries.reduce((sum, e) => sum + e.totalLeads, 0);

  const teamBreakdown: Record<string, number> = {};
  entries.forEach((e) => {
    teamBreakdown[e.team] = (teamBreakdown[e.team] || 0) + e.totalLeads;
  });

  const channelBreakdown: Record<string, number> = {};
  entries.forEach((e) => {
    Object.entries(e.channels).forEach(([ch, count]) => {
      channelBreakdown[ch] = (channelBreakdown[ch] || 0) + count;
    });
  });

  const chartLabels = CHANNEL_ORDER.filter((ch) => channelBreakdown[ch] > 0).map((ch) => CHANNEL_LABELS[ch] || ch);
  const chartData = CHANNEL_ORDER.filter((ch) => channelBreakdown[ch] > 0).map((ch) => channelBreakdown[ch]);

  const latestEntry = entries[0];

  const doughnutColors = [
    'rgba(99, 102, 241, 0.85)', 'rgba(168, 85, 247, 0.85)', 'rgba(236, 72, 153, 0.85)',
    'rgba(245, 158, 11, 0.85)', 'rgba(16, 185, 129, 0.85)', 'rgba(59, 130, 246, 0.85)',
    'rgba(239, 68, 68, 0.85)', 'rgba(139, 92, 246, 0.85)', 'rgba(20, 184, 166, 0.85)',
    'rgba(251, 146, 60, 0.85)', 'rgba(34, 197, 94, 0.85)', 'rgba(168, 162, 158, 0.85)',
    'rgba(14, 165, 233, 0.85)',
  ];

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Leads',
        data: chartData,
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2.5,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#0f172a',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 }, maxRotation: 45 },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
        beginAtZero: true,
      },
    },
  };

  const teamLabels = Object.keys(teamBreakdown).sort((a, b) => teamBreakdown[b] - teamBreakdown[a]);
  const teamData = teamLabels.map((t) => teamBreakdown[t]);

  const doughnutChartData = {
    labels: teamLabels,
    datasets: [
      {
        data: teamData,
        backgroundColor: doughnutColors.slice(0, teamLabels.length),
        borderColor: '#0f172a',
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#94a3b8', padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
      },
    },
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Leads</p>
          <p className="mt-2 text-3xl font-black tabular-nums text-white">{totalLeads}</p>
          <p className="mt-3 text-xs text-slate-500">dari {entries.length} entri</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400/70">Tim Aktif</p>
          <p className="mt-2 text-3xl font-black tabular-nums text-indigo-400">{Object.keys(teamBreakdown).length}</p>
          <p className="mt-3 text-xs text-indigo-400/60">tim yang input data</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/70">Channel Aktif</p>
          <p className="mt-2 text-3xl font-black tabular-nums text-emerald-400">{Object.keys(channelBreakdown).length}</p>
          <p className="mt-3 text-xs text-emerald-400/60">sumber leads</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/70">Rata-rata</p>
          <p className="mt-2 text-3xl font-black tabular-nums text-amber-400">{entries.length > 0 ? Math.round(totalLeads / entries.length) : 0}</p>
          <p className="mt-3 text-xs text-amber-400/60">leads per entri</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/80 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {latestEntry ? `Sumber Leads Periode ${latestEntry.period}` : 'Sumber Leads'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">Jumlah Leads = {totalLeads}</p>
            </div>
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5">
              <span className="text-xs font-bold text-indigo-300">{entries.length} entri</span>
            </div>
          </div>
          <div className="mt-5 h-72">
            {chartLabels.length > 0 ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-500">Belum ada data. Simpan data dari form terlebih dahulu.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/80 p-5">
          <h3 className="text-sm font-bold text-slate-100">Distribusi per Tim</h3>
          <div className="mt-4 h-64">
            {teamLabels.length > 0 ? (
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-500">Belum ada data.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/80 p-5">
          <h3 className="text-sm font-bold text-slate-100">Top Channels</h3>
          <div className="mt-4 space-y-2.5">
            {Object.entries(channelBreakdown)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([ch, count]) => (
                <div key={ch} className="flex items-center gap-3">
                  <span className="w-28 text-xs font-medium text-slate-400">{CHANNEL_LABELS[ch] || ch}</span>
                  <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" style={{ width: totalLeads > 0 ? `${(count / totalLeads) * 100}%` : '0%' }} />
                  </div>
                  <span className="w-8 text-right text-xs font-bold tabular-nums text-slate-300">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/80 p-5">
          <h3 className="text-sm font-bold text-slate-100">Entri Terbaru</h3>
          {entries.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Belum ada data.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {entries.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">{e.title}</p>
                    <p className="text-xs text-slate-500">{e.team} &middot; {e.monthLabel}</p>
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-bold tabular-nums text-indigo-300">{e.totalLeads}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
