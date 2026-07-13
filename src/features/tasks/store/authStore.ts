import { create } from 'zustand';
import { AppUser, Department, UserRole } from '../types/user';

const DEPARTMENT_STORAGE_KEY = 'task_tracker_department';

interface AuthState {
  currentUser: AppUser | null;
  currentDepartment: Department;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setRole: (role: UserRole) => void;
  switchDepartment: (department: Department) => void;
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
    const data = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(data?.error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

function getStoredDepartment(): Department | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(DEPARTMENT_STORAGE_KEY);
  if (stored === 'MARKETING' || stored === 'OPERATIONAL' || stored === 'MANAGEMENT' || stored === 'FINANCE') return stored;
  return null;
}

function getDefaultDepartment(user: AppUser): Department {
  const stored = getStoredDepartment();
  if (user.departments.length === 0) return stored ?? 'OPERATIONAL';
  if (stored && user.departments.includes(stored)) return stored;
  if (user.departments.includes('OPERATIONAL')) return 'OPERATIONAL';
  if (user.departments.includes('MARKETING')) return 'MARKETING';
  if (user.departments.includes('MANAGEMENT')) return 'MANAGEMENT';
  if (user.departments.includes('FINANCE')) return 'FINANCE';
  return 'OPERATIONAL';
}

function saveDepartment(department: Department) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEPARTMENT_STORAGE_KEY, department);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  currentDepartment: 'OPERATIONAL',
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const user = await requestJson<AppUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const dept = getDefaultDepartment(user);
    saveDepartment(dept);
    set({ currentUser: user, currentDepartment: dept, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem(DEPARTMENT_STORAGE_KEY);
    set({ currentUser: null, currentDepartment: 'OPERATIONAL', isAuthenticated: false, isLoading: false });
  },

  checkSession: async () => {
    set({ isLoading: true });

    try {
      const user = await requestJson<AppUser>('/api/auth/me');
      const dept = getDefaultDepartment(user);
      set({ currentUser: user, currentDepartment: dept, isAuthenticated: true, isLoading: false });
    } catch {
      set({ currentUser: null, currentDepartment: 'OPERATIONAL', isAuthenticated: false, isLoading: false });
    }
  },

  setRole: (role) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, role }
        : null,
    })),

  switchDepartment: (department) => {
    saveDepartment(department);
    set({ currentDepartment: department });
  },
}));
