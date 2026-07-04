import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

await client.query('BEGIN');

await client.query('DELETE FROM audit_logs');
await client.query('DELETE FROM notifications');
await client.query('DELETE FROM tasks');
await client.query('DELETE FROM milestones');
await client.query('DELETE FROM projects');
await client.query('DELETE FROM lead_sources');
await client.query('DELETE FROM users');

const defaultPasswordHash = await bcrypt.hash('password123', 10);
const users = [
  ['user-admin', 'Admin Demo', 'admin@example.com', defaultPasswordHash, 'ADMIN'],
  ['user-member', 'Member Demo', 'member@example.com', defaultPasswordHash, 'MEMBER'],
  ['user-qa', 'QA Demo', 'qa@example.com', defaultPasswordHash, 'MEMBER'],
];

for (const user of users) {
  await client.query(
    'INSERT INTO users (id, name, email, "passwordHash", role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5::"UserRole", NOW(), NOW())',
    user
  );
}

const projects = [
  ['project-sales-dashboard', 'Sales Dashboard Revamp', 'Proxsis Sales', 'Redesign dashboard untuk monitoring penjualan.', '2026-07-31'],
  ['project-ops-tracker', 'Operations Tracker MVP', 'Internal Ops', 'MVP tracking pekerjaan internal lintas tim.', '2026-08-15'],
];

for (const project of projects) {
  await client.query(
    'INSERT INTO projects (id, name, client, description, "dueDate", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5::timestamp, NOW(), NOW())',
    project
  );
}

const milestones = [
  ['milestone-sales-design', 'Design Approval', '2026-07-12', 'project-sales-dashboard'],
  ['milestone-sales-build', 'Build & QA', '2026-07-25', 'project-sales-dashboard'],
  ['milestone-ops-auth', 'Auth & User Management', '2026-07-10', 'project-ops-tracker'],
  ['milestone-ops-report', 'Reports & Deadline KPI', '2026-07-20', 'project-ops-tracker'],
];

for (const milestone of milestones) {
  await client.query(
    'INSERT INTO milestones (id, name, "dueDate", "projectId", "createdAt", "updatedAt") VALUES ($1, $2, $3::timestamp, $4, NOW(), NOW())',
    milestone
  );
}

const tasks = [
  ['task-setup', 'Setup PostgreSQL Database', 'Konfigurasi database App_Tracker dan Prisma schema.', 'DONE', 'HIGH', 'Backend', 'user-admin', null, 'project-ops-tracker', 'milestone-ops-auth', '2026-07-01'],
  ['task-api', 'Connect Task API to Database', 'Membuat API route untuk CRUD task menggunakan Prisma.', 'IN_PROGRESS', 'URGENT', 'Backend', 'user-admin', null, 'project-ops-tracker', 'milestone-ops-auth', '2026-07-05'],
  ['task-ui', 'Polish Kanban Board UI', 'Rapikan tampilan board agar siap demo MVP.', 'REVIEW', 'MEDIUM', 'Frontend', 'user-member', null, 'project-sales-dashboard', 'milestone-sales-design', '2026-07-08'],
  ['task-report', 'Validate Reports Export', 'Pastikan export CSV, JSON, dan PDF membaca data terbaru.', 'TODO', 'MEDIUM', 'QA', 'user-qa', null, 'project-ops-tracker', 'milestone-ops-report', '2026-07-10'],
  ['task-api-sub-1', 'Create GET /api/tasks', 'Endpoint list task dari PostgreSQL.', 'DONE', 'HIGH', 'Backend', 'user-admin', 'task-api', 'project-ops-tracker', 'milestone-ops-auth', '2026-07-03'],
  ['task-api-sub-2', 'Create POST /api/tasks', 'Endpoint tambah task ke PostgreSQL.', 'IN_PROGRESS', 'HIGH', 'Backend', 'user-admin', 'task-api', 'project-ops-tracker', 'milestone-ops-auth', '2026-07-04'],
  ['task-api-sub-3', 'Create PATCH /api/tasks/[id]', 'Endpoint update status, edit, dan soft delete task.', 'TODO', 'HIGH', 'Backend', 'user-admin', 'task-api', 'project-ops-tracker', 'milestone-ops-report', '2026-07-06'],

  // ─── Deadline test tasks ───────────────────────────────────────────────
  ['task-overdue-1', 'Submit Q2 Financial Report', 'Laporan keuangan Q2 harus dikumpulkan ke manajemen.', 'IN_PROGRESS', 'URGENT', 'Management', 'user-member', null, 'project-sales-dashboard', null, '2026-07-02'],
  ['task-overdue-2', 'Fix Login Bug on Mobile', 'User tidak bisa login di device Android tertentu.', 'IN_PROGRESS', 'HIGH', 'Frontend', 'user-member', null, 'project-ops-tracker', null, '2026-07-03'],
  ['task-overdue-3', 'Deploy Staging Environment', 'Setup staging server untuk testing sebelum go-live.', 'TODO', 'HIGH', 'Backend', 'user-admin', null, 'project-ops-tracker', null, '2026-07-01'],
  ['task-due-today', 'Review Marketing Campaign Data', 'Validasi data campaign bulan Juni sebelum presentasi.', 'IN_PROGRESS', 'URGENT', 'Marketing', 'user-qa', null, 'project-sales-dashboard', null, '2026-07-04'],
  ['task-due-tomorrow', 'Finalize Dashboard Wireframes', 'Selesaikan wireframe untuk dashboard v2.', 'REVIEW', 'HIGH', 'Design', 'user-member', null, 'project-sales-dashboard', 'milestone-sales-design', '2026-07-05'],
  ['task-future-1', 'Implement Notification System', 'Buat sistem notifikasi in-app untuk deadline reminder.', 'TODO', 'MEDIUM', 'Backend', 'user-admin', null, 'project-ops-tracker', 'milestone-ops-report', '2026-07-15'],
  ['task-future-2', 'Write Unit Tests for Auth API', 'Coverage minimal 80% untuk auth endpoints.', 'TODO', 'MEDIUM', 'QA', 'user-qa', null, 'project-ops-tracker', 'milestone-ops-report', '2026-07-20'],
  ['task-future-3', 'Client Presentation Prep', 'Siapkan slide dan demo untuk presentasi ke klien.', 'TODO', 'HIGH', 'Management', 'user-member', null, 'project-sales-dashboard', null, '2026-07-25'],
  ['task-done-no-worry', 'Database Migration Script', 'Buat script migrasi dari PostgreSQL lama ke baru.', 'DONE', 'MEDIUM', 'Backend', 'user-admin', null, 'project-ops-tracker', null, '2026-07-01'],
];

for (const task of tasks) {
  await client.query(
    'INSERT INTO tasks (id, title, description, status, priority, team, "assigneeId", "parentId", "projectId", "milestoneId", "dueDate", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4::"TaskStatus", $5::"TaskPriority", $6, $7, $8, $9, $10, $11::timestamp, NOW(), NOW())',
    task
  );
}

await client.query('COMMIT');
await client.end();

console.log('Seed completed: 3 users, 2 projects, 4 milestones, 16 tasks');
