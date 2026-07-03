import type { Task as AppTask, TaskPriority as AppTaskPriority, TaskStatus as AppTaskStatus } from '@/features/tasks/types/task';
import type { Task as DbTask } from '@/generated/prisma/client';
import { TaskPriority, TaskStatus } from '@/generated/prisma/client';

export function toDbStatus(status: AppTaskStatus): TaskStatus {
  const map: Record<AppTaskStatus, TaskStatus> = {
    'To Do': TaskStatus.TODO,
    'In Progress': TaskStatus.IN_PROGRESS,
    Review: TaskStatus.REVIEW,
    Done: TaskStatus.DONE,
  };

  return map[status];
}

export function toAppStatus(status: TaskStatus): AppTaskStatus {
  const map: Record<TaskStatus, AppTaskStatus> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    REVIEW: 'Review',
    DONE: 'Done',
  };

  return map[status];
}

export function toDbPriority(priority: AppTaskPriority): TaskPriority {
  const map: Record<AppTaskPriority, TaskPriority> = {
    Low: TaskPriority.LOW,
    Medium: TaskPriority.MEDIUM,
    High: TaskPriority.HIGH,
    Urgent: TaskPriority.URGENT,
  };

  return map[priority];
}

export function toAppPriority(priority: TaskPriority): AppTaskPriority {
  const map: Record<TaskPriority, AppTaskPriority> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
  };

  return map[priority];
}

export function toAppTask(task: DbTask): AppTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: toAppStatus(task.status),
    priority: toAppPriority(task.priority),
    assigneeId: task.assigneeId,
    team: task.team,
    parentId: task.parentId,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    deletedAt: task.deletedAt ?? undefined,
  };
}
