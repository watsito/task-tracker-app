'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { DEPARTMENTS } from '../types/user';

export default function HeaderUser() {
  const { currentUser, logout } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!currentUser) return null;

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isAdmin = currentUser.role === 'admin';
  const dept = DEPARTMENTS.find((d) => d.value === useAuthStore.getState().currentDepartment);

  return (
    <div ref={menuRef} className="relative">
      <button
        id="header-user-btn"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-xl border border-gray-300 bg-gray-100 px-2.5 py-1.5 transition-all hover:border-gray-400 hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-bold text-white">
          {initials}
        </div>
        <div className="hidden flex-col items-start sm:flex">
          <span className="text-xs font-semibold leading-tight text-gray-900 dark:text-slate-200">
            {currentUser.name}
          </span>
          <span className={`text-[10px] font-medium leading-tight ${isAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-500'}`}>
            {isAdmin ? '👑 Admin' : `${dept?.icon ?? '👤'} ${dept?.label ?? 'Member'}`}
          </span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:shadow-black/50">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-white/[0.06]">
            <p className="text-xs font-semibold text-gray-900 dark:text-slate-200">{currentUser.name}</p>
            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-500">{currentUser.email}</p>
          </div>

          <div className="p-1.5">
            <button
              id="dropdown-profile"
              onClick={() => { setOpen(false); router.push('/profile'); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
            >
              <UserIcon />
              Profil Saya
            </button>
            {isAdmin && (
              <button
                id="dropdown-settings"
                onClick={() => { setOpen(false); router.push('/settings'); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
              >
                <SettingsIcon />
                Pengaturan
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 p-1.5 dark:border-white/[0.06]">
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            >
              <LogoutIcon />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={`text-gray-500 dark:text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
