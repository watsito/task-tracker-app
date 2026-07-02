'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/tasks/store/authStore';
import { UserRole } from '@/features/tasks/types/user';

// ─── Floating task card (decorative) ──────────────────────────────────────
function FloatingCard({
  title,
  priority,
  status,
  style,
}: {
  title: string;
  priority: string;
  status: string;
  style: React.CSSProperties;
}) {
  const priorityColors: Record<string, string> = {
    Urgent: 'text-red-400 bg-red-500/15 border-red-500/30',
    High: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    Medium: 'text-sky-400 bg-sky-500/15 border-sky-500/30',
    Low: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  };
  return (
    <div
      className="absolute w-52 rounded-xl border border-white/10 bg-slate-800/70 p-3 backdrop-blur-md"
      style={style}
    >
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityColors[priority]}`}
      >
        <span className="h-1 w-1 rounded-full bg-current" />
        {priority}
      </span>
      <p className="mt-2 text-xs font-medium text-slate-200">{title}</p>
      <p className="mt-1 text-[10px] text-slate-500">{status}</p>
    </div>
  );
}

// ─── Main Login Page ───────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setIsLoading(true);
    // Simulate async auth (Firebase will replace this in Phase 2)
    await new Promise((r) => setTimeout(r, 800));

    try {
      await login(name.trim(), email.trim(), role);
      startTransition(() => { router.replace('/'); });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await login(); // Uses Firebase Auth if configured
      startTransition(() => { router.replace('/'); });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setIsLoading(false);
    }
  };

  const handleQuickAccess = async (preset: { name: string; email: string; role: UserRole }) => {
    setIsLoading(true);
    try {
      await login(preset.name, preset.email, preset.role);
      startTransition(() => { router.replace('/'); });
    } catch (err) {
      setError('Quick access failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full overflow-hidden bg-[#070b14]">
      {/* Background radial glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* Left decorative panel (hidden on mobile) */}
      <div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden lg:flex">
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating decorative task cards */}
        <FloatingCard
          title="Firebase Auth Integration"
          priority="Urgent"
          status="In Progress"
          style={{ top: '18%', left: '8%', transform: 'rotate(-4deg)', opacity: 0.85 }}
        />
        <FloatingCard
          title="Kanban Board Layout"
          priority="High"
          status="Review"
          style={{ top: '38%', left: '18%', transform: 'rotate(2deg)', opacity: 0.7 }}
        />
        <FloatingCard
          title="Design System Setup"
          priority="Medium"
          status="To Do"
          style={{ top: '60%', left: '6%', transform: 'rotate(-2deg)', opacity: 0.6 }}
        />
        <FloatingCard
          title="Project Initialization"
          priority="Low"
          status="Done"
          style={{ top: '75%', left: '22%', transform: 'rotate(3deg)', opacity: 0.5 }}
        />

        {/* Brand copy */}
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/40">
            <svg width="30" height="30" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.5" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" fillOpacity="0.5" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Task Tracker</h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
              Kolaborasi tim secara real-time dengan papan Kanban interaktif dan kontrol akses berbasis peran.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {['Real-Time Sync', 'RBAC', 'Soft Delete', 'Kanban Board'].map((f) => (
              <span
                key={f}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-400"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-5 py-12 lg:w-[480px] lg:border-l lg:border-white/[0.06] lg:bg-slate-950/60 lg:backdrop-blur-xl">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.5" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" fillOpacity="0.5" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <span className="text-base font-bold text-slate-100">Task Tracker</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Selamat datang</h2>
          <p className="mt-1.5 text-sm text-slate-400">Masuk untuk melanjutkan ke project board Anda.</p>

          {/* Quick access presets */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            {[
              { name: 'Alex Morgan', email: 'alex@tasktracker.dev', role: 'admin' as UserRole, label: '👑 Admin', desc: 'Akses penuh' },
              { name: 'Jordan Lee', email: 'jordan@tasktracker.dev', role: 'member' as UserRole, label: '👤 Member', desc: 'Akses standar' },
            ].map((preset) => (
              <button
                key={preset.role}
                id={`quick-login-${preset.role}`}
                onClick={() => handleQuickAccess(preset)}
                disabled={isLoading || isPending}
                className="flex flex-col items-start rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition-all duration-150 hover:border-indigo-500/40 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-xs font-semibold text-slate-200">{preset.label}</span>
                <span className="text-[11px] text-slate-500">{preset.desc}</span>
              </button>
            ))}
          </div>

          <div className="relative my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[11px] font-medium text-slate-500">atau masuk manual</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Sign in form */}
          <form onSubmit={handleSignIn} className="flex flex-col gap-3.5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-name" className="text-xs font-medium text-slate-400">Nama</label>
              <input
                id="login-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap Anda"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all duration-150 focus:border-indigo-500/60 focus:bg-indigo-500/5 focus:ring-1 focus:ring-indigo-500/25"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs font-medium text-slate-400">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@contoh.com"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all duration-150 focus:border-indigo-500/60 focus:bg-indigo-500/5 focus:ring-1 focus:ring-indigo-500/25"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-xs font-medium text-slate-400">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all duration-150 focus:border-indigo-500/60 focus:bg-indigo-500/5 focus:ring-1 focus:ring-indigo-500/25"
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Role</label>
              <div className="flex rounded-xl border border-white/10 bg-white/5 p-0.5">
                {(['member', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    id={`select-role-${r}`}
                    onClick={() => setRole(r)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition-all duration-150 ${
                      role === r
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r === 'admin' ? '👑 Admin' : '👤 Member'}
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="submit-login"
              type="submit"
              disabled={isLoading || isPending}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-150 hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading || isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Masuk...</span>
                </>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[11px] font-medium text-slate-500">atau lanjutkan dengan</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Google Sign In (mock) */}
          <button
            id="google-sign-in"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isPending}
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-slate-200 transition-all duration-150 hover:border-white/20 hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            <span>Google</span>
            <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
              Phase 2
            </span>
          </button>

          <p className="mt-6 text-center text-[11px] text-slate-600">
            Dengan masuk, Anda menyetujui{' '}
            <span className="cursor-pointer text-indigo-400 hover:underline">Syarat Layanan</span>
            {' '}dan{' '}
            <span className="cursor-pointer text-indigo-400 hover:underline">Kebijakan Privasi</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Inline icons ──────────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.5 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.6 35.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C37 39.1 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}
