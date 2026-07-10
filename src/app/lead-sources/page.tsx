'use client';

import Link from 'next/link';
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

interface LeadEntryItem {
  id: string;
  channel: string;
  name: string;
  phoneNumber: string;
  email: string;
  companyName: string;
  jobTitle: string;
  typeOfNeed: string;
  infoSource: string;
  createdAt: string;
}

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
  entries?: LeadEntryItem[];
}

interface DirectLeadInput {
  name: string;
  phoneNumber: string;
  email: string;
  companyName: string;
  jobTitle: string;
  typeOfNeed: string;
  infoSource: string;
}

function filterLeadEntries(list: LeadSourceEntry[], query: string): LeadSourceEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((entry) => {
    const dateStr = new Date(entry.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const topChannel = Object.entries(entry.channels)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .filter(([, v]) => v > 0)
      .map(([k]) => CHANNELS.find((c) => c.key === k)?.label ?? k)
      .join(', ')
      .toLowerCase();
    const by = (entry.updatedBy?.name ?? entry.createdBy?.name ?? '').toLowerCase();
    return (
      entry.title.toLowerCase().includes(q) ||
      entry.period.toLowerCase().includes(q) ||
      entry.monthLabel.toLowerCase().includes(q) ||
      topChannel.includes(q) ||
      by.includes(q) ||
      dateStr.toLowerCase().includes(q)
    );
  });
}

const ALL_ZERO_VALUES: LeadFormState = {
  email: 0,
  googleAds: 0,
  metaAds: 0,
  tender: 0,
  socialMedia: 0,
  linkedin: 0,
  referral: 0,
  inboundWa: 0,
  web: 0,
  ka: 0,
  mes: 0,
  community: 0,
  other: 0,
};

function createEmptyDirectInput(): DirectLeadInput {
  return {
    name: '',
    phoneNumber: '',
    email: '',
    companyName: '',
    jobTitle: '',
    typeOfNeed: '',
    infoSource: '',
  };
}

function createEmptyMultipleInputs(): Record<ChannelKey, DirectLeadInput> {
  return {
    email: createEmptyDirectInput(),
    googleAds: createEmptyDirectInput(),
    metaAds: createEmptyDirectInput(),
    tender: createEmptyDirectInput(),
    socialMedia: createEmptyDirectInput(),
    linkedin: createEmptyDirectInput(),
    referral: createEmptyDirectInput(),
    inboundWa: createEmptyDirectInput(),
    web: createEmptyDirectInput(),
    ka: createEmptyDirectInput(),
    mes: createEmptyDirectInput(),
    community: createEmptyDirectInput(),
    other: createEmptyDirectInput(),
  };
}

