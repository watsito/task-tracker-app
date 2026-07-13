'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FinanceProjectList from './FinanceProjectList';
import type { FinanceProjectInput, FinanceProjectRecord, FinanceProjectStatus, FinanceTerminInput } from '../types/finance';

const EMPTY_TERMIN = (order: number): FinanceTerminInput => ({
  order,
  name: `Termin ${order}`,
  percentage: 0,
  billingDate: null,
  description: '',
  billingStatus: 'NOT_BILLABLE',
  disbursementStatus: 'NOT_DISBURSED',
});

const EMPTY_FORM: FinanceProjectInput = {
  clientName: '',
  projectName: '',
  dateStart: null,
  dateEnd: null,
  totalProject: 0,
  status: 'PENDING',
  notes: '',
  termins: [EMPTY_TERMIN(1)],
};

const STATUS_OPTIONS: Array<{ value: FinanceProjectStatus; label: string }> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

function normalizeRecordToInput(record: FinanceProjectRecord): FinanceProjectInput {
  return {
    clientName: record.clientName,
    projectName: record.projectName,
    dateStart: record.dateStart ? record.dateStart.slice(0, 10) : null,
    dateEnd: record.dateEnd ? record.dateEnd.slice(0, 10) : null,
    totalProject: record.totalProject,
    status: record.status,
    notes: record.notes,
    termins: record.termins.map((termin, index) => ({
      id: termin.id,
      order: index + 1,
      name: termin.name,
      percentage: termin.percentage,
      billingDate: termin.billingDate ? termin.billingDate.slice(0, 10) : null,
      description: termin.description,
      billingStatus: termin.billingStatus,
      disbursementStatus: termin.disbursementStatus,
    })),
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function FinanceForm() {
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');
  const [form, setForm] = useState<FinanceProjectInput>(EMPTY_FORM);
  const [entries, setEntries] = useState<FinanceProjectRecord[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);

    try {
      const response = await fetch('/api/finance-projects');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setEntries(data);
        return data as FinanceProjectRecord[];
      }
      showToast(data.error ?? 'Gagal memuat data finance.', 'error');
      return [] as FinanceProjectRecord[];
    } catch {
      showToast('Gagal memuat data finance.', 'error');
      return [] as FinanceProjectRecord[];
    } finally {
      setLoadingEntries(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadEntries();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadEntries]);

  useEffect(() => {
    if (!editingId || entries.length === 0) return;
    const selected = entries.find((entry) => entry.id === editingId);
    if (!selected) return;

    const timeout = setTimeout(() => {
      setForm(normalizeRecordToInput(selected));
    }, 0);

    return () => clearTimeout(timeout);
  }, [editingId, entries]);

  const totalTerminPercentage = useMemo(
    () => form.termins.reduce((total, termin) => total + (Number.isFinite(termin.percentage) ? termin.percentage : 0), 0),
    [form.termins]
  );

  const totalTerminAmount = useMemo(
    () => form.termins.reduce((total, termin) => total + (form.totalProject * (termin.percentage || 0)) / 100, 0),
    [form.termins, form.totalProject]
  );

  const updateField = <K extends keyof FinanceProjectInput>(key: K, value: FinanceProjectInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateTermin = <K extends keyof FinanceTerminInput>(index: number, key: K, value: FinanceTerminInput[K]) => {
    setForm((prev) => ({
      ...prev,
      termins: prev.termins.map((termin, terminIndex) =>
        terminIndex === index ? { ...termin, [key]: value } : termin
      ),
    }));
  };

  const addTermin = () => {
    setForm((prev) => ({
      ...prev,
      termins: [...prev.termins, EMPTY_TERMIN(prev.termins.length + 1)],
    }));
  };

  const removeTermin = (index: number) => {
    setForm((prev) => {
      const nextTermins = prev.termins.filter((_, terminIndex) => terminIndex !== index).map((termin, idx) => ({
        ...termin,
        order: idx + 1,
        name: termin.name.startsWith('Termin ') ? `Termin ${idx + 1}` : termin.name,
      }));

      return {
        ...prev,
        termins: nextTermins.length > 0 ? nextTermins : [EMPTY_TERMIN(1)],
      };
    });
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      window.history.replaceState({}, '', url);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/finance-projects/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? 'Gagal menghapus project finance.', 'error');
        return;
      }

      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      if (editingId === id) resetForm();
      showToast('Project finance berhasil dihapus.');
    } catch {
      showToast('Gagal menghapus project finance.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: FinanceProjectInput = {
        ...form,
        clientName: form.clientName.trim(),
        projectName: form.projectName.trim(),
        notes: form.notes.trim(),
        totalProject: Number(form.totalProject) || 0,
        termins: form.termins.map((termin, index) => ({
          ...termin,
          order: index + 1,
          percentage: Number(termin.percentage) || 0,
          description: termin.description.trim(),
          name: termin.name.trim() || `Termin ${index + 1}`,
        })),
      };

      const response = await fetch(editingId ? `/api/finance-projects/${editingId}` : '/api/finance-projects', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        showToast(data.error ?? 'Gagal menyimpan project finance.', 'error');
        return;
      }

      const refreshed = await loadEntries();
      showToast(editingId ? 'Project finance berhasil diperbarui.' : 'Project finance berhasil dibuat.');
      const inserted = refreshed.find((entry) => entry.id === data.id);
      if (inserted) {
        setForm(normalizeRecordToInput(inserted));
      } else {
        resetForm();
      }
    } catch {
      showToast('Gagal menyimpan project finance.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-5 md:p-8">
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-lg dark:border-white/[0.08] dark:bg-slate-900/80 dark:shadow-2xl dark:shadow-black/30">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">Finance Project Form</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-500">Kelola project finance dan termin penagihan secara dinamis.</p>
          </div>
          <Link href="/finance" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.04]">
            Kembali ke Board
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-lg dark:border-white/[0.08] dark:bg-slate-900/80 dark:shadow-2xl dark:shadow-black/30">
            <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Project Info</h2>
            <div className="mt-5 flex flex-col gap-4">
              <Field label="Nama Klien" required>
                <input value={form.clientName} onChange={(e) => updateField('clientName', e.target.value)} className="input" placeholder="PT. Klien" />
              </Field>
              <Field label="Nama Project" required>
                <input value={form.projectName} onChange={(e) => updateField('projectName', e.target.value)} className="input" placeholder="Nama project finance" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tanggal Start">
                  <input type="date" value={form.dateStart ?? ''} onChange={(e) => updateField('dateStart', e.target.value || null)} className="input" />
                </Field>
                <Field label="Tanggal End">
                  <input type="date" value={form.dateEnd ?? ''} onChange={(e) => updateField('dateEnd', e.target.value || null)} className="input" />
                </Field>
              </div>
              <Field label="Total Biaya Project" required>
                <div className="flex overflow-hidden rounded-xl border border-gray-300 bg-white transition focus-within:border-indigo-400/60 focus-within:ring-1 focus-within:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5">
                  <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">Rp</span>
                  <input type="number" min="0" value={form.totalProject || ''} onChange={(e) => updateField('totalProject', Number(e.target.value) || 0)} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 outline-none dark:text-slate-100" placeholder="0" />
                </div>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => updateField('status', e.target.value as FinanceProjectStatus)} className="input">
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Catatan / Keterangan">
                <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} className="input min-h-[88px] resize-none" placeholder="Catatan tambahan project finance" />
              </Field>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Preview Project</p>
              <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-slate-200">{form.projectName || 'Nama project finance'}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{form.clientName || 'Nama klien'}</p>
              <div className="mt-4 grid gap-2 text-xs text-gray-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Total Biaya Project</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{formatCurrency(form.totalProject)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{STATUS_OPTIONS.find((option) => option.value === form.status)?.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Jumlah Termin</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{form.termins.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Periode</span>
                  <span className="font-semibold text-right text-gray-800 dark:text-slate-200">{form.dateStart || '-'} {form.dateEnd ? `→ ${form.dateEnd}` : ''}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-lg dark:border-white/[0.08] dark:bg-slate-900/70 dark:shadow-2xl dark:shadow-black/30">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Termin Pembayaran / Penagihan</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Tambahkan termin sesuai kebutuhan project finance dan atur persentasenya secara fleksibel.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={addTermin} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500">
                  + Tambah Termin
                </button>
                <button type="button" onClick={resetForm} className="rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200">
                  Reset Form
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {form.termins.map((termin, index) => {
                const terminAmount = (form.totalProject * (termin.percentage || 0)) / 100;
                return (
                  <div key={`${termin.id ?? 'new'}-${index}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.07] dark:bg-slate-950/50">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Termin {index + 1}</h3>
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-500">Atur persentase, tanggal penagihan, dan syarat pencairan.</p>
                      </div>
                      <button type="button" onClick={() => removeTermin(index)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20">
                        Hapus
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <Field label="Nama Termin" required>
                        <input value={termin.name} onChange={(e) => updateTermin(index, 'name', e.target.value)} className="input" placeholder={`Termin ${index + 1}`} />
                      </Field>
                      <Field label="Persentase (%)" required>
                        <input type="number" min="0" max="100" step="0.01" value={termin.percentage || ''} onChange={(e) => updateTermin(index, 'percentage', Number(e.target.value) || 0)} className="input" placeholder="0" />
                      </Field>
                      <Field label="Tanggal Penagihan">
                        <input type="date" value={termin.billingDate ?? ''} onChange={(e) => updateTermin(index, 'billingDate', e.target.value || null)} className="input" />
                      </Field>
                      <Field label="Nilai Termin">
                        <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-200">
                          {formatCurrency(terminAmount)}
                        </div>
                      </Field>
                    </div>

                    <Field label="Syarat / Keterangan Penagihan" className="mt-4">
                      <textarea value={termin.description} onChange={(e) => updateTermin(index, 'description', e.target.value)} rows={3} className="input min-h-[88px] resize-none" placeholder="Contoh: setelah approval invoice dan BAST" />
                    </Field>

                    <div className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2 dark:border-white/[0.07] dark:bg-white/[0.03]">
                      <Field label="Status Penagihan">
                        <select
                          value={termin.billingStatus}
                          onChange={(e) => {
                            const billingStatus = e.target.value as FinanceTerminInput['billingStatus'];
                            setForm((prev) => ({
                              ...prev,
                              termins: prev.termins.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      billingStatus,
                                      disbursementStatus: billingStatus === 'BILLABLE' ? item.disbursementStatus : 'NOT_DISBURSED',
                                    }
                                  : item
                              ),
                            }));
                          }}
                          className="input"
                        >
                          <option value="NOT_BILLABLE">Belum bisa ditagihkan</option>
                          <option value="BILLABLE">Sudah bisa ditagihkan</option>
                        </select>
                      </Field>

                      <Field label="Status Pencairan">
                        <select
                          value={termin.disbursementStatus}
                          onChange={(e) => updateTermin(index, 'disbursementStatus', e.target.value as FinanceTerminInput['disbursementStatus'])}
                          disabled={termin.billingStatus !== 'BILLABLE'}
                          className="input disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:border-white/[0.05] dark:disabled:bg-white/[0.02] dark:disabled:text-slate-600"
                        >
                          <option value="NOT_DISBURSED">Belum Cair</option>
                          <option value="DISBURSED">Sudah Cair</option>
                        </select>
                        {termin.billingStatus !== 'BILLABLE' && (
                          <p className="mt-1.5 text-[10px] text-gray-400 dark:text-slate-500">Aktif setelah status penagihan sudah bisa ditagihkan.</p>
                        )}
                      </Field>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <SummaryCard label="Total Persentase Termin" value={`${totalTerminPercentage.toFixed(2)}%`} tone={Math.abs(totalTerminPercentage - 100) <= 0.01 ? 'success' : 'warning'} />
              <SummaryCard label="Total Nilai Termin" value={formatCurrency(totalTerminAmount)} tone="info" />
              <SummaryCard label="Sisa Persentase" value={`${(100 - totalTerminPercentage).toFixed(2)}%`} tone={Math.abs(totalTerminPercentage - 100) <= 0.01 ? 'success' : 'warning'} />
            </div>

            <div className="mt-5 flex gap-2">
              <button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Menyimpan...' : editingId ? 'Update Project Finance' : 'Simpan Project Finance'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                Reset
              </button>
            </div>
          </section>
        </form>
      </section>

      {loadingEntries ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-500">
          Memuat data finance...
        </div>
      ) : (
        <FinanceProjectList projects={entries} deletingId={deletingId} onDelete={handleDelete} />
      )}

      {toast && (
        <div className={`fixed right-5 top-5 z-[100] rounded-2xl border px-5 py-3 text-sm font-semibold shadow-2xl ${toast.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300' : 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className ?? ''}>
      <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-slate-400">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' | 'info' }) {
  const toneClasses = {
    success: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    info: 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300',
  } as const;

  return (
    <div className={`rounded-2xl border px-4 py-4 ${toneClasses[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}
