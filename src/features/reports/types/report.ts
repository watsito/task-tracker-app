import { Task, TaskStatus, TaskPriority } from '@/features/tasks/types/task';

export interface TaskSummary {
  total: number;
  active: number;
  archived: number;
  completionRate: number; // 0–100
  withDueDate: number;
  overdue: number;
  dueSoon: number;
  onTime: number;
  deadlineHealthRate: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  tasks: Omit<Task, 'id' | 'createdAt'>[];
}

export type ExportFormat = 'csv' | 'json';

/** Kolom yang akan masuk ke CSV export */
export const CSV_COLUMNS = [
  'id',
  'title',
  'description',
  'status',
  'priority',
  'team',
  'assigneeId',
  'parentId',
  'dueDate',
  'createdAt',
  'deletedAt',
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];
