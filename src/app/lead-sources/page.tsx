'use client';

import { Suspense, useMemo, useState } from 'react';
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
  const [period, setPeriod] = useState('15 - 19 Juni 2026');
  const [monthLabel, setMonthLabel] = useState('6️⃣ Juni');
  const [values, setValues] = useState<LeadFormState>(INITIAL_VALUES);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const totalLeads = useMemo(
    () => Object.values(values).reduce((total, value) => total + value, 0),
    [values]
  );

  const updateValue = (key: ChannelKey, value: string) => {
    setValues((current) => ({
      ...current,
      [key]: Math.max(0, Number(value) || 0),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/lead-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: 'Marketing',
          formType: 'MBNE & ACE Lead Form',
          title,
          monthLabel,
          period,
          channels: values,
          totalLeads,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Gagal menyimpan data');
      }
      setToast({ message: 'Data berhasil disimpan!', type: 'success' });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Gagal menyimpan data.', type: 'error' });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-slate-950 shadow-2xl shadow-black/40">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-indigo-300">Lead Source Input</p>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">MBNE & ACE Lead Form</h1>
              <p className="mt-2 text-sm text-slate-400">Input data sumber leads mingguan dengan total otomatis.</p>
            </div>
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-6 py-4 text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Total Leads</p>
              <p className="mt-1 text-4xl font-black tabular-nums text-white">{totalLeads}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-3xl border border-white/[0.08] bg-slate-900/80 p-5 shadow-2xl shadow-black/30">
          <h2 className="text-sm font-bold text-slate-100">Periode Report</h2>
          <div className="mt-5 flex flex-col gap-4">
            <Field label="Judul Data">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25" />
            </Field>
            <Field label="Bulan">
              <input value={monthLabel} onChange={(e) => setMonthLabel(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25" />
            </Field>
            <Field label="Tanggal Periode">
              <input value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25" />
            </Field>
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preview Header</p>
            <p className="mt-3 text-sm font-semibold text-slate-200">{title}</p>
            <p className="mt-1 text-xs text-slate-400">{monthLabel} | {period}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.08] bg-slate-900/70 p-5 shadow-2xl shadow-black/30">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Marketing Form</h2>
              <p className="mt-1 text-xs text-slate-500">Isi angka per sumber leads. Kosong berarti 0.</p>
            </div>
            <button
              type="button"
              onClick={() => setValues(INITIAL_VALUES)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
            >
              Reset Sample
            </button>
          </div>

          <div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {CHANNELS.map((channel) => (
                <label key={channel.key} className="group rounded-2xl border border-white/[0.07] bg-slate-950/50 p-4 transition hover:border-indigo-400/30 hover:bg-indigo-500/5">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <span>{channel.icon}</span>
                    {channel.label}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={values[channel.key]}
                    onChange={(event) => updateValue(channel.key, event.target.value)}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-lg font-bold tabular-nums text-slate-100 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25"
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </section>
      </div>
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
