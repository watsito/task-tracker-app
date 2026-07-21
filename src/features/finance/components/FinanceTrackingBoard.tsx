'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import type { FinanceProjectRecord, FinanceTermin, FinanceTerminStatus, FinanceTerminAuditRecord } from '../types/finance';

type TermStatusColumn = {
  status: FinanceTerminStatus;
  label: string;
  description: string;
  headerBg: string;
  headerText: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  glowColor: string;
};

const TERM_COLUMNS: TermStatusColumn[] = [
  {
    status: 'OUTSTANDING',
    label: 'Outstanding',
    description: 'Invoice bermasalah',
    headerBg: 'bg-gradient-to-r from-rose-600 to-red-700',
    headerText: 'text-white',
    badgeBg: 'bg-white/20',
    badgeText: 'text-white',
    borderColor: 'border-rose-400/40',
    glowColor: 'shadow-rose-500/10',
  },
  {
    status: 'TO_INVOICE',
    label: 'To Invoice',
    description: 'Belum ditagihkan',
    headerBg: 'bg-gradient-to-r from-slate-500 to-slate-600',
    headerText: 'text-white',
    badgeBg: 'bg-white/20',
    badgeText: 'text-white',
    borderColor: 'border-slate-400/40',
    glowColor: 'shadow-slate-500/10',
  },
  {
    status: 'OPEN_INVOICE',
    label: 'Open Invoice',
    description: 'Menunggu pembayaran',
    headerBg: 'bg-gradient-to-r from-blue-600 to-indigo-700',
    headerText: 'text-white',
    badgeBg: 'bg-white/20',
    badgeText: 'text-white',
    borderColor: 'border-blue-400/40',
    glowColor: 'shadow-blue-500/10',
  },
  {
    status: 'PAID',
    label: 'Paid',
    description: 'Sudah dibayar',
    headerBg: 'bg-gradient-to-r from-emerald-600 to-teal-700',
    headerText: 'text-white',
    badgeBg: 'bg-white/20',
    badgeText: 'text-white',
    borderColor: 'border-emerald-400/40',
    glowColor: 'shadow-emerald-500/10',
  },
];

const TERMIN_STATUS_COLUMN_MAP: Record<FinanceTerminStatus, string> = {
  OUTSTANDING: 'OUTSTANDING',
  TO_INVOICE: 'TO_INVOICE',
  OPEN_INVOICE: 'OPEN_INVOICE',
  PAID: 'PAID',
};

const STATUS_LABELS: Record<FinanceTerminStatus, string> = {
  TO_INVOICE: 'To Invoice',
  OPEN_INVOICE: 'Open Invoice',
  OUTSTANDING: 'Outstanding',
  PAID: 'Paid',
};

