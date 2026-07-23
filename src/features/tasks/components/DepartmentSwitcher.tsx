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
        className="flex items-center gap-2 border border-stone-300 bg-transparent px-3 py-2 text-xs font-semibold text-stone-700 transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-stone-200/70 active:translate-y-0 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-white/[0.06]"
      >
        <span className="flex h-4 w-4 items-center justify-center" aria-hidden="true"><DepartmentIcon /></span>
        <span>{active?.label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="motion-scale-in absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden border border-stone-200 bg-[#faf8f5] shadow-[0_20px_50px_rgba(41,37,36,0.16)] dark:border-stone-700 dark:bg-[#1c1917] dark:shadow-black/40">
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
                        ? 'bg-stone-100 dark:bg-[#b46b3d]/15'
                         : 'hover:bg-stone-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                   <span className={`mt-0.5 flex h-7 w-7 items-center justify-center border ${isActive ? 'border-stone-700 text-stone-900 dark:border-[#b46b3d] dark:text-[#d89162]' : 'border-stone-300 text-stone-500 dark:border-stone-700 dark:text-stone-500'}`} aria-hidden="true"><DepartmentIcon /></span>
                   <div className="flex-1">
                     <p className={`text-sm font-semibold ${isActive ? 'text-stone-900 dark:text-[#d89162]' : 'text-stone-800 dark:text-stone-200'}`}>{dept.label}</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500">{dept.desc}</p>
                  </div>
                  {isActive && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0 text-stone-700 dark:text-[#d89162]">
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

function DepartmentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
