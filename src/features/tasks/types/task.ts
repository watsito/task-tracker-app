export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  team?: string | null;
  parentId?: string | null;
  projectId?: string | null;
  milestoneId?: string | null;
  dueDate?: Date | null;
  createdAt: Date;
  /** ISO timestamp set on soft-delete. Tasks with this field are hidden from the main board. */
  deletedAt?: Date;
}
