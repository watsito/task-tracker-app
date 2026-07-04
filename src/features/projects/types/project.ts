export interface Project {
  id: string;
  name: string;
  client: string | null;
  description: string;
  dueDate: Date | null;
}

export interface Milestone {
  id: string;
  name: string;
  projectId: string;
  dueDate: Date | null;
}
