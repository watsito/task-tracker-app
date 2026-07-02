import { Task, TaskStatus, TaskPriority } from '@/features/tasks/types/task';
import { ImportResult } from '../types/report';

const VALID_STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];
const VALID_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

// ─── JSON Import ───────────────────────────────────────────────────────────
export async function parseJsonFile(file: File): Promise<ImportResult> {
  const text = await file.text();
  const errors: string[] = [];
  const tasks: Omit<Task, 'id' | 'createdAt'>[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { imported: 0, skipped: 0, errors: ['File JSON tidak valid.'], tasks: [] };
  }

  if (!Array.isArray(parsed)) {
    return { imported: 0, skipped: 0, errors: ['File JSON harus berisi array task.'], tasks: [] };
  }

  parsed.forEach((item: unknown, index: number) => {
    const row = index + 1;
    if (typeof item !== 'object' || item === null) {
      errors.push(`Baris ${row}: Bukan objek yang valid.`);
      return;
    }
    const obj = item as Record<string, unknown>;
    const result = validateTaskRow(obj, `Item ${row}`);
    if (result.error) {
      errors.push(result.error);
    } else if (result.task) {
      tasks.push(result.task);
    }
  });

  return { imported: tasks.length, skipped: errors.length, errors, tasks };
}

// ─── CSV Import ────────────────────────────────────────────────────────────
export async function parseCsvFile(file: File): Promise<ImportResult> {
  const text = await file.text();
  const errors: string[] = [];
  const tasks: Omit<Task, 'id' | 'createdAt'>[] = [];

  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) {
    return { imported: 0, skipped: 0, errors: ['File CSV kosong atau tidak ada data.'], tasks: [] };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const requiredHeaders = ['title', 'status', 'priority'];
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

  if (missingHeaders.length > 0) {
    return {
      imported: 0,
      skipped: 0,
      errors: [`Kolom wajib tidak ditemukan: ${missingHeaders.join(', ')}`],
      tasks: [],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => { row[h] = values[idx]?.trim() ?? ''; });

    const result = validateTaskRow(row, `Baris CSV ${i + 1}`);
    if (result.error) {
      errors.push(result.error);
    } else if (result.task) {
      tasks.push(result.task);
    }
  }

  return { imported: tasks.length, skipped: errors.length, errors, tasks };
}

// ─── Shared row validator ──────────────────────────────────────────────────
function validateTaskRow(
  row: Record<string, unknown>,
  label: string
): { task?: Omit<Task, 'id' | 'createdAt'>; error?: string } {
  const title = String(row.title ?? '').trim();
  if (!title) return { error: `${label}: field 'title' wajib diisi.` };

  const status = String(row.status ?? '').trim() as TaskStatus;
  if (!VALID_STATUSES.includes(status)) {
    return { error: `${label}: status "${status}" tidak valid. Gunakan: ${VALID_STATUSES.join(', ')}.` };
  }

  const priority = String(row.priority ?? '').trim() as TaskPriority;
  if (!VALID_PRIORITIES.includes(priority)) {
    return { error: `${label}: priority "${priority}" tidak valid. Gunakan: ${VALID_PRIORITIES.join(', ')}.` };
  }

  return {
    task: {
      title,
      description: String(row.description ?? '').trim(),
      status,
      priority,
      assigneeId: String(row.assigneeid ?? row.assigneeId ?? '').trim() || null,
    },
  };
}

// ─── CSV line parser (handles quoted fields) ───────────────────────────────
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
