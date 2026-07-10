'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import { useAuthStore } from '@/features/tasks/store/authStore';
import { DEPARTMENTS } from '@/features/tasks/types/user';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <AppHeader />
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [name, setName] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.createdAt) setCreatedAt(data.createdAt); })
      .catch(() => {});
  }, []);

  if (!currentUser) return null;

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isAdmin = currentUser.role === 'admin';

  const userDepts = currentUser.departments ?? [];
  const deptLabels = userDepts.map((d) => DEPARTMENTS.find((dep) => dep.value === d));
  const nameValue = name ?? currentUser.name;

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim().length < 2) {
      showToast('Nama harus minimal 2 karakter', 'error');
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch('/api/users/me/name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Gagal mengubah nama');
      }
      const result = await res.json() as { name: string };
      useAuthStore.setState((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, name: result.name } : null,
      }));
      setName(null);
      showToast('Nama berhasil diubah!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengubah nama', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast('Semua field password wajib diisi', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password baru minimal 8 karakter', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Gagal mengubah password');
      }
      showToast('Password berhasil diubah!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengubah password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-5 py-10 md:px-8">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>

        <h1 className="mb-8 text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Profil Saya</h1>

        {/* Profile Card */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/30">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{currentUser.name}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">{currentUser.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isAdmin
                    ? 'border-indigo-400/30 bg-indigo-500/15 text-indigo-400'
                    : 'border-slate-500/30 bg-slate-500/10 text-slate-400'
                }`}>
                  {isAdmin ? '👑 Admin' : '👤 Member'}
                </span>
                {deptLabels.map((d) => d && (
                  <span key={d.value} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    {d.icon} {d.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 dark:text-slate-500">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs text-gray-500 dark:text-slate-500">
              Bergabung sejak {createdAt ? new Date(createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
            </span>
          </div>
        </div>

        {/* Ubah Nama */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Ubah Nama</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Update nama yang ditampilkan di profil</p>
          <div className="mt-4 flex gap-3">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setName(e.target.value)}
              placeholder="Nama baru"
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-600"
            />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={savingName || nameValue.trim() === currentUser.name}
              className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingName ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>

        {/* Ubah Password */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Ubah Password</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Pastikan password baru minimal 8 karakter</p>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-slate-400">Password Saat Ini</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-600"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-slate-400">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-600"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-slate-400">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-600"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSavePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPassword ? 'Menyimpan...' : 'Ubah Password'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed right-5 top-5 z-[100] flex max-w-md items-start gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl shadow-black/40 backdrop-blur-md transition-all duration-300 ${
          toast.type === 'success'
            ? 'border-emerald-400/20 bg-emerald-500/15 text-emerald-300'
            : 'border-red-400/20 bg-red-500/15 text-red-300'
        }`}>
          <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed">{toast.message}</p>
          <button type="button" onClick={() => setToast(null)} className="ml-2 shrink-0 text-slate-400 hover:text-slate-200">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </>
  );
}
