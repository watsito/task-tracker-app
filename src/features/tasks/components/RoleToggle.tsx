'use client';

import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/user';

const roles: { value: UserRole; label: string; icon: string }[] = [
  { value: 'admin', label: 'Admin', icon: '👑' },
  { value: 'member', label: 'Member', icon: '👤' },
];

export default function RoleToggle() {
  const { currentUser, setRole } = useAuthStore();

  if (!currentUser || currentUser.role !== 'admin') return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        View as:
      </span>
      <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 backdrop-blur-sm">
        {roles.map(({ value, label, icon }) => {
          const isActive = currentUser.role === value;
          return (
            <button
              key={value}
              id={`role-toggle-${value}`}
              onClick={() => setRole(value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
