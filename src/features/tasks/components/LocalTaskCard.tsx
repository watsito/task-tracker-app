'use client';

import { Task, TaskPriority, TaskStatus } from '../types/task';
import { useTaskStore } from '../store/taskStore';
import { useIntegrationStore } from '@/features/integrations/store/integrationStore';
import SyncStatusBadge from '@/features/integrations/components/SyncStatusBadge';
import { isTaskDueSoon } from '@/features/reports/utils/exportUtils';
import { useDraggable } from '@dnd-kit/core';

const PRIORITY_STYLES: Record<
  TaskPriority,
  { label: string; classes: string; dot: string }
> = {
  Low: {
    label: 'Low',
    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  Medium: {
    label: 'Medium',
    classes: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
  },
  High: {
    label: 'High',
    classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  Urgent: {
    label: 'Urgent',
    classes: 'bg-red-500/15 text-red-400 border-red-500/30',
    dot: 'bg-red-400',
  },
};

const STATUS_ORDER: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];

interface LocalTaskCardProps {
  task: Task;
  isAdmin: boolean;
  onEdit?: () => void;
}

function getAvatarLabel(assigneeId: string | null): string {
  if (!assigneeId) return '?';
  const map: Record<string, string> = {
    'user-1': 'AM',
    'user-2': 'BR',
    'user-3': 'CJ',
  };
  return map[assigneeId] ?? assigneeId.slice(0, 2).toUpperCase();
}

function getAvatarColor(assigneeId: string | null): string {
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-sky-500 to-cyan-600',
    'from-rose-500 to-pink-600',
  ];
  if (!assigneeId) return colors[0];
  const index = parseInt(assigneeId.replace(/\D/g, '') || '0', 10) % colors.length;
  return colors[index];
}

export default function LocalTaskCard({ task, isAdmin, onEdit }: LocalTaskCardProps) {
  const { tasks, moveTask, updateTask, softDeleteTask } = useTaskStore();
  const getSyncStatus = useIntegrationStore((s) => s.getSyncStatus);
  const syncStatus = getSyncStatus(task.id);
  const priority = PRIORITY_STYLES[task.priority];

  const currentIndex = STATUS_ORDER.indexOf(task.status);
  const canMoveBack = currentIndex > 0;
  const canMoveForward = currentIndex < STATUS_ORDER.length - 1;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? '0 20px 25px -5px rgb(0 0 0 / 0.5)' : undefined,
      }
    : undefined;

  const childTasks = tasks.filter((t) => t.parentId === task.id && !t.deletedAt);
  const completedChildTasks = childTasks.filter((t) => t.status === 'Done');
  const visibleChildTasks = childTasks.slice(0, 4);
  const remainingChildTasks = childTasks.length - visibleChildTasks.length;
  const isOverdue = !!task.dueDate && task.status !== 'Done' && task.dueDate < new Date();
  const isDueSoon = isTaskDueSoon(task);
  const formattedDueDate = task.dueDate?.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      id={`task-card-${task.id}`}
      className={`group relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md dark:border-white/[0.07] dark:bg-slate-800/60 dark:backdrop-blur-sm dark:hover:border-white/[0.14] dark:hover:bg-slate-800/80 dark:hover:shadow-lg dark:hover:shadow-black/30 dark:hover:-translate-y-0.5 ${
        isDragging ? 'cursor-grabbing border-indigo-500/50' : 'cursor-grab'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${priority.classes}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
          </span>
          {task.team && (
            <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300">
              {task.team}
            </span>
          )}
          {task.dueDate && (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${isOverdue ? 'border-red-500/30 bg-red-500/15 text-red-400' : isDueSoon ? 'border-amber-500/30 bg-amber-500/15 text-amber-300' : 'border-indigo-500/30 bg-indigo-500/15 text-indigo-300'}`}>
              {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : formattedDueDate}
            </span>
          )}
          <SyncStatusBadge status={syncStatus} />
        </div>

        <div className="flex gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              title="Edit task"
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-all duration-150 hover:bg-indigo-500/20 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400"
            >
              <PencilIcon />
            </button>
          )}
          {isAdmin && (
            <button
              id={`delete-task-${task.id}`}
              onClick={() => softDeleteTask(task.id)}
              title="Soft delete task"
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-all duration-150 hover:bg-red-500/20 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold leading-snug text-gray-900 dark:text-slate-100">
          {task.title}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
          {task.description}
        </p>
      </div>

      {childTasks.length > 0 && (
        <div className="mt-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-medium text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CheckSquareIcon />
              Subtasks
            </span>
            <span>
              {completedChildTasks.length}/{childTasks.length} Selesai
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700/50">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{
                width: `${(completedChildTasks.length / childTasks.length) * 100}%`,
              }}
            />
          </div>
          <div className="mt-1.5 flex flex-col gap-1">
            {visibleChildTasks.map((childTask) => {
              const isDone = childTask.status === 'Done';

              return (
                <button
                  key={childTask.id}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTask(childTask.id, { status: isDone ? 'To Do' : 'Done' });
                  }}
                  className="flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-[11px] transition hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <span className={isDone ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'}>
                    {isDone ? '✓' : '○'}
                  </span>
                  <span className={`truncate ${isDone ? 'text-gray-400 line-through dark:text-slate-500' : 'text-gray-700 dark:text-slate-300'}`}>
                    {childTask.title}
                  </span>
                </button>
              );
            })}
            {remainingChildTasks > 0 && (
              <p className="pl-4 text-[10px] font-medium text-gray-400 dark:text-slate-500">
                Lihat {remainingChildTasks} lainnya...
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white ${getAvatarColor(task.assigneeId)}`}
          title={task.assigneeId ?? 'Unassigned'}
        >
          {getAvatarLabel(task.assigneeId)}
        </div>

        <div className="flex gap-1">
          <button
            id={`move-back-${task.id}`}
            onClick={() => moveTask(task.id, STATUS_ORDER[currentIndex - 1])}
            disabled={!canMoveBack}
            title={canMoveBack ? `Move to ${STATUS_ORDER[currentIndex - 1]}` : 'Already at first column'}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors disabled:cursor-not-allowed disabled:opacity-30 hover:enabled:bg-gray-100 hover:enabled:text-gray-700 dark:text-slate-500 dark:hover:enabled:bg-white/10 dark:hover:enabled:text-slate-200"
          >
            <ChevronLeftIcon />
          </button>
          <button
            id={`move-forward-${task.id}`}
            onClick={() => moveTask(task.id, STATUS_ORDER[currentIndex + 1])}
            disabled={!canMoveForward}
            title={canMoveForward ? `Move to ${STATUS_ORDER[currentIndex + 1]}` : 'Already at last column'}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors disabled:cursor-not-allowed disabled:opacity-30 hover:enabled:bg-gray-100 hover:enabled:text-gray-700 dark:text-slate-500 dark:hover:enabled:bg-white/10 dark:hover:enabled:text-slate-200"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </article>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4M6.667 7.333v4M9.333 7.333v4M3.333 4l.667 9.333a1.333 1.333 0 001.333 1.334h5.334a1.333 1.333 0 001.333-1.334L12.667 4" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 12L6 8l4-4" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

function CheckSquareIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
