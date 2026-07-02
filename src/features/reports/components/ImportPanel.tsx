'use client';

import { useState, useRef, useCallback } from 'react';
import { useTaskStore } from '@/features/tasks/store/taskStore';
import { parseJsonFile, parseCsvFile } from '../utils/importUtils';
import { ImportResult } from '../types/report';

type ImportState = 'idle' | 'dragging' | 'parsing' | 'done' | 'error';

export default function ImportPanel() {
  const { addTask } = useTaskStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importState, setImportState] = useState<ImportState>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'json'].includes(ext ?? '')) {
      setResult({ imported: 0, skipped: 0, errors: ['Format file tidak didukung. Gunakan .csv atau .json'], tasks: [] });
      setImportState('error');
      return;
    }

    setFileName(file.name);
    setImportState('parsing');
    setResult(null);

    await new Promise((r) => setTimeout(r, 400)); // UX: brief delay so "parsing" state is visible

    try {
      const parsed = ext === 'json'
        ? await parseJsonFile(file)
        : await parseCsvFile(file);

      // Add valid tasks to store
      parsed.tasks.forEach((t) => addTask(t));

      setResult(parsed);
      setImportState(parsed.errors.length > 0 && parsed.imported === 0 ? 'error' : 'done');
    } catch (e) {
      setResult({ imported: 0, skipped: 0, errors: [`Error membaca file: ${String(e)}`], tasks: [] });
      setImportState('error');
    }
  }, [addTask]);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setImportState('dragging'); };
  const handleDragLeave = () => { if (importState === 'dragging') setImportState('idle'); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const reset = () => { setImportState('idle'); setResult(null); setFileName(''); };

  const isDragging = importState === 'dragging';
  const isParsing = importState === 'parsing';

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-slate-900/80 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 shadow-lg shadow-sky-500/25">
          <ImportIcon />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Import Data</h3>
          <p className="text-xs text-slate-500">Upload file CSV atau JSON untuk menambah task</p>
        </div>
      </div>

      {/* Drop zone */}
      {importState !== 'done' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500/60 bg-indigo-500/10'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
          }`}
        >
          <input
            ref={fileInputRef}
            id="import-file-input"
            type="file"
            accept=".csv,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          {isParsing ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-sky-400" />
              <p className="text-sm text-slate-400">Memproses <span className="font-medium text-slate-200">{fileName}</span>…</p>
            </>
          ) : (
            <>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${isDragging ? 'border-indigo-500/40 bg-indigo-500/20' : 'border-white/10 bg-white/5'}`}>
                <UploadIcon isDragging={isDragging} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  {isDragging ? 'Lepaskan file di sini' : 'Drag & drop atau klik untuk pilih file'}
                </p>
                <p className="mt-1 text-xs text-slate-600">Mendukung .csv dan .json</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Result panel */}
      {result && (
        <div className="mt-4">
          {/* Summary */}
          <div className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${
            importState === 'error'
              ? 'border-red-500/20 bg-red-500/10'
              : result.errors.length > 0
              ? 'border-amber-500/20 bg-amber-500/10'
              : 'border-emerald-500/20 bg-emerald-500/10'
          }`}>
            <span className="text-lg">
              {importState === 'error' ? '❌' : result.errors.length > 0 ? '⚠️' : '✅'}
            </span>
            <div className="flex-1">
              <p className={`text-xs font-semibold ${
                importState === 'error' ? 'text-red-400' : result.errors.length > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {importState === 'error' && result.imported === 0
                  ? 'Import Gagal'
                  : `${result.imported} task berhasil diimport`}
                {result.skipped > 0 && `, ${result.skipped} dilewati`}
              </p>
              {result.imported > 0 && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Task baru telah ditambahkan ke Kanban board
                </p>
              )}
            </div>
          </div>

          {/* Error list */}
          {result.errors.length > 0 && (
            <details className="mt-3" open={result.imported === 0}>
              <summary className="cursor-pointer text-xs font-medium text-red-400 hover:text-red-300">
                {result.errors.length} error ditemukan
              </summary>
              <ul className="mt-2 max-h-36 overflow-y-auto rounded-lg bg-black/30 px-3 py-2">
                {result.errors.map((err, i) => (
                  <li key={i} className="py-0.5 text-[11px] text-red-400/80">
                    • {err}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <button
              id="import-reset-btn"
              onClick={reset}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
            >
              Import Lagi
            </button>
          </div>
        </div>
      )}

      {/* Template download hint */}
      {importState === 'idle' && (
        <p className="mt-3 text-[11px] text-slate-600">
          Pastikan kolom CSV mengandung: <code className="text-slate-500">title, status, priority</code>
        </p>
      )}
    </div>
  );
}

function ImportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function UploadIcon({ isDragging }: { isDragging: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDragging ? '#818cf8' : '#475569'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}
