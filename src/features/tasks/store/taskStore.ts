import { create } from 'zustand';
import { Task, TaskStatus } from '../types/task';

interface TaskState {
  tasks: Task[];
  isSyncing: boolean;
  subscribeToTasks: () => () => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<string>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  moveTask: (id: string, newStatus: TaskStatus) => Promise<void>;
  softDeleteTask: (id: string) => Promise<void>;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    createdAt: new Date(task.createdAt),
    deletedAt: task.deletedAt ? new Date(task.deletedAt) : undefined,
  };
}

function normalizeTasks(tasks: Task[]): Task[] {
  return tasks.map(normalizeTask);
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isSyncing: false,

  subscribeToTasks: () => {
    let isActive = true;

    set({ isSyncing: true });
    requestJson<Task[]>('/api/tasks')
      .then((tasks) => {
        if (isActive) set({ tasks: normalizeTasks(tasks), isSyncing: false });
      })
      .catch((error) => {
        console.error('Failed to load tasks:', error);
        if (isActive) set({ isSyncing: false });
      });

    return () => {
      isActive = false;
    };
  },

  addTask: async (task) => {
    const newTask = await requestJson<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });

    const normalizedTask = normalizeTask(newTask);

    set((state) => ({ tasks: [...state.tasks, normalizedTask] }));
    return normalizedTask.id;
  },

  updateTask: async (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    }));

    try {
      const updatedTask = normalizeTask(await requestJson<Task>(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }));

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? updatedTask : task
        ),
      }));
    } catch (error) {
      console.error('Failed to update task:', error);
      const tasks = await requestJson<Task[]>('/api/tasks');
      set({ tasks: normalizeTasks(tasks) });
    }
  },

  moveTask: async (id, newStatus) => {
    await useTaskStore.getState().updateTask(id, { status: newStatus });
  },

  softDeleteTask: async (id) => {
    await useTaskStore.getState().updateTask(id, { deletedAt: new Date() });
  },
}));
