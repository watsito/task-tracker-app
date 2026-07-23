'use client';

import { useState } from 'react';
import LocalBoard from './LocalBoard';
import OdooBoard from './OdooBoard';

type BoardMode = 'local' | 'odoo';

const BOARD_MODES: Array<{ key: BoardMode; label: string; icon: string }> = [
  { key: 'local', label: 'Local', icon: '📋' },
  { key: 'odoo', label: 'Odoo', icon: '🔗' },
];

interface TaskBoardProps {
  readOnly?: boolean;
}

export default function TaskBoard({ readOnly = false }: TaskBoardProps) {
  const [mode, setMode] = useState<BoardMode>('local');

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6 md:p-8">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
              Project Board
            </h1>
          </div>
          <p className="mt-0.5 text-sm text-slate-400">
            {mode === 'local' ? 'Kelola task internal aplikasi' : 'Lihat project Odoo secara read-only'}
          </p>
        </div>

        <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          {BOARD_MODES.map((item) => {
            const active = mode === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setMode(item.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === 'local' ? <LocalBoard readOnly={readOnly} /> : <OdooBoard />}
    </div>
  );
}
