import { create } from 'zustand';
import { AppUser, UserRole } from '../types/user';
import { auth, googleProvider, isConfigured } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

interface AuthState {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  login: (name?: string, email?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Listen to Firebase Auth state changes if configured
  if (isConfigured && auth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        set({
          isAuthenticated: true,
          currentUser: {
            id: user.uid,
            name: user.displayName || 'Unknown',
            email: user.email || '',
            role: 'member', // Default role for now, could be fetched from Firestore
          },
        });
      } else {
        set({
          isAuthenticated: false,
          currentUser: null,
        });
      }
    });
  }

  return {
    currentUser: null,
    isAuthenticated: false,

    login: async (name, email, role) => {
      if (isConfigured && auth && googleProvider) {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (error) {
          console.error("Firebase Login Error:", error);
          throw error;
        }
      } else {
        // Fallback to mock login
        set({
          isAuthenticated: true,
          currentUser: {
            id: `user-${crypto.randomUUID().slice(0, 8)}`,
            name: name || 'Demo User',
            email: email || 'demo@example.com',
            role: role || 'admin',
          },
        });
      }
    },

    logout: async () => {
      if (isConfigured && auth) {
        await signOut(auth);
      } else {
        set({
          isAuthenticated: false,
          currentUser: null,
        });
      }
    },

    /** Toggle role for dev-mode RBAC testing. */
    setRole: (role) =>
      set((state) => ({
        currentUser: state.currentUser
          ? { ...state.currentUser, role }
          : null,
      })),
  };
});
