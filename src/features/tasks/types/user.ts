export type UserRole = 'admin' | 'member';

export type Department = 'MARKETING' | 'OPERATIONAL' | 'MANAGEMENT';

export const DEPARTMENTS: { value: Department; label: string; icon: string; desc: string }[] = [
  { value: 'OPERATIONAL', label: 'Operational', icon: '📋', desc: 'Task board & project management' },
  { value: 'MARKETING', label: 'Marketing', icon: '📣', desc: 'Lead sources & marketing dashboard' },
  { value: 'MANAGEMENT', label: 'Management', icon: '📊', desc: 'Switch between task board and marketing dashboard' },
];

// ─── Team Permissions ───────────────────────────────────────

/** Permission level for a specific team */
export type TeamPermission = 'none' | 'view' | 'edit' | 'admin';

/** Available teams in the system */
export const TEAMS = [
  'frontend',
  'backend',
  'design',
  'qa',
  'management',
  'marketing',
  'product',
] as const;

export type TeamName = (typeof TEAMS)[number];

/** Human-readable labels for each team */
export const TEAM_LABELS: Record<TeamName, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  design: 'Design',
  qa: 'QA',
  management: 'Management',
  marketing: 'Marketing',
  product: 'Product',
};

/** Human-readable labels for each permission level */
export const PERMISSION_LABELS: Record<TeamPermission, string> = {
  none: 'Tidak Ada',
  view: 'Melihat',
  edit: 'Edit',
  admin: 'Admin',
};

/** Color classes for each permission level */
export const PERMISSION_COLORS: Record<TeamPermission, string> = {
  none: 'border-slate-500/30 bg-slate-500/10 text-slate-500',
  view: 'border-sky-400/30 bg-sky-500/15 text-sky-300',
  edit: 'border-amber-400/30 bg-amber-500/15 text-amber-300',
  admin: 'border-indigo-400/30 bg-indigo-500/15 text-indigo-300',
};

export interface TeamPermissions {
  [team: string]: TeamPermission;
}

// ─── Page Access ────────────────────────────────────────────

/** Available navigation pages */
export const PAGES = [
  'board',
  'reports',
  'integrations',
  'form',
  'users',
  'settings',
  'operationalDashboard',
] as const;

export type PageKey = (typeof PAGES)[number];

/** Human-readable labels for each page */
export const PAGE_LABELS: Record<PageKey, string> = {
  board: 'Board',
  reports: 'Reports',
  integrations: 'Integrations',
  form: 'Form (Lead Sources)',
  users: 'Users (Admin)',
  settings: 'Pengaturan',
  operationalDashboard: 'Operational Dashboard',
};

/** Page route map */
export const PAGE_ROUTES: Record<PageKey, string> = {
  board: '/',
  reports: '/reports',
  integrations: '/integrations',
  form: '/lead-sources',
  users: '/users',
  settings: '/settings',
  operationalDashboard: '/dashboard/operational',
};

export interface PageAccess {
  [page: string]: boolean;
}

// ─── Combined Permissions ───────────────────────────────────

export interface UserPermissions {
  teams?: TeamPermissions;
  pages?: PageAccess;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departments: Department[];
  permissions?: UserPermissions;
  avatarUrl?: string;
}
