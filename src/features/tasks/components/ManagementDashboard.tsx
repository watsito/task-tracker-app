'use client';

import { useState } from 'react';
import TaskBoard from './TaskBoard';
import MarketingDashboard from './MarketingDashboard';
import FinanceBoardPageContent from '@/features/finance/components/FinanceBoardPageContent';

export default function ManagementDashboard() {
  const [view, setView] = useState<'tasks' | 'marketing' | 'finance'>('tasks');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-3 py-3 sm:px-5 sm:py-5 md:px-8 md:py-6">
      <div className="rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-sm dark:border-white/[0.08] dark:bg-slate-950/80 sm:rounded-3xl sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-500 dark:text-indigo-400 sm:text-xs sm:tracking-[0.28em]">Management Board</p>
            <h1 className="mt-1 text-base font-black tracking-tight text-gray-900 dark:text-white sm:text-xl">Overview Dashboard</h1>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400 sm:text-sm">Pilih tampilan task board, marketing data, atau finance board.</p>
          </div>
          <div className="inline-flex w-full rounded-2xl border border-gray-200 bg-gray-100 p-0.5 dark:border-white/10 dark:bg-white/5 sm:w-auto sm:p-1">
            <button
              type="button"
              onClick={() => setView('tasks')}
              className={`flex-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition sm:flex-none sm:px-4 sm:py-2 sm:text-xs ${
                view === 'tasks'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Task Board
            </button>
            <button
              type="button"
              onClick={() => setView('marketing')}
              className={`flex-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition sm:flex-none sm:px-4 sm:py-2 sm:text-xs ${
                view === 'marketing'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Marketing Data
            </button>
            <button
              type="button"
              onClick={() => setView('finance')}
              className={`flex-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition sm:flex-none sm:px-4 sm:py-2 sm:text-xs ${
                view === 'finance'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Finance Board
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {view === 'tasks' ? (
          <TaskBoard />
        ) : view === 'marketing' ? (
          <MarketingDashboard />
        ) : (
          <FinanceBoardPageContent />
        )}
      </div>
    </div>
  );
}
