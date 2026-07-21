'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import type { FinanceProjectRecord, FinanceTerminStatus } from '@/features/finance/types/finance';

const TERMIN_STATUS_META: Record<FinanceTerminStatus, { label: string; classes: string }> = {
  TO_INVOICE: { label: 'To Invoice', classes: 'border-slate-300 bg-white text-slate-600 dark:border-white/[0.08] dark:bg-slate-900/60 dark:text-slate-300' },
  OPEN_INVOICE: { label: 'Open Invoice', classes: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300' },
  OUTSTANDING: { label: 'Outstanding', classes: 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300' },
  PAID: { label: 'Paid', classes: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300' },
};

const TERMIN_STATUS_ORDER: FinanceTerminStatus[] = ['OUTSTANDING', 'TO_INVOICE', 'OPEN_INVOICE', 'PAID'];

function getTerminStatusCounts(project: FinanceProjectRecord) {
  return TERMIN_STATUS_ORDER.map((status) => ({
    status,
    count: project.termins.filter((termin) => termin.termStatus === status).length,
  })).filter((item) => item.count > 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function FinanceProjectDetailPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <FinanceProjectDetailContent />
    </AuthGuard>
  );
}

function FinanceProjectDetailContent() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<FinanceProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    let active = true;

    fetch(`/api/finance-projects/${params.id}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active) setProject(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params?.id]);

  if (loading) {
    return (
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-10 md:px-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500 dark:border-white/10" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-5 py-10 md:px-8">
        <BackLink />
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <p className="text-sm text-gray-400 dark:text-slate-500">Detail project finance tidak ditemukan.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-5 py-10 md:px-8">
      <BackLink />

      <section className="mb-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600" />
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-400">Finance Project Detail View</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{project.projectName}</h1>
              <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-slate-300">{project.clientName}</p>
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">
                {formatDate(project.dateStart)} - {formatDate(project.dateEnd)} · {formatCurrency(project.totalProject)} · {project.termins.length} termin
              </p>
            </div>
            <div className="flex max-w-md flex-wrap justify-end gap-1.5">
              {getTerminStatusCounts(project).map(({ status, count }) => (
                <span key={status} className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${TERMIN_STATUS_META[status].classes}`}>
                  {count} {TERMIN_STATUS_META[status].label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Project Info</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Informasi utama dan nilai kontrak project finance.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Nama Klien" value={project.clientName} />
          <DetailItem label="Nama Project" value={project.projectName} />
          <DetailItem label="Total Biaya Project" value={formatCurrency(project.totalProject)} />
          <DetailItem label="Tanggal Start" value={formatDate(project.dateStart)} />
          <DetailItem label="Tanggal End" value={formatDate(project.dateEnd)} />
          <DetailItem label="Catatan" value={project.notes || '-'} />
          <DetailItem label="Diinput Oleh" value={project.createdBy?.name ?? '-'} />
          <DetailItem label="Terakhir Diperbarui" value={new Date(project.updatedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Daftar Termin</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Detail penagihan dan pencairan seluruh termin project.</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{project.termins.length} Termin</span>
        </div>

        <div className="space-y-4">
          {project.termins.map((termin, index) => {
            const terminValue = (project.totalProject * termin.percentage) / 100;
            const terminStatus = TERMIN_STATUS_META[termin.termStatus];

            return (
              <article key={termin.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">Termin {index + 1}</p>
                    <h3 className="mt-1 text-base font-bold text-gray-900 dark:text-slate-100">{termin.name}</h3>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${terminStatus.classes}`}>
                    {terminStatus.label}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem label="Persentase" value={`${termin.percentage}%`} />
                  <DetailItem label="Nilai Termin" value={formatCurrency(terminValue)} />
                  <DetailItem label="Billing Date" value={formatDate(termin.billingDate)} />
                  <DetailItem label="Payment Deadline" value={formatDate(termin.paymentDeadline)} />
                </div>

                <div className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-slate-900/50">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Syarat / Keterangan Penagihan</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-slate-300">{termin.description || '-'}</p>
                </div>
              </article>
            );
          })}

          {project.termins.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400 dark:border-white/10 dark:text-slate-500">Belum ada termin.</div>
          )}
        </div>
      </section>
    </main>
  );
}

function BackLink() {
  return (
    <Link href="/finance/form" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 transition hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200">
      <ArrowLeftIcon />
      Back to Finance Form
    </Link>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-slate-900/50">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}
