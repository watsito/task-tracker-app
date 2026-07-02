'use client';

import { useState } from 'react';
import { useTaskStore } from '@/features/tasks/store/taskStore';
import { exportToCsv, exportToJson, exportToPdf } from '../utils/exportUtils';

export default function ExportPanel() {
  const { tasks } = useTaskStore();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [justExported, setJustExported] = useState<'csv' | 'json' | 'pdf' | null>(null);

  const getExportTasks = () =>
    includeArchived ? tasks : tasks.filter((t) => !t.deletedAt);

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    const data = getExportTasks();
    if (format === 'csv') exportToCsv(data);
    else if (format === 'json') exportToJson(data);
    else if (format === 'pdf') exportToPdf(data);
    setJustExported(format);
    setTimeout(() => setJustExported(null), 2500);
  };

  const exportCount = getExportTasks().length;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-slate-900/80 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg shadow-indigo-500/25">
          <ExportIcon />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Export Data</h3>
          <p className="text-xs text-slate-500">Unduh data task ke file lokal</p>
        </div>
      </div>

      {/* Options */}
      <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
        <button
          id="include-archived-toggle"
          type="button"
          onClick={() => setIncludeArchived((v) => !v)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
            includeArchived ? 'bg-indigo-600' : 'bg-slate-700'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              includeArchived ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-xs text-slate-400">
          Sertakan task yang diarsipkan
          {includeArchived && (
            <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
              +{tasks.filter((t) => !!t.deletedAt).length} task
            </span>
          )}
        </span>
      </div>

      <p className="mb-3 text-xs text-slate-500">
        Akan mengekspor <span className="font-semibold text-slate-300">{exportCount} task</span>
      </p>

      {/* Export buttons */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* CSV */}
        <button
          id="export-csv-btn"
          onClick={() => handleExport('csv')}
          className="flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 transition-all duration-150 hover:bg-emerald-500/20 active:scale-95"
        >
          {justExported === 'csv' ? <CheckIcon /> : <CsvIcon />}
          {justExported === 'csv' ? 'Berhasil!' : 'CSV'}
        </button>

        {/* JSON */}
        <button
          id="export-json-btn"
          onClick={() => handleExport('json')}
          className="flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-400 transition-all duration-150 hover:bg-amber-500/20 active:scale-95"
        >
          {justExported === 'json' ? <CheckIcon /> : <JsonIcon />}
          {justExported === 'json' ? 'Berhasil!' : 'JSON'}
        </button>

        {/* PDF */}
        <button
          id="export-pdf-btn"
          onClick={() => handleExport('pdf')}
          className="flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400 transition-all duration-150 hover:bg-rose-500/20 active:scale-95"
        >
          {justExported === 'pdf' ? <CheckIcon /> : <PdfIcon />}
          {justExported === 'pdf' ? 'Berhasil!' : 'PDF'}
        </button>
      </div>

      {/* Format info */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-400">
          Lihat format kolom CSV
        </summary>
        <code className="mt-2 block rounded-lg bg-black/30 px-3 py-2 text-[10px] leading-5 text-slate-400">
          id, title, description, status, priority, assigneeId, createdAt, deletedAt
        </code>
      </details>
    </div>
  );
}

function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
function CsvIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
}
function JsonIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
function PdfIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15v-6h3a2 2 0 010 4h-3"/></svg>;
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
