'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';

const CHANNELS = [
  { key: 'email', label: 'Email', icon: '📧' },
  { key: 'googleAds', label: 'Google Ads', icon: '🔍' },
  { key: 'metaAds', label: 'Meta Ads', icon: '📣' },
  { key: 'tender', label: 'Tender', icon: '📥' },
  { key: 'socialMedia', label: 'Social Media', icon: '📱' },
  { key: 'linkedin', label: 'Linkedin', icon: '🎯' },
  { key: 'referral', label: 'Referral', icon: '👥' },
  { key: 'inboundWa', label: 'Inbound WA', icon: '☎️' },
  { key: 'web', label: 'Web', icon: '🌐' },
  { key: 'ka', label: 'KA', icon: '👩🏻‍💻' },
  { key: 'mes', label: 'MES', icon: '🕵🏼' },
  { key: 'community', label: 'Community MES/KA/Event', icon: '👤' },
  { key: 'other', label: 'Other', icon: '🔁' },
] as const;

type ChannelKey = (typeof CHANNELS)[number]['key'];
type LeadFormState = Record<ChannelKey, number>;

interface LeadSourceEntry {
  id: string;
  team: string;
  formType: string;
  title: string;
  monthLabel: string;
  period: string;
  channels: Record<string, number>;
  totalLeads: number;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
  updatedBy?: { id: string; name: string } | null;
}

const INITIAL_VALUES: LeadFormState = {
  email: 0,
  googleAds: 0,
  metaAds: 0,
  tender: 0,
  socialMedia: 0,
  linkedin: 0,
  referral: 1,
  inboundWa: 1,
  web: 0,
  ka: 0,
  mes: 1,
  community: 29,
  other: 0,
};

export default function LeadSourcesPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <Suspense>
        <LeadSourcesForm />
      </Suspense>
    </AuthGuard>
  );
}

