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
  deletedAt?: Date;
}

export interface OdooProjectStage {
  id: number;
  name: string;
  sequence: number;
}

export interface OdooProject {
  id: number;
  name: string;
  stageId: number | null;
  stageName: string;
  isFavorite: boolean;
  ownerId: number | null;
  ownerName: string | null;
  ownerInitials: string;
  tagIds: number[];
  tagNames: string[];
  dateStart: string | null;
  dateEnd: string | null;
  taskCount: number;
}
