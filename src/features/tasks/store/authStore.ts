import { create } from 'zustand';
import { AppUser, UserRole } from '../types/user';

interface AuthState {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setRole: (role: UserRole) => void;
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

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const user = await requestJson<AppUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    set({ currentUser: user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    set({ currentUser: null, isAuthenticated: false, isLoading: false });
  },

  checkSession: async () => {
    set({ isLoading: true });

    try {
      const user = await requestJson<AppUser>('/api/auth/me');
      set({ currentUser: user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ currentUser: null, isAuthenticated: false, isLoading: false });
    }
  },

  setRole: (role) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, role }
        : null,
    })),
}));