function LeadSourcesForm() {
  const [title, setTitle] = useState('Data Need MBNE & ACE Proxsis Digital');
  const [startDate, setStartDate] = useState('2026-06-15');
  const [endDate, setEndDate] = useState('2026-06-19');
  const [values, setValues] = useState<LeadFormState>(INITIAL_VALUES);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [entries, setEntries] = useState<LeadSourceEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const MONTH_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '1️⃣1️⃣', '1️⃣2️⃣'];

  const formatDateID = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  };

  const period = startDate && endDate ? `${formatDateID(startDate)} - ${formatDateID(endDate)}` : '';

  const computedMonthLabel = startDate ? (() => {
    const d = new Date(startDate + 'T00:00:00');
    return `${MONTH_EMOJI[d.getMonth()]} ${MONTH_NAMES[d.getMonth()]}`;
  })() : '';

  const totalLeads = useMemo(
    () => Object.values(values).reduce((total, value) => total + value, 0),
    [values]
  );

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const res = await fetch('/api/lead-sources');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setEntries(data);
      }
    } catch {} 
    finally {
      setLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/lead-sources', { signal: controller.signal })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setEntries(data); })
      .catch(() => {})
      .finally(() => setLoadingEntries(false));
    return () => controller.abort();
  }, []);

  const updateValue = (key: ChannelKey, value: string) => {
    setValues((current) => ({
      ...current,
      [key]: Math.max(0, Number(value) || 0),
    }));
  };

  const resetForm = () => {
    setValues(INITIAL_VALUES);
    setTitle('Data Need MBNE & ACE Proxsis Digital');
    setStartDate('2026-06-15');
    setEndDate('2026-06-19');
    setEditingId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/lead-sources/${editingId}` : '/api/lead-sources';
      const method = editingId ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: 'Marketing',
          formType: 'MBNE & ACE Lead Form',
          title,
          monthLabel: computedMonthLabel,
          period,
          channels: values,
          totalLeads,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Gagal menyimpan data');
      }
      showToast(editingId ? 'Data berhasil diupdate!' : 'Data berhasil disimpan!');
      resetForm();
      fetchEntries();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan data.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: LeadSourceEntry) => {
    setTitle(entry.title);
    const parts = entry.period.split(' - ');
    if (parts.length === 2) {
      const parseDate = (s: string) => {
        const segments = s.trim().split(' ');
        const day = parseInt(segments[0]);
        const monthIdx = MONTH_NAMES.indexOf(segments[1]);
        const year = parseInt(segments[2]);
        if (monthIdx >= 0 && !isNaN(day) && !isNaN(year)) {
          return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        return '';
      };
      setStartDate(parseDate(parts[0]));
      setEndDate(parseDate(parts[1]));
    }
    setValues({ ...INITIAL_VALUES, ...entry.channels });
    setEditingId(entry.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/lead-sources/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Gagal menghapus data');
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (editingId === id) resetForm();
      showToast('Data berhasil dihapus.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus data.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
    <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-lg dark:border-white/[0.08] dark:bg-slate-950 dark:shadow-2xl dark:shadow-black/40">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/20" />
          <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl dark:bg-emerald-500/10" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-indigo-500 dark:text-indigo-300">Lead Source Input</p>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-900 md:text-3xl dark:text-white">MBNE & ACE Lead Form</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Input data sumber leads mingguan dengan total otomatis.</p>
            </div>
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-right dark:border-emerald-400/20 dark:bg-emerald-400/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Total Leads</p>
              <p className="mt-1 text-4xl font-black tabular-nums text-gray-900 dark:text-white">{totalLeads}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-lg dark:border-white/[0.08] dark:bg-slate-900/80 dark:shadow-2xl dark:shadow-black/30">
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Periode Report</h2>
          <div className="mt-5 flex flex-col gap-4">
            <Field label="Judul Data">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                />
              </Field>
              <Field label="End Date">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                />
              </Field>
            </div>
            <Field label="Tanggal Periode">
              <input
                readOnly
                value={period}
                className="w-full cursor-default rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400"
              />
            </Field>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Preview Header</p>
            <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-slate-200">{title}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{computedMonthLabel} | {period}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-lg dark:border-white/[0.08] dark:bg-slate-900/70 dark:shadow-2xl dark:shadow-black/30">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Marketing Form</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Isi angka per sumber leads. Kosong berarti 0.</p>
            </div>
            <button
              type="button"
              onClick={() => setValues(INITIAL_VALUES)}
              className="rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
            >
              Reset Sample
            </button>
          </div>

          <div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {CHANNELS.map((channel) => (
                <label key={channel.key} className="group rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-white/[0.07] dark:bg-slate-950/50 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-500/5">
                  <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-slate-300">
                    <span>{channel.icon}</span>
                    {channel.label}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={values[channel.key]}
                    onChange={(event) => updateValue(channel.key, event.target.value)}
                    className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-lg font-bold tabular-nums text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                  />
                </label>
              ))}
            </div>
            {editingId ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-5 flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Mengupdate...' : 'Update Data'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-5 rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            )}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <span>📋</span>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Riwayat Data Tersimpan</h2>
          <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.05]" />
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 dark:bg-white/5 dark:text-slate-400">{entries.length} entri</span>
        </div>

        {loadingEntries ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500 dark:border-white/10" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <p className="text-sm text-gray-400 dark:text-slate-500">Belum ada data tersimpan</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Tanggal</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Judul</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Periode</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Top Channel</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Oleh</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                  {entries.map((entry) => {
                    const date = new Date(entry.createdAt);
                    const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    const topChannel = Object.entries(entry.channels)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 2)
                      .filter(([, v]) => v > 0)
                      .map(([k]) => CHANNELS.find((c) => c.key === k)?.label ?? k)
                      .join(', ');

                    return (
                      <tr key={entry.id} className={`transition ${editingId === entry.id ? 'bg-indigo-50/50 dark:bg-indigo-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'}`}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-800 dark:text-slate-200">{dateStr}</p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500">{timeStr}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">{entry.title}</p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500">{entry.monthLabel}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">{entry.period}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold tabular-nums text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{entry.totalLeads}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-500">{topChannel || '-'}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-800 dark:text-slate-200">
                            {entry.updatedBy?.name ?? entry.createdBy?.name ?? '-'}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500">
                            {entry.updatedBy ? 'diedit' : 'dibuat'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(entry)}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(entry.id)}
                              disabled={deletingId === entry.id}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              {deletingId === entry.id ? '...' : 'Hapus'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>

      {toast && (
        <div className={`fixed right-5 top-5 z-[60] flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl shadow-black/40 backdrop-blur-md transition-all duration-300 ${
          toast.type === 'success'
            ? 'border-emerald-400/20 bg-emerald-500/15 text-emerald-300'
            : 'border-red-400/20 bg-red-500/15 text-red-300'
        }`}>
          <p className="text-sm font-semibold">{toast.message}</p>
          <button type="button" onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-200">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-400">
      {label}
      {children}
    </label>
  );
}
