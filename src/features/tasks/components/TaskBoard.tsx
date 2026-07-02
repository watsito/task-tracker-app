'use client';

import { useState, useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { TaskStatus, TaskPriority, Task } from '../types/task';
import TaskCard from './TaskCard';
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

function TaskModal({ defaultStatus, editTask, onClose }: TaskModalProps) {
  const { tasks, addTask, updateTask } = useTaskStore();
  const [title, setTitle] = useState(editTask?.title || '');
  const [description, setDescription] = useState(editTask?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(editTask?.priority || 'Medium');
  const [status, setStatus] = useState<TaskStatus>(editTask?.status || defaultStatus);
  const [team, setTeam] = useState<string>(editTask?.team || '');
  const [parentId, setParentId] = useState<string>(editTask?.parentId || '');
  
  const availableParents = tasks.filter(t => 
    t.id !== editTask?.id && 
    !t.parentId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const finalParentId = parentId || null;
    
    if (editTask) {
      updateTask(editTask.id, { title: title.trim(), description: description.trim(), status, priority, team: team || null, parentId: finalParentId });
    } else {
      await addTask({ title: title.trim(), description: description.trim(), status, priority, assigneeId: null, parentId: finalParentId, team: team || null });
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
              Create Task
            </button>
          </div>
        </form>
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
  
  // Advanced Filtering States
  const [filterMyTasks, setFilterMyTasks] = useState(false);
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);

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
    return true;
  });
  const deletedCount = tasks.filter((t) => !!t.deletedAt).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6 md:p-8">
      {/* Board header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Project Board
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}
            {isAdmin && deletedCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                {deletedCount} archived
              </span>
            )}
          </p>
        </div>

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
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex xl:hidden overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 md:-mx-8 md:px-8">
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

      {/* Kanban columns */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 flex flex-col xl:grid xl:grid-cols-4 gap-4 pb-4">
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
      className={`flex-col h-full rounded-2xl border transition-all duration-300 ${
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
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 min-h-0">
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