const VALID_TRANSITIONS: Record<FinanceTerminStatus, FinanceTerminStatus[]> = {
  TO_INVOICE: ['OPEN_INVOICE', 'OUTSTANDING', 'PAID'],
  OPEN_INVOICE: ['TO_INVOICE', 'OUTSTANDING', 'PAID'],
  OUTSTANDING: ['TO_INVOICE', 'OPEN_INVOICE', 'PAID'],
  PAID: ['TO_INVOICE', 'OPEN_INVOICE', 'OUTSTANDING'],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateShort(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  return (
    d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return startOfDay(new Date(deadline)) < startOfDay(new Date());
}

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = startOfDay(new Date(deadline)).getTime() - startOfDay(new Date()).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function matchesDeadlineFilter(deadline: string | null, filter: FinanceTrackingFilters['deadline']) {
  if (filter === 'ALL') return true;
  if (!deadline) return false;

  const today = startOfDay(new Date());
  const date = startOfDay(new Date(deadline));

  if (filter === 'OVERDUE') return date < today;
  if (filter === 'TODAY') return date.getTime() === today.getTime();
  if (filter === 'NEXT_7_DAYS') {
    const end = new Date(today);
    end.setDate(end.getDate() + 7);
    return date >= today && date <= end;
  }

  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

function matchesAmountFilter(amount: number, filter: FinanceTrackingFilters['amount']) {
  if (filter === 'ALL') return true;
  if (filter === 'UNDER_50M') return amount < 50_000_000;
  if (filter === '50M_TO_100M') return amount >= 50_000_000 && amount <= 100_000_000;
  if (filter === '100M_TO_250M') return amount > 100_000_000 && amount <= 250_000_000;
  return amount > 250_000_000;
}

interface FlatTerm {
  projectId: string;
  projectName: string;
  clientName: string;
  totalProject: number;
  dateStart: string | null;
  dateEnd: string | null;
  term: FinanceTermin;
}

export interface FinanceTrackingFilters {
  search: string;
  overdueOnly: boolean;
  deadline: 'ALL' | 'TODAY' | 'NEXT_7_DAYS' | 'THIS_MONTH' | 'OVERDUE';
  projectId: string;
  amount: 'ALL' | 'UNDER_50M' | '50M_TO_100M' | '100M_TO_250M' | 'OVER_250M';
}

interface TrackingBoardProps {
  projects: FinanceProjectRecord[];
  filters: FinanceTrackingFilters;
  onStatusChange: (projectId: string, updatedProject: FinanceProjectRecord) => void;
}

function useAuditHistory(terminId: string | null) {
  const [state, setState] = useState<{ audits: FinanceTerminAuditRecord[]; loaded: boolean }>({
    audits: [],
    loaded: false,
  });

  useEffect(() => {
    if (!terminId) return;

    let active = true;

    fetch(`/api/finance-termin-audits?terminId=${terminId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) {
          setState({ audits: data, loaded: true });
        }
      })
      .catch(() => {
        if (active) setState((prev) => ({ ...prev, loaded: true }));
      });

    return () => {
      active = false;
    };
  }, [terminId]);

  return { audits: state.audits, loading: terminId !== null && !state.loaded };
}

function AuditHistoryPanel({ audits, loading }: { audits: FinanceTerminAuditRecord[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-[11px] text-gray-400 dark:border-white/[0.08] dark:text-slate-500">
        Belum ada riwayat
      </div>
    );
  }

  return (
    <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto overscroll-contain pr-1">
      {audits.map((audit) => (
        <div key={audit.id} className="flex items-start gap-2 rounded-lg bg-white/[0.5] px-2.5 py-2 dark:bg-white/[0.03]">
          <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-gray-600 dark:text-slate-300">
              <span className="font-semibold">{audit.createdByName}</span>{' '}
              {audit.action === 'STATUS_CHANGED' && audit.fromStatus && audit.toStatus ? (
                <>memindahkan dari <span className="font-medium text-gray-800 dark:text-slate-200">{STATUS_LABELS[audit.fromStatus]}</span> ke <span className="font-medium text-gray-800 dark:text-slate-200">{STATUS_LABELS[audit.toStatus]}</span></>
              ) : audit.action === 'PAYMENT_DEADLINE_EDITED' ? (
                <>mengubah Payment Deadline</>
              ) : (
                <>mengubah Billing Date</>
              )}
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400 dark:text-slate-500">{formatDateTime(audit.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DraggableTermCard({ flatTerm, onEditDates }: { flatTerm: FlatTerm; onEditDates: (flatTerm: FlatTerm) => void }) {
  const { term, projectName, clientName, totalProject } = flatTerm;
  const termAmount = (totalProject * term.percentage) / 100;
  const overdue = isOverdue(term.paymentDeadline);
  const days = daysUntil(term.paymentDeadline);
  const canDrag = VALID_TRANSITIONS[term.termStatus].length > 0;
  const [showHistory, setShowHistory] = useState(false);
  const { audits, loading: auditLoading } = useAuditHistory(showHistory ? term.id : null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `term-${term.id}`,
    data: { flatTerm },
    disabled: !canDrag,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.7 : 1,
      }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative flex flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md dark:border-white/[0.07] dark:bg-slate-800/70 dark:hover:border-white/[0.14] ${canDrag ? 'cursor-grab' : 'cursor-default'} ${isDragging ? 'cursor-grabbing !border-indigo-400 shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-gray-900 dark:text-slate-100">{projectName}</h3>
          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-slate-400">{clientName}</p>
        </div>
        <Link
          href={`/finance/project/${flatTerm.projectId}`}
          className="shrink-0 rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-500 transition hover:bg-gray-100 dark:border-white/[0.08] dark:text-slate-400 dark:hover:bg-white/[0.04]"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Detail
        </Link>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{term.name}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-white/[0.05] dark:text-slate-400">
            {term.percentage}%
          </span>
        </div>
        <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{formatCurrency(termAmount)}</span>
      </div>

      <div className="flex flex-col gap-1 rounded-lg bg-gray-50 px-2.5 py-2 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-400 dark:text-slate-500">Billing</span>
          <span className="font-medium text-gray-600 dark:text-slate-300">{formatDateShort(term.billingDate)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-400 dark:text-slate-500">Deadline</span>
          <span className="font-medium text-gray-600 dark:text-slate-300">{formatDateShort(term.paymentDeadline)}</span>
        </div>
      </div>

      {overdue && term.termStatus !== 'PAID' && (
        <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 dark:border-red-500/20 dark:bg-red-500/10">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 dark:bg-red-400" />
          <span className="text-[11px] font-semibold text-red-600 dark:text-red-300">
            Terlambat {days !== null ? `${Math.abs(days)} hari` : ''}
          </span>
        </div>
      )}

      {!overdue && days !== null && days <= 7 && days >= 0 && term.termStatus !== 'PAID' && (
        <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 dark:border-amber-500/20 dark:bg-amber-500/10">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-300">
            {days === 0 ? 'Jatuh tempo hari ini' : `${days} hari lagi`}
          </span>
        </div>
      )}

      {term.termStatus === 'PAID' && (
        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-500 dark:text-emerald-400">
            <path d="M3 8.5l3 3 7-7" />
          </svg>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">Lunas</span>
        </div>
      )}

      <div className="mt-1 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditDates(flatTerm);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-[11px] font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400 dark:hover:bg-white/[0.06]"
        >
          Edit Tanggal
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowHistory(!showHistory);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
            showHistory
              ? 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300'
              : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400 dark:hover:bg-white/[0.06]'
          }`}
        >
          Riwayat
        </button>
      </div>

      {showHistory && (
        <div onPointerDown={(e) => e.stopPropagation()}>
          <AuditHistoryPanel audits={audits} loading={auditLoading} />
        </div>
      )}
    </article>
  );
}

function TermCardOverlay({ flatTerm }: { flatTerm: FlatTerm }) {
  const termAmount = (flatTerm.totalProject * flatTerm.term.percentage) / 100;

  return (
    <article className="w-[300px] rounded-xl border border-indigo-400 bg-white p-3.5 shadow-2xl opacity-95 dark:bg-slate-800">
      <div className="flex flex-col gap-2">
        <h3 className="truncate text-sm font-bold text-gray-900 dark:text-slate-100">{flatTerm.projectName}</h3>
        <span className="text-xs text-gray-500 dark:text-slate-400">{flatTerm.term.name}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{formatCurrency(termAmount)}</span>
      </div>
    </article>
  );
}

function DroppableColumn({
  column,
  terms,
  isOver,
  onEditDates,
}: {
  column: TermStatusColumn;
  terms: FlatTerm[];
  isOver: boolean;
  onEditDates: (flatTerm: FlatTerm) => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.status });

  return (
    <section
      ref={setNodeRef}
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border transition-all duration-200 ${isOver ? '!border-indigo-400 bg-indigo-50/50 dark:!border-indigo-400 dark:bg-indigo-500/10 ring-2 ring-indigo-400/30' : `${column.borderColor} bg-white/50 dark:bg-slate-900/40`} shadow-lg ${column.glowColor}`}
    >
      <div className={`flex shrink-0 items-center justify-between rounded-t-2xl ${column.headerBg} px-4 py-3`}>
        <div>
          <span className={`text-sm font-bold ${column.headerText} drop-shadow-sm`}>{column.label}</span>
          <p className={`mt-0.5 text-[10px] ${column.headerText} opacity-70`}>{column.description}</p>
        </div>
        <span className={`flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-bold ${column.badgeBg} ${column.badgeText}`}>
          {terms.length}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain p-3">
        {terms.length === 0 ? (
          <div className="mt-auto mb-auto flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-8 text-center dark:border-white/[0.08]">
            <span className="text-2xl opacity-30">📋</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">Tidak ada termin</span>
          </div>
        ) : (
          terms.map((flatTerm) => <DraggableTermCard key={`${flatTerm.projectId}-${flatTerm.term.id}`} flatTerm={flatTerm} onEditDates={onEditDates} />)
        )}
      </div>

    </section>
  );
}

function DateEditorModal({
  flatTerm,
  mode,
  onClose,
  onSave,
}: {
  flatTerm: FlatTerm;
  mode: 'transition' | 'edit';
  onClose: () => void;
  onSave: (billingDate: string, paymentDeadline: string) => Promise<void>;
}) {
  const [billingDate, setBillingDate] = useState(flatTerm.term.billingDate?.slice(0, 10) ?? '');
  const [paymentDeadline, setPaymentDeadline] = useState(flatTerm.term.paymentDeadline?.slice(0, 10) ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!billingDate || !paymentDeadline) {
      setError('Billing Date dan Payment Deadline wajib diisi.');
      return;
    }
    if (paymentDeadline < billingDate) {
      setError('Payment Deadline tidak boleh lebih awal dari Billing Date.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(billingDate, paymentDeadline);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan tanggal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">{mode === 'transition' ? 'Buka Invoice' : 'Edit Tanggal Invoice'}</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{flatTerm.projectName} · {flatTerm.term.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">×</button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-gray-500 dark:text-slate-400">
            Billing Date
            <input type="date" value={billingDate} onChange={(e) => setBillingDate(e.target.value)} className="input mt-1.5" />
          </label>
          <label className="text-xs font-medium text-gray-500 dark:text-slate-400">
            Payment Deadline
            <input type="date" value={paymentDeadline} min={billingDate || undefined} onChange={(e) => setPaymentDeadline(e.target.value)} className="input mt-1.5" />
          </label>
        </div>

        {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">Batal</button>
          <button type="button" onClick={() => void handleSave()} disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-60">{saving ? 'Menyimpan...' : mode === 'transition' ? 'Simpan & Pindahkan' : 'Simpan Tanggal'}</button>
        </div>
      </div>
    </div>
  );
}

export default function FinanceTrackingBoard({ projects, filters, onStatusChange }: TrackingBoardProps) {
  const [activeFlatTerm, setActiveFlatTerm] = useState<FlatTerm | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [dateEditor, setDateEditor] = useState<{ flatTerm: FlatTerm; mode: 'transition' | 'edit' } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const allFlatTerms = useMemo<FlatTerm[]>(() => {
    return projects.flatMap((project) =>
      project.termins.map((term) => ({
        projectId: project.id,
        projectName: project.projectName,
        clientName: project.clientName,
        totalProject: project.totalProject,
        dateStart: project.dateStart,
        dateEnd: project.dateEnd,
        term,
      }))
    );
  }, [projects]);

  const filteredFlatTerms = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLocaleLowerCase('id');

    return allFlatTerms.filter((flatTerm) => {
      const amount = (flatTerm.totalProject * flatTerm.term.percentage) / 100;
      const matchesSearch = !normalizedSearch ||
        flatTerm.projectName.toLocaleLowerCase('id').includes(normalizedSearch) ||
        flatTerm.clientName.toLocaleLowerCase('id').includes(normalizedSearch);
      const matchesProject = !filters.projectId || flatTerm.projectId === filters.projectId;
      const matchesOverdue = !filters.overdueOnly ||
        (flatTerm.term.termStatus !== 'PAID' && isOverdue(flatTerm.term.paymentDeadline));

      return matchesSearch &&
        matchesProject &&
        matchesOverdue &&
        matchesDeadlineFilter(flatTerm.term.paymentDeadline, filters.deadline) &&
        matchesAmountFilter(amount, filters.amount);
    });
  }, [allFlatTerms, filters]);

  const termsByStatus = useMemo(() => {
    const grouped: Record<FinanceTerminStatus, FlatTerm[]> = {
      OUTSTANDING: [],
      TO_INVOICE: [],
      OPEN_INVOICE: [],
      PAID: [],
    };
    for (const ft of filteredFlatTerms) {
      const statusKey = TERMIN_STATUS_COLUMN_MAP[ft.term.termStatus] as FinanceTerminStatus;
      grouped[statusKey].push(ft);
    }
    return grouped;
  }, [filteredFlatTerms]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const flatTerm = event.active.data.current?.flatTerm as FlatTerm | undefined;
    if (flatTerm) {
      setActiveFlatTerm(flatTerm);
    }
  }, []);

  const handleDragOver = useCallback(
    (event: { over: { id: string | number } | null; active: { id: string | number; data: { current?: { flatTerm?: FlatTerm } } } }) => {
      if (!event.over) {
        setOverColumnId(null);
        return;
      }

      const activeTerm = event.active.data.current?.flatTerm;
      if (!activeTerm) {
        setOverColumnId(null);
        return;
      }

      const overId = String(event.over.id);
      const allowedTargets = VALID_TRANSITIONS[activeTerm.term.termStatus];
      const isColumn = TERM_COLUMNS.some((col) => col.status === overId);

      if (isColumn) {
        setOverColumnId(allowedTargets.includes(overId as FinanceTerminStatus) ? overId : null);
        return;
      }

      const overTerm = allFlatTerms.find((ft) => ft.term.id === overId.replace('term-', ''));
      setOverColumnId(
        overTerm && allowedTargets.includes(overTerm.term.termStatus) ? overTerm.term.termStatus : null
      );
    },
    [allFlatTerms]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveFlatTerm(null);
      setOverColumnId(null);

      if (!over) return;

      const flatTerm = active.data.current?.flatTerm as FlatTerm | undefined;
      if (!flatTerm) return;

      let targetStatus: FinanceTerminStatus | null = null;

      const overId = String(over.id);
      if (TERM_COLUMNS.some((col) => col.status === overId)) {
        targetStatus = overId as FinanceTerminStatus;
      } else {
        const overTerm = allFlatTerms.find((ft) => ft.term.id === overId.replace('term-', ''));
        if (overTerm) {
          targetStatus = overTerm.term.termStatus;
        }
      }

      if (!targetStatus) return;
      if (!VALID_TRANSITIONS[flatTerm.term.termStatus].includes(targetStatus)) return;

      const project = projects.find((p) => p.id === flatTerm.projectId);
      if (!project) return;

      const originalTermins = project.termins;

      const optimisticTermins = originalTermins.map((t) =>
        t.id === flatTerm.term.id
          ? {
              ...t,
              termStatus: targetStatus!,
            }
          : t
      );

      onStatusChange(flatTerm.projectId, { ...project, termins: optimisticTermins });

      try {
        const response = await fetch(`/api/finance-projects/${flatTerm.projectId}/termins/${flatTerm.term.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetStatus }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? 'Gagal memperbarui status termin');
        }

        const updatedProject = (await response.json()) as FinanceProjectRecord;
        onStatusChange(flatTerm.projectId, updatedProject);
      } catch {
        onStatusChange(flatTerm.projectId, { ...project, termins: originalTermins });
      }
    },
    [allFlatTerms, projects, onStatusChange]
  );

  const saveDateEditor = useCallback(async (billingDate: string, paymentDeadline: string) => {
    if (!dateEditor) return;

    const { flatTerm, mode } = dateEditor;
    const endpoint = mode === 'transition'
      ? `/api/finance-projects/${flatTerm.projectId}/termins/${flatTerm.term.id}/status`
      : `/api/finance-projects/${flatTerm.projectId}/termins/${flatTerm.term.id}/dates`;
    const response = await fetch(endpoint, {
      method: mode === 'transition' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode === 'transition'
        ? { targetStatus: 'OPEN_INVOICE', billingDate, paymentDeadline }
        : { billingDate, paymentDeadline }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Gagal menyimpan tanggal termin.');
    onStatusChange(flatTerm.projectId, data as FinanceProjectRecord);
  }, [dateEditor, onStatusChange]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v12M6 6l-4 4 4 4" />
              <path d="M14 10l-4 4" />
            </svg>
            <span>Geser termin antar kolom</span>
          </div>
          <span className="text-gray-300 dark:text-slate-600">|</span>
          <span>Drag bebas ke staging mana pun</span>
          <span className="text-gray-300 dark:text-slate-600">|</span>
          <span className="font-semibold text-gray-600 dark:text-slate-300">{filteredFlatTerms.length} dari {allFlatTerms.length} termin</span>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="grid h-full min-h-0 grid-cols-1 gap-4 pb-4 md:grid-cols-2 xl:grid-cols-4">
            {TERM_COLUMNS.map((column) => (
              <DroppableColumn
                key={column.status}
                column={column}
                terms={termsByStatus[column.status]}
                isOver={overColumnId === column.status}
                onEditDates={(flatTerm) => setDateEditor({ flatTerm, mode: 'edit' })}
              />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeFlatTerm ? <TermCardOverlay flatTerm={activeFlatTerm} /> : null}
      </DragOverlay>

      {dateEditor && (
        <DateEditorModal
          flatTerm={dateEditor.flatTerm}
          mode={dateEditor.mode}
          onClose={() => setDateEditor(null)}
          onSave={saveDateEditor}
        />
      )}
    </DndContext>
  );
}
