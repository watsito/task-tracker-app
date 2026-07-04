'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HeaderUser from './HeaderUser';
import { useAuthStore } from '../store/authStore';
import { PageKey, PAGE_ROUTES } from '../types/user';

const FORM_TEAMS = ['Marketing', 'Management', 'Frontend', 'Backend', 'Design', 'QA', 'Product'] as const;

const NAV = [
  { href: '/', label: 'Board', icon: BoardIcon, page: 'board' as PageKey },
  { href: '/reports', label: 'Reports', icon: ReportsIcon, page: 'reports' as PageKey },
  { href: '/integrations', label: 'Integrations', icon: IntegrationsIcon, page: 'integrations' as PageKey },
];

function hasPageAccess(user: { role: string; permissions?: { pages?: Record<string, boolean> } } | null, page: PageKey): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions?.pages?.[page] ?? (page !== 'users');
}

export default function AppHeader() {
  const pathname = usePathname();
  const currentUser = useAuthStore((s) => s.currentUser);
  const navItems = useMemo(() => {
    const items = NAV.filter((item) => hasPageAccess(currentUser, item.page));
    if (hasPageAccess(currentUser, 'users')) {
      items.push({ href: '/users', label: 'Users', icon: UsersIcon, page: 'users' as PageKey });
    }
    return items;
  }, [currentUser]);
  const canAccessForm = hasPageAccess(currentUser, 'form');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <header className="relative z-30 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/90 px-4 py-3 backdrop-blur-md sm:px-6 md:px-8">
        {/* Left: Logo + Desktop Nav */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" />
                <rect x="9" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.5" />
                <rect x="2" y="9" width="5" height="5" rx="1" fill="white" fillOpacity="0.5" />
                <rect x="9" y="9" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="hidden text-sm font-bold tracking-tight text-slate-100 sm:block">
              Product dev & Management
            </span>
            <span className="hidden rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400 sm:block">
              Beta
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="ml-1 hidden items-center gap-1 md:flex">
            <div className="mx-2 h-5 w-px bg-white/[0.08]" />
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  id={`nav-${label.toLowerCase()}`}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white/10 text-slate-100'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon />
                  {label}
                </Link>
              );
            })}

            {/* Form link */}
            {canAccessForm && (
              <Link
                href="/lead-sources"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  pathname === '/lead-sources'
                    ? 'bg-white/10 text-slate-100'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <LeadsIcon />
                Form
              </Link>
            )}
          </div>
        </div>

        {/* Right: Desktop extras + User */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <NotificationBell />

          {/* User avatar — always visible */}
          <HeaderUser />

          {/* Hamburger — mobile only */}
          <button
            id="mobile-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition md:hidden"
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden" />
      )}

      {/* Mobile menu panel */}
      <div
        ref={menuRef}
        className={`fixed left-0 right-0 top-[57px] z-20 border-b border-white/[0.08] bg-slate-950/98 backdrop-blur-xl transition-all duration-200 md:hidden ${
          menuOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Icon />
                {label}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />}
              </Link>
            );
          })}

          {/* Form link in mobile */}
          {canAccessForm && (
            <Link
              href="/lead-sources"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                pathname === '/lead-sources'
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <LeadsIcon />
              Form
              {pathname === '/lead-sources' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />}
            </Link>
          )}
        </nav>

      </div>
    </>
  );
}

// ─── Notification Bell ──────────────────────────────────────────────────────

interface NotificationEntry {
  id: string;
  type: string;
  title: string;
  message: string;
  taskId: string | null;
  isRead: boolean;
  createdAt: string;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setNotifications(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    fetch('/api/notifications/check-deadlines', { method: 'POST' })
      .then(() => fetchNotifications())
      .catch(() => {});
  }, [fetchNotifications]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-slate-200"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/[0.1] bg-slate-900 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <h3 className="text-sm font-bold text-slate-100">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">No notifications</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] ${
                    n.isRead ? 'opacity-60' : ''
                  }`}
                >
                  <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-red-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{n.message}</p>
                    <p className="mt-1 text-[10px] text-slate-600">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function BoardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="1" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function ReportsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IntegrationsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
    </svg>
  );
}
function LeadsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15l3-4 3 2 4-6" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