function createEmptySavedDrafts(): Record<ChannelKey, DirectLeadInput[]> {
  return {
    email: [],
    googleAds: [],
    metaAds: [],
    tender: [],
    socialMedia: [],
    linkedin: [],
    referral: [],
    inboundWa: [],
    web: [],
    ka: [],
    mes: [],
    community: [],
    other: [],
  };
}

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
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [values, setValues] = useState<LeadFormState>({ ...ALL_ZERO_VALUES });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [entries, setEntries] = useState<LeadSourceEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'single' | 'multiple'>('single');
  const [directInput, setDirectInput] = useState<DirectLeadInput>(createEmptyDirectInput());
  const [selectedChannel, setSelectedChannel] = useState<ChannelKey | null>(null);
  const [multipleInputs, setMultipleInputs] = useState<Record<ChannelKey, DirectLeadInput>>(createEmptyMultipleInputs());
  const [savedDrafts, setSavedDrafts] = useState<Record<ChannelKey, DirectLeadInput[]>>(createEmptySavedDrafts());
  const [editingDraft, setEditingDraft] = useState<{ channel: ChannelKey; index: number; payload: DirectLeadInput } | null>(null);
  const [savingChannel, setSavingChannel] = useState<ChannelKey | null>(null);
  const [savingMultiple, setSavingMultiple] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const ITEMS_PER_PAGE = 25;

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const MONTH_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '1️⃣1️⃣', '1️⃣2️⃣'];

  const formatDateID = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatPeriodRange = (start: string, end: string) => {
    const startLabel = formatDateID(start);
    const endLabel = formatDateID(end);
    return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
  };

  const formatPeriodDisplay = (periodText: string) => {
    const parts = periodText.split(' - ');
    if (parts.length === 2 && parts[0].trim() === parts[1].trim()) {
      return parts[0].trim();
    }
    return periodText;
  };

  const period = startDate && endDate ? formatPeriodRange(startDate, endDate) : '';

  const computedMonthLabel = startDate ? (() => {
    const d = new Date(startDate + 'T00:00:00');
    return `${MONTH_EMOJI[d.getMonth()]} ${MONTH_NAMES[d.getMonth()]}`;
  })() : '';

  const totalLeads = useMemo(
    () => Object.values(values).reduce((total, value) => total + value, 0),
    [values]
  );

  const filteredEntries = useMemo(
    () => filterLeadEntries(entries, searchQuery),
    [entries, searchQuery]
  );

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / ITEMS_PER_PAGE));
  const effectivePage = Math.max(1, Math.min(currentPage, totalPages));

  const paginatedEntries = useMemo(() => {
    const start = (effectivePage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEntries, effectivePage]);

  const pageStart = filteredEntries.length === 0 ? 0 : (effectivePage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(effectivePage * ITEMS_PER_PAGE, filteredEntries.length);
  const activeLeadSource = entries.find((entry) => entry.id === editingId) ?? null;

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
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

  const updateDirectInput = (field: keyof DirectLeadInput, value: string) => {
    setDirectInput((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateMultipleInput = (channel: ChannelKey, field: keyof DirectLeadInput, value: string) => {
    setMultipleInputs((current) => ({
      ...current,
      [channel]: {
        ...current[channel],
        [field]: value,
      },
    }));
  };

  const resetDirectInput = () => {
    setDirectInput(createEmptyDirectInput());
    setSelectedChannel(null);
  };

  const resetMultipleInput = (channel: ChannelKey) => {
    if (editingDraft && editingDraft.channel === channel) {
      setSavedDrafts((current) => ({
        ...current,
        [channel]: [
          ...current[channel].slice(0, editingDraft.index),
          editingDraft.payload,
          ...current[channel].slice(editingDraft.index),
        ],
      }));
      setEditingDraft(null);
    }

    setMultipleInputs((current) => ({
      ...current,
      [channel]: createEmptyDirectInput(),
    }));
  };

  const handleEditDraft = (channel: ChannelKey, index: number) => {
    const payload = savedDrafts[channel][index];
    if (!payload) return;

    setMultipleInputs((current) => ({
      ...current,
      [channel]: payload,
    }));
    setSavedDrafts((current) => ({
      ...current,
      [channel]: current[channel].filter((_, itemIndex) => itemIndex !== index),
    }));
    setEditingDraft({ channel, index, payload });
  };

  const removeSavedDraft = (channel: ChannelKey, index: number) => {
    setSavedDrafts((current) => ({
      ...current,
      [channel]: current[channel].filter((_, itemIndex) => itemIndex !== index),
    }));
    if (editingDraft && editingDraft.channel === channel && editingDraft.index === index) {
      setEditingDraft(null);
    }
  };

  const resetForm = () => {
    setValues({ ...ALL_ZERO_VALUES });
    setTitle('');
    setStartDate('');
    setEndDate('');
    setEditingId(null);
    setDirectInput(createEmptyDirectInput());
    setSelectedChannel(null);
    setMultipleInputs(createEmptyMultipleInputs());
    setSavedDrafts(createEmptySavedDrafts());
    setEditingDraft(null);
    setViewMode('single');
  };

  const handleDirectSave = async () => {
    if (!selectedChannel) {
      showToast('Pilih marketing channel terlebih dahulu.', 'error');
      return;
    }

    if (!title.trim() || !startDate || !endDate || !computedMonthLabel || !period) {
      showToast('Lengkapi dulu judul dan periode report sebelum simpan direct lead.', 'error');
      return;
    }

    if (!directInput.name || !directInput.phoneNumber || !directInput.email || !directInput.companyName || !directInput.jobTitle || !directInput.typeOfNeed) {
      showToast('Semua field direct lead wajib diisi.', 'error');
      return;
    }

    setSavingChannel(selectedChannel);
    try {
      const response = await fetch('/api/lead-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadSourceId: editingId,
          title,
          monthLabel: computedMonthLabel,
          period,
          channel: selectedChannel,
          ...directInput,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Gagal menyimpan direct lead');
      }

      const data = await response.json() as { leadSource: LeadSourceEntry };
      setEditingId(data.leadSource.id);
      setValues({ ...ALL_ZERO_VALUES, ...data.leadSource.channels });
      resetDirectInput();
      setEntries((prev) => {
        const filtered = prev.filter((entry) => entry.id !== data.leadSource.id);
        return [data.leadSource, ...filtered];
      });
      showToast(`Lead ${CHANNELS.find((item) => item.key === selectedChannel)?.label ?? selectedChannel} berhasil disimpan.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan direct lead.', 'error');
    } finally {
      setSavingChannel(null);
    }
  };

  const handleMultipleSave = (channel: ChannelKey) => {
    const payload = multipleInputs[channel];
    if (!payload.name || !payload.phoneNumber || !payload.email || !payload.companyName || !payload.jobTitle || !payload.typeOfNeed) {
      showToast('Field Name, Phone, Email, Company, Job Title, dan Type of Need wajib diisi sebelum save.', 'error');
      return;
    }

    setSavedDrafts((current) => {
      if (editingDraft && editingDraft.channel === channel) {
        return {
          ...current,
          [channel]: [
            ...current[channel].slice(0, editingDraft.index),
            payload,
            ...current[channel].slice(editingDraft.index),
          ],
        };
      }

      return {
        ...current,
        [channel]: [...current[channel], payload],
      };
    });

    setMultipleInputs((current) => ({
      ...current,
      [channel]: createEmptyDirectInput(),
    }));
    setEditingDraft((current) => (current?.channel === channel ? null : current));
    showToast(`${CHANNELS.find((item) => item.key === channel)?.label ?? channel} berhasil disimpan ke draft.`);
  };

  const handleMultipleSubmit = async () => {
    const channelsToSubmit = CHANNELS.filter((channel) => savedDrafts[channel.key].length > 0);
    if (channelsToSubmit.length === 0) {
      showToast('Belum ada channel yang disimpan ke draft.', 'error');
      return;
    }

    if (!title.trim() || !startDate || !endDate || !computedMonthLabel || !period) {
      showToast('Lengkapi dulu judul dan periode report sebelum simpan data.', 'error');
      return;
    }

    setSavingMultiple(true);
    try {
      let activeId = editingId;
      let latestLeadSource: LeadSourceEntry | null = null;

      for (const channel of channelsToSubmit) {
        for (const payload of savedDrafts[channel.key]) {
          const response = await fetch('/api/lead-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadSourceId: activeId,
              title,
              monthLabel: computedMonthLabel,
              period,
              channel: channel.key,
              ...payload,
            }),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => null) as { error?: string } | null;
            throw new Error(data?.error ?? `Gagal menyimpan ${channel.label}`);
          }

          const data = await response.json() as { leadSource: LeadSourceEntry };
          activeId = data.leadSource.id;
          latestLeadSource = data.leadSource;
        }
      }

      if (latestLeadSource) {
        setEditingId(latestLeadSource.id);
        setValues({ ...ALL_ZERO_VALUES, ...latestLeadSource.channels });
        setEntries((prev) => {
          const filtered = prev.filter((entry) => entry.id !== latestLeadSource?.id);
          return [latestLeadSource, ...filtered];
        });
      }

      setMultipleInputs(createEmptyMultipleInputs());
      setSavedDrafts(createEmptySavedDrafts());
      showToast('Semua draft multiple input berhasil disimpan.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan multiple input.', 'error');
    } finally {
      setSavingMultiple(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/lead-sources/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Gagal menghapus data');
      }
      setEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        const newTotalPages = Math.max(1, Math.ceil(filterLeadEntries(next, searchQuery).length / ITEMS_PER_PAGE));
        if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
        return next;
      });
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
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">{viewMode === 'single' ? 'Single Input View' : 'Multiple Input View'}</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                {viewMode === 'single'
                  ? 'Input satu lead lalu pilih satu marketing channel.'
                  : 'Isi beberapa channel sekaligus, save ke draft per channel, lalu simpan semuanya sekali.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  viewMode === 'single'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'border border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200'
                }`}
              >
                Single Input
              </button>
              <button
                type="button"
                onClick={() => setViewMode('multiple')}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  viewMode === 'multiple'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'border border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200'
                }`}
              >
                Multiple Input
              </button>
              <button
                type="button"
                onClick={() => { setValues({ ...ALL_ZERO_VALUES }); resetDirectInput(); setMultipleInputs(createEmptyMultipleInputs()); setSavedDrafts(createEmptySavedDrafts()); }}
                className="rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                Reset Form
              </button>
            </div>
          </div>

          {viewMode === 'single' ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.07] dark:bg-slate-950/50">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input value={directInput.name} onChange={(e) => updateDirectInput('name', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                </Field>
                <Field label="Phone Number">
                  <input value={directInput.phoneNumber} onChange={(e) => updateDirectInput('phoneNumber', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                </Field>
                <Field label="Email">
                  <input value={directInput.email} onChange={(e) => updateDirectInput('email', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                </Field>
                <Field label="Company Name">
                  <input value={directInput.companyName} onChange={(e) => updateDirectInput('companyName', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                </Field>
                <Field label="Job Title/Position">
                  <input value={directInput.jobTitle} onChange={(e) => updateDirectInput('jobTitle', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                </Field>
                <Field label="Type of Need">
                  <input value={directInput.typeOfNeed} onChange={(e) => updateDirectInput('typeOfNeed', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                </Field>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Select Marketing Channel</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {CHANNELS.map((channel) => {
                    const savedEntries = activeLeadSource?.entries?.filter((entry) => entry.channel === channel.key).length ?? 0;
                    const isSelected = selectedChannel === channel.key;
                    const visualLabel = channel.key === 'inboundWa' ? 'WhatsApp' : channel.label;
                    return (
                      <button
                        key={channel.key}
                        type="button"
                        onClick={() => setSelectedChannel(channel.key)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-500/20 dark:border-indigo-400/40 dark:bg-indigo-500/10'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 dark:border-white/[0.07] dark:bg-slate-950/70 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-500/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className={`flex items-center gap-2 text-sm font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-slate-100'}`}>
                              <span>{channel.icon}</span>
                              {visualLabel}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-500">Saved leads: {savedEntries}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${isSelected ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-slate-400'}`}>
                            {values[channel.key]} total
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button type="button" onClick={handleDirectSave} disabled={savingChannel !== null} className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
                  {savingChannel ? 'Submitting...' : 'Submit Data'}
                </button>
                <button type="button" onClick={resetDirectInput} className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                  Reset Form
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                {CHANNELS.map((channel) => {
                  const input = multipleInputs[channel.key];
                  const drafts = savedDrafts[channel.key];
                  return (
                    <div key={channel.key} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.07] dark:bg-slate-950/50">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-slate-100">
                            <span>{channel.icon}</span>
                            {channel.key === 'inboundWa' ? 'WhatsApp' : channel.label}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-500">{drafts.length > 0 ? `${drafts.length} draft tersimpan` : 'Belum ada draft'}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${drafts.length > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-slate-400'}`}>
                          {drafts.length > 0 ? `${drafts.length} Saved` : 'Draft'}
                        </span>
                      </div>

                      {drafts.length > 0 && (
                        <div className="mb-4 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                          {drafts.map((draft, index) => (
                            <div key={`${channel.key}-${index}`} className="flex items-start justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 text-xs dark:bg-slate-950/50">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-800 dark:text-slate-200">{draft.name} • {draft.companyName}</p>
                                <p className="mt-0.5 text-gray-500 dark:text-slate-400">{draft.phoneNumber} • {draft.email}</p>
                                <p className="mt-0.5 text-gray-400 dark:text-slate-500">{draft.jobTitle}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => handleEditDraft(channel.key, index)} className="rounded-md px-2 py-1 text-[10px] font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:text-indigo-300">
                                  Edit
                                </button>
                                <button type="button" onClick={() => removeSavedDraft(channel.key, index)} className="rounded-md px-2 py-1 text-[10px] font-semibold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10">
                                  Hapus
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Name">
                          <input value={input.name} onChange={(e) => updateMultipleInput(channel.key, 'name', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                        </Field>
                        <Field label="Phone Number">
                          <input value={input.phoneNumber} onChange={(e) => updateMultipleInput(channel.key, 'phoneNumber', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                        </Field>
                        <Field label="Email">
                          <input value={input.email} onChange={(e) => updateMultipleInput(channel.key, 'email', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                        </Field>
                        <Field label="Company Name">
                          <input value={input.companyName} onChange={(e) => updateMultipleInput(channel.key, 'companyName', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                        </Field>
                        <Field label="Job Title/Position">
                          <input value={input.jobTitle} onChange={(e) => updateMultipleInput(channel.key, 'jobTitle', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                        </Field>
                        <Field label="Type of Need">
                          <input value={input.typeOfNeed} onChange={(e) => updateMultipleInput(channel.key, 'typeOfNeed', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                        </Field>
                        {channel.key === 'other' && (
                          <Field label="Information Source">
                            <input value={input.infoSource} onChange={(e) => updateMultipleInput(channel.key, 'infoSource', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
                          </Field>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button type="button" onClick={() => handleMultipleSave(channel.key)} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500">
                          {editingDraft?.channel === channel.key ? 'Update' : 'Save'}
                        </button>
                        <button type="button" onClick={() => resetMultipleInput(channel.key)} className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                          {editingDraft?.channel === channel.key ? 'Batal' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex gap-2">
                <button type="button" onClick={handleMultipleSubmit} disabled={savingMultiple} className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
                  {savingMultiple ? 'Menyimpan...' : 'Simpan Data'}
                </button>
                <button type="button" onClick={() => { setMultipleInputs(createEmptyMultipleInputs()); setSavedDrafts(createEmptySavedDrafts()); }} className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                  Reset Draft
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span>📋</span>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Riwayat Data Tersimpan</h2>
          </div>
          <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.05]" />
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 dark:bg-white/5 dark:text-slate-400">{filteredEntries.length} entri</span>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Cari judul, periode, channel, atau nama user..."
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M18 6L6 18" /><path d="M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {filteredEntries.length > ITEMS_PER_PAGE && (
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Halaman {currentPage} / {totalPages}
            </p>
          )}
        </div>

        {loadingEntries ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500 dark:border-white/10" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <p className="text-sm text-gray-400 dark:text-slate-500">Belum ada data tersimpan</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <p className="text-sm text-gray-400 dark:text-slate-500">Tidak ada data yang cocok dengan pencarian <span className="font-semibold">{searchQuery}</span></p>
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
                  {paginatedEntries.map((entry) => {
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
                      <tr key={entry.id} className="transition hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-800 dark:text-slate-200">{dateStr}</p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500">{timeStr}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">{entry.title}</p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500">{entry.monthLabel}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">{formatPeriodDisplay(entry.period)}</td>
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
                            <Link
                              href={`/lead-sources/${entry.id}`}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                            >
                              Details
                            </Link>
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

            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02] sm:flex-row">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Menampilkan <span className="font-semibold text-gray-700 dark:text-slate-200">{pageStart}</span>–<span className="font-semibold text-gray-700 dark:text-slate-200">{pageEnd}</span> dari <span className="font-semibold text-gray-700 dark:text-slate-200">{filteredEntries.length}</span> data
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={effectivePage === 1}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Sebelumnya
                  </button>
                  <span className="px-1 text-xs font-semibold text-gray-600 dark:text-slate-400">
                    {effectivePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={effectivePage === totalPages}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    Berikutnya
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
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
