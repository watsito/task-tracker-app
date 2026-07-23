'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/tasks/store/authStore';

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Masukkan alamat email yang valid.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email.trim(), password);
      startTransition(() => router.replace('/'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
      setIsLoading(false);
    }
  };

  const busy = isLoading || isPending;

  return (
    <main className="relative isolate flex min-h-dvh w-full overflow-hidden bg-stone-100 text-stone-950 dark:bg-[#0c0a09] dark:text-stone-50">
      <div className="absolute inset-y-0 left-0 hidden w-[42%] origin-left animate-[motion-panel_900ms_cubic-bezier(0.22,1,0.36,1)_both] border-r border-stone-300/70 bg-[#d8d0c5] lg:block dark:border-white/[0.07] dark:bg-[#15120f]" />
      <div className="absolute left-[8%] top-[14%] hidden h-[72%] w-px origin-top animate-[motion-line_1100ms_200ms_cubic-bezier(0.22,1,0.36,1)_both] bg-stone-500/30 lg:block dark:bg-stone-500/20" />

      <section className="relative z-10 mx-auto grid w-full max-w-7xl items-stretch px-6 sm:px-10 lg:grid-cols-[0.72fr_1fr] lg:px-14">
        <div className="hidden flex-col justify-between py-14 pr-14 lg:flex">
          <div className="motion-slide-right motion-delay-1 flex items-center gap-3">
            <BrandMark />
            <span className="text-sm font-bold tracking-[-0.02em]">Task Tracker</span>
          </div>

          <div className="max-w-md pb-12">
            <p className="motion-slide-right motion-delay-2 text-[clamp(2.75rem,4.6vw,4.8rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-stone-900 dark:text-stone-100">
              Kerja yang jelas. Tim yang selaras.
            </p>
            <p className="motion-slide-right motion-delay-3 mt-8 max-w-sm text-base leading-7 text-stone-600 dark:text-stone-400">
              Satu ruang kerja untuk merencanakan, menjalankan, dan memantau pekerjaan lintas tim.
            </p>
          </div>

          <p className="motion-slide-right motion-delay-4 text-xs font-medium tracking-wide text-stone-500 dark:text-stone-600">
            Product Development &amp; Management
          </p>
        </div>

        <div className="flex min-h-dvh items-center justify-center py-12 lg:justify-end lg:pl-20">
          <div className="w-full max-w-[420px]">
            <div className="motion-rise mb-12 flex items-center gap-3 lg:hidden">
              <BrandMark />
              <span className="text-sm font-bold tracking-[-0.02em]">Task Tracker</span>
            </div>

            <div className="motion-rise motion-delay-1 mb-9">
              <p className="text-sm font-medium text-stone-500 dark:text-stone-500">Akses ruang kerja</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950 dark:text-stone-50">
                Selamat datang kembali
              </h1>
              <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">
                Masuk menggunakan akun perusahaan Anda.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="motion-rise motion-delay-2 space-y-5">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Email
                </label>
                <input
                  suppressHydrationWarning
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@perusahaan.com"
                  className="h-12 w-full border border-stone-300 bg-white px-4 text-sm text-stone-950 outline-none transition duration-200 placeholder:text-stone-400 hover:border-stone-400 focus:border-stone-700 focus:ring-1 focus:ring-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-600 dark:hover:border-stone-600 dark:focus:border-amber-600 dark:focus:ring-amber-600"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    suppressHydrationWarning
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="h-12 w-full border border-stone-300 bg-white px-4 pr-12 text-sm text-stone-950 outline-none transition duration-200 placeholder:text-stone-400 hover:border-stone-400 focus:border-stone-700 focus:ring-1 focus:ring-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-600 dark:hover:border-stone-600 dark:focus:border-amber-600 dark:focus:ring-amber-600"
                  />
                  <button
                    suppressHydrationWarning
                    type="button"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-stone-500 transition duration-300 hover:rotate-6 hover:scale-110 hover:text-stone-900 active:scale-90 dark:hover:text-stone-200"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="border-l-2 border-red-600 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              )}

              <button
                suppressHydrationWarning
                id="submit-login"
                type="submit"
                disabled={busy}
                className="flex h-12 w-full items-center justify-center gap-2 bg-stone-900 px-5 text-sm font-semibold text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-stone-700 hover:shadow-[0_12px_30px_rgba(41,37,36,0.18)] active:translate-y-px active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#b46b3d] dark:hover:bg-[#c47a49] dark:hover:shadow-[0_12px_30px_rgba(180,107,61,0.2)]"
              >
                {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                {busy ? 'Masuk...' : 'Masuk ke ruang kerja'}
              </button>
            </form>

            <p className="motion-rise motion-delay-3 mt-10 border-t border-stone-300 pt-5 text-xs leading-5 text-stone-500 dark:border-stone-800 dark:text-stone-600">
              Akses dibatasi untuk anggota tim yang terdaftar. Hubungi administrator jika Anda mengalami kendala.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function BrandMark() {
  return (
    <div className="grid h-9 w-9 grid-cols-2 gap-[3px] bg-stone-900 p-[7px] transition-transform duration-500 ease-out hover:rotate-3 hover:scale-105 dark:bg-[#b46b3d]" aria-hidden="true">
      <span className="bg-white" />
      <span className="bg-white/45" />
      <span className="bg-white/45" />
      <span className="bg-white" />
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
