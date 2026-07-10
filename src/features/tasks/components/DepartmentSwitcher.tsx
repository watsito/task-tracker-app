'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { DEPARTMENTS, Department } from '../types/user';

export default function DepartmentSwitcher() {
  const { currentUser, currentDepartment, switchDepartment } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const availableDepartments = currentUser?.role === 'admin'
    ? DEPARTMENTS
    : DEPARTMENTS.filter((d) => currentUser?.departments.includes(d.value));

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!currentUser || availableDepartments.length <= 1) return null;

  const active = DEPARTMENTS.find((d) => d.value === currentDepartment);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
      >
        <span>{active?.icon}</span>
        <span>{active?.label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900">
          <div className="px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Switch Department</p>
          </div>
          <div className="border-t border-gray-100 dark:border-white/[0.06]">
            {DEPARTMENTS.map((dept) => {
              const hasAccess = currentUser.role === 'admin' || currentUser.departments.includes(dept.value);
              const isActive = currentDepartment === dept.value;
              return (
                <button
                  key={dept.value}
                  type="button"
                  disabled={!hasAccess}
                  onClick={() => {
                    if (hasAccess) {
                      switchDepartment(dept.value as Department);
                      setOpen(false);
                    }
                  }}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                    !hasAccess
                      ? 'cursor-not-allowed opacity-40'
                      : isActive
                        ? 'bg-indigo-50 dark:bg-indigo-500/10'
                        : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="mt-0.5 text-lg">{dept.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-slate-200'}`}>{dept.label}</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500">{dept.desc}</p>
                  </div>
                  {isActive && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0 text-indigo-500 dark:text-indigo-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
