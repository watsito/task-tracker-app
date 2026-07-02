'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import { AppUser, UserRole } from '@/features/tasks/types/user';
import { useAuthStore } from '@/features/tasks/store/authStore';

export default function UsersPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <UserManagement />
    </AuthGuard>
  );
}

function UserManagement() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;

    fetch('/api/users')
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json() as Promise<AppUser[]>;
      })
      .then(setUsers)
      .catch(() => setError('Gagal memuat daftar user.'))
      .finally(() => setIsLoading(false));
  }, [isAdmin]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Gagal membuat user.');
      }

      const createdUser = await response.json() as AppUser;
      setUsers((current) => [...current, createdUser]);
      setName('');
      setEmail('');
      setPassword('');
      setRole('member');
      setSuccess(`Akun ${createdUser.email} berhasil dibuat.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    setError('');
    setSuccess('');
    setDeletingUserId(userToDelete.id);

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Gagal menghapus user.');
      }

      setUsers((current) => current.filter((user) => user.id !== userToDelete.id));
      setSuccess(`Akun ${userToDelete.email} berhasil dihapus.`);
      setUserToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus user.');
    } finally {
      setDeletingUserId(null);
    }
  };

  if (!isAdmin) {
    return (
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-5 py-10">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-5 text-sm text-red-300">
          Halaman ini hanya bisa diakses oleh admin.
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-400">Admin Console</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-100">User Management</h1>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300">
          {users.length} registered user{users.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-3xl border border-white/[0.08] bg-slate-900/80 p-5 shadow-2xl shadow-black/30">
          <h2 className="text-sm font-semibold text-slate-100">Create Account</h2>
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5">
            <Field label="Nama">
              <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25" placeholder="Nama user" />
            </Field>
            <Field label="Email">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25" placeholder="user@company.com" />
            </Field>
            <Field label="Password">
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25" placeholder="Minimal 8 karakter" />
            </Field>
            <Field label="Role">
              <div className="grid grid-cols-2 gap-2">
                {(['member', 'admin'] as UserRole[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition ${role === item ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Field>

            {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
            {success && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{success}</div>}

            <button disabled={isSubmitting} className="mt-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Membuat akun...' : 'Buat Akun'}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/70 shadow-2xl shadow-black/30">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-100">Registered Accounts</h2>
          </div>

          {isLoading ? (
            <div className="flex h-52 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {users.map((user) => (
                <div key={user.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-600 text-xs font-bold text-white">
                    {user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'border-indigo-400/30 bg-indigo-500/15 text-indigo-300' : 'border-slate-500/30 bg-slate-500/10 text-slate-400'}`}>
                    {user.role}
                  </span>
                  <button
                    type="button"
                    disabled={user.id === currentUser?.id || deletingUserId === user.id}
                    onClick={() => setUserToDelete(user)}
                    title={user.id === currentUser?.id ? 'Tidak bisa menghapus akun sendiri' : 'Hapus akun'}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:border-red-400/40 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
              <TrashIcon />
            </div>
            <h2 className="mt-5 text-lg font-bold text-slate-100">Hapus akun?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Apakah anda yakin ingin menghapus akun <span className="font-semibold text-slate-200">{userToDelete.name}</span>? Aksi ini akan menghapus user dari database.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deletingUserId === userToDelete.id}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-slate-200 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletingUserId === userToDelete.id}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingUserId === userToDelete.id ? 'Menghapus...' : 'Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-400">
      {label}
      {children}
    </label>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
