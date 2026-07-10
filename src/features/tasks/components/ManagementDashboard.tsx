'use client';

import { useState } from 'react';
import TaskBoard from './TaskBoard';
import MarketingDashboard from './MarketingDashboard';

export default function ManagementDashboard() {
  const [view, setView] = useState<'tasks' | 'marketing'>('tasks');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-5 py-5 md:px-8 md:py-6">
      <div className="rounded-3xl border border-gray-200 bg-white/95 p-4 shadow-sm dark:border-white/[0.08] dark:bg-slate-950/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-400">Management Board</p>
            <h1 className="mt-1 text-xl font-black tracking-tight text-gray-900 dark:text-white">Overview Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Pilih tampilan task board atau marketing dashboard.</p>
          </div>
          <div className="inline-flex rounded-2xl border border-gray-200 bg-gray-100 p-1 dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setView('tasks')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                view === 'tasks'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              📋 Task Board
            </button>
            <button
              type="button"
              onClick={() => setView('marketing')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                view === 'marketing'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              📣 Marketing Data
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'tasks' ? <TaskBoard /> : <MarketingDashboard />}
      </div>
    </div>
  );
}
