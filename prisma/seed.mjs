import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

await client.query('BEGIN');

await client.query('DELETE FROM tasks');
await client.query('DELETE FROM users');

const users = [
  ['user-admin', 'Admin Demo', 'admin@example.com', 'ADMIN'],
  ['user-member', 'Member Demo', 'member@example.com', 'MEMBER'],
  ['user-qa', 'QA Demo', 'qa@example.com', 'MEMBER'],
];

for (const user of users) {
  await client.query(
    'INSERT INTO users (id, name, email, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4::"UserRole", NOW(), NOW())',
    user
  );
}

const tasks = [
  ['task-setup', 'Setup PostgreSQL Database', 'Konfigurasi database App_Tracker dan Prisma schema.', 'DONE', 'HIGH', 'Backend', 'user-admin', null],
  ['task-api', 'Connect Task API to Database', 'Membuat API route untuk CRUD task menggunakan Prisma.', 'IN_PROGRESS', 'URGENT', 'Backend', 'user-admin', null],
  ['task-ui', 'Polish Kanban Board UI', 'Rapikan tampilan board agar siap demo MVP.', 'REVIEW', 'MEDIUM', 'Frontend', 'user-member', null],
  ['task-report', 'Validate Reports Export', 'Pastikan export CSV, JSON, dan PDF membaca data terbaru.', 'TODO', 'MEDIUM', 'QA', 'user-qa', null],
  ['task-api-sub-1', 'Create GET /api/tasks', 'Endpoint list task dari PostgreSQL.', 'DONE', 'HIGH', 'Backend', 'user-admin', 'task-api'],
  ['task-api-sub-2', 'Create POST /api/tasks', 'Endpoint tambah task ke PostgreSQL.', 'IN_PROGRESS', 'HIGH', 'Backend', 'user-admin', 'task-api'],
  ['task-api-sub-3', 'Create PATCH /api/tasks/[id]', 'Endpoint update status, edit, dan soft delete task.', 'TODO', 'HIGH', 'Backend', 'user-admin', 'task-api'],
];

for (const task of tasks) {
  await client.query(
    'INSERT INTO tasks (id, title, description, status, priority, team, "assigneeId", "parentId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4::"TaskStatus", $5::"TaskPriority", $6, $7, $8, NOW(), NOW())',
    task
  );
}

await client.query('COMMIT');
await client.end();

console.log('Seed completed: 3 users, 7 tasks');
