'use client';

import { OdooSyncStatus } from '../types/integration';

const STATUS_CONFIG: Record<
  OdooSyncStatus,
  { label: string; classes: string; dot: string; icon: string }
> = {
  idle: {
    label: 'Belum sync',
    classes: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
    dot: 'bg-slate-500',
    icon: '○',
  },
  pending: {
    label: 'Antri',
    classes: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    dot: 'bg-slate-400 animate-pulse',
    icon: '…',
  },
  syncing: {
    label: 'Sync...',
    classes: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    dot: 'bg-blue-400 animate-spin',
    icon: '↻',
  },
  synced: {
    label: 'Odoo ✓',
    classes: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/25',
    dot: 'bg-emerald-400',
    icon: '✓',
  },
  failed: {
    label: 'Gagal',
    classes: 'text-red-400 bg-red-400/10 border-red-500/25',
    dot: 'bg-red-400',
    icon: '✕',
  },
};

interface SyncStatusBadgeProps {
  status: OdooSyncStatus;
  /** Jika true, tampilkan label teks (default: hanya ikon) */
  showLabel?: boolean;
}

export default function SyncStatusBadge({ status, showLabel = false }: SyncStatusBadgeProps) {
  if (status === 'idle') return null;

  const cfg = STATUS_CONFIG[status];

  return (
    <span
      title={cfg.label}
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${cfg.classes}`}
    >
      <span
        className={`h-1 w-1 rounded-full ${cfg.dot}`}
        style={status === 'syncing' ? { animation: 'spin 1s linear infinite' } : {}}
      />
      {showLabel ? cfg.label : cfg.icon}
    </span>
  );
}
