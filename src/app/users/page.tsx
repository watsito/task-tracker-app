'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import {
  AppUser,
  UserRole,
  Department,
  DEPARTMENTS,
  TeamName,
  TeamPermission,
  PageKey,
  TEAMS,
  PAGES,
  TEAM_LABELS,
  PAGE_LABELS,
  PERMISSION_LABELS,
  PERMISSION_COLORS,
} from '@/features/tasks/types/user';
import { useAuthStore } from '@/features/tasks/store/authStore';

export default function UsersPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <UserManagement />
    </AuthGuard>
  );
}

export function UserManagement() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [departments, setDepartments] = useState<Department[]>(['OPERATIONAL']);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userToEditPerms, setUserToEditPerms] = useState<AppUser | null>(null);
  const [editingTeamPerms, setEditingTeamPerms] = useState<Record<string, TeamPermission>>({});
  const [editingPageAccess, setEditingPageAccess] = useState<Record<string, boolean>>({});
  const [savingPerms, setSavingPerms] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;

    fetch('/api/users')
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json() as Promise<AppUser[]>;
      })
      .then(setUsers)
      .catch(() => showToast('Gagal memuat daftar user.', 'error'))
      .finally(() => setIsLoading(false));
  }, [isAdmin]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, departments }),
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
      setDepartments(['OPERATIONAL']);
      showToast(`Akun ${createdUser.email} berhasil dibuat.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal membuat user.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    setDeletingUserId(userToDelete.id);

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Gagal menghapus user.');
      }

      setUsers((current) => current.filter((user) => user.id !== userToDelete.id));
      showToast(`Akun ${userToDelete.email} berhasil dihapus.`);
      setUserToDelete(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus user.', 'error');
    } finally {
      setDeletingUserId(null);
    }
  };

  const openPermissionsModal = useCallback((user: AppUser) => {
    const teamPerms: Record<string, TeamPermission> = {};
    TEAMS.forEach((team) => {
      teamPerms[team] = (user.permissions?.teams?.[team] as TeamPermission) ?? 'none';
    });
    const pageAccess: Record<string, boolean> = {};
    PAGES.forEach((page) => {
      // Default: all pages accessible except 'users' (admin-only page)
      pageAccess[page] = user.permissions?.pages?.[page] ?? (page !== 'users');
    });
    setEditingTeamPerms(teamPerms);
    setEditingPageAccess(pageAccess);
    setUserToEditPerms(user);
  }, []);

  const setTeamPermission = useCallback((team: TeamName, perm: TeamPermission) => {
    setEditingTeamPerms((prev) => ({ ...prev, [team]: perm }));
  }, []);

  const togglePageAccess = useCallback((page: PageKey) => {
    setEditingPageAccess((prev) => ({ ...prev, [page]: !prev[page] }));
  }, []);

  const handleSavePermissions = async () => {
    if (!userToEditPerms) return;
    setSavingPerms(true);

    try {
      const response = await fetch(`/api/users/${userToEditPerms.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: {
            teams: editingTeamPerms,
            pages: editingPageAccess,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Gagal menyimpan permission.');
      }

      const updated = await response.json() as AppUser;
      setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)));
      showToast(`Permission untuk ${updated.name} berhasil disimpan.`);
      setUserToEditPerms(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan permission.', 'error');
    } finally {
      setSavingPerms(false);
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
    <>
    <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-400">Admin Console</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">User Management</h1>
        </div>
        <div className="rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          {users.length} registered user{users.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-lg dark:border-white/[0.08] dark:bg-slate-900/80 dark:shadow-2xl dark:shadow-black/30">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Create Account</h2>
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5">
            <Field label="Nama">
              <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-600" placeholder="Nama user" />
            </Field>
            <Field label="Email">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-600" placeholder="user@company.com" />
            </Field>
            <Field label="Password">
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-600" placeholder="Minimal 8 karakter" />
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
            <Field label="Department">
              <div className="flex flex-col gap-2">
                {DEPARTMENTS.map((dept) => {
                  const isSelected = departments.includes(dept.value);
                  return (
                    <button
                      key={dept.value}
                      type="button"
                      onClick={() => {
                        setDepartments((prev) =>
                          isSelected
                            ? prev.filter((d) => d !== dept.value)
                            : [...prev, dept.value]
                        );
                      }}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-lg">{dept.icon}</span>
                      <div>
                        <p className="text-xs font-semibold">{dept.label}</p>
                        <p className="text-[10px] opacity-60">{dept.desc}</p>
                      </div>
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-indigo-400">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </Field>

            <button disabled={isSubmitting} className="mt-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Membuat akun...' : 'Buat Akun'}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg dark:border-white/[0.08] dark:bg-slate-900/70 dark:shadow-2xl dark:shadow-black/30">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-white/[0.06]">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Registered Accounts</h2>
          </div>

          {isLoading ? (
            <div className="flex h-52 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500 dark:border-white/10" />
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-white/[0.06]">
              {users.map((user) => (
                <div key={user.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-600 text-xs font-bold text-white">
                    {user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">{user.name}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-slate-500">{user.email}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'border-indigo-400/30 bg-indigo-500/15 text-indigo-300' : 'border-slate-500/30 bg-slate-500/10 text-slate-400'}`}>
                    {user.role}
                  </span>
                  <div className="flex gap-1">
                    {user.departments.map((d) => {
                      const dept = DEPARTMENTS.find((x) => x.value === d);
                      return (
                        <span key={d} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          {dept?.icon} {dept?.label}
                        </span>
                      );
                    })}
                  </div>
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

      {/* ─── Permissions Modal ─── */}
      {userToEditPerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/60">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-slate-950/95 px-6 py-5 backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                    <ShieldIcon />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">Kelola Permission</h2>
                    <p className="mt-0.5 text-sm text-slate-400">
                      Atur hak akses untuk <span className="font-semibold text-slate-200">{userToEditPerms.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUserToEditPerms(null)}
                  disabled={savingPerms}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-slate-200 disabled:opacity-50"
                >
                  <XIcon />
                </button>
              </div>
            </div>

            <div className="px-6 py-5">
              {/* Team Permissions Section */}
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/15">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
                      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">Hak Akses Tim</h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">Pilih level akses untuk setiap tim yang dikelola user ini.</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {TEAMS.map((team) => {
                    const current = editingTeamPerms[team] ?? 'none';
                    return (
                      <div
                        key={team}
                        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:bg-white/[0.04]"
                      >
                        <p className="text-sm font-medium text-slate-200">{TEAM_LABELS[team]}</p>
                        <div className="mt-2.5 flex gap-1.5">
                          {(['none', 'view', 'edit', 'admin'] as TeamPermission[]).map((perm) => (
                            <button
                              key={perm}
                              type="button"
                              onClick={() => setTeamPermission(team, perm)}
                              className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-semibold capitalize transition ${
                                current === perm
                                  ? PERMISSION_COLORS[perm]
                                  : 'border-white/10 bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                              }`}
                            >
                              {PERMISSION_LABELS[perm]}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Page Access Section */}
              <div className="mt-6 border-t border-white/[0.06] pt-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/15">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                      <path d="M4 19V5" />
                      <path d="M4 19h16" />
                      <path d="M8 15l3-4 3 2 4-6" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">Hak Akses Halaman</h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">Pilih halaman mana saja yang bisa diakses oleh user ini.</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {PAGES.map((page) => {
                    const allowed = editingPageAccess[page] ?? (page !== 'users');
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => togglePageAccess(page)}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                          allowed
                            ? 'border-emerald-400/20 bg-emerald-500/8 hover:bg-emerald-500/12'
                            : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${
                            allowed
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/5 text-slate-600'
                          }`}>
                            {allowed ? <CheckIcon /> : <XIcon />}
                          </div>
                          <span className={`text-sm font-medium ${allowed ? 'text-slate-100' : 'text-slate-500'}`}>
                            {PAGE_LABELS[page]}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${allowed ? 'text-emerald-400' : 'text-slate-600'}`}>
                          {allowed ? 'Diizinkan' : 'Diblokir'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-white/[0.06] bg-slate-950/95 px-6 py-4 backdrop-blur-md">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserToEditPerms(null)}
                  disabled={savingPerms}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-slate-200 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={savingPerms}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPerms ? 'Menyimpan...' : 'Simpan Permission'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed right-5 top-5 z-[100] flex max-w-md items-start gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl shadow-black/40 backdrop-blur-md transition-all duration-300 ${
          toast.type === 'success'
            ? 'border-emerald-400/20 bg-emerald-500/15 text-emerald-300'
            : 'border-red-400/20 bg-red-500/15 text-red-300'
        }`}>
          <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
            toast.type === 'success'
              ? 'bg-emerald-500/20'
              : 'bg-red-500/20'
          }`}>
            {toast.type === 'success' ? <CheckIcon /> : <XIcon />}
          </div>
          <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
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

function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
