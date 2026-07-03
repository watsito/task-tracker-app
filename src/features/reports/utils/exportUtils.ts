import { Task, TaskPriority, TaskStatus } from '@/features/tasks/types/task';
import { TaskSummary, CSV_COLUMNS } from '../types/report';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Stats calculator ──────────────────────────────────────────────────────
export function isTaskOverdue(task: Task, now = new Date()): boolean {
  return !!task.dueDate && !task.deletedAt && task.status !== 'Done' && task.dueDate < now;
}

export function isTaskDueSoon(task: Task, now = new Date()): boolean {
  if (!task.dueDate || task.deletedAt || task.status === 'Done' || isTaskOverdue(task, now)) return false;

  const diffMs = task.dueDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= 2;
}

export function calculateSummary(tasks: Task[]): TaskSummary {
  const active = tasks.filter((t) => !t.deletedAt);
  const archived = tasks.filter((t) => !!t.deletedAt);
  const done = active.filter((t) => t.status === 'Done').length;
  const withDueDate = active.filter((t) => !!t.dueDate).length;
  const overdue = active.filter((t) => isTaskOverdue(t)).length;
  const dueSoon = active.filter((t) => isTaskDueSoon(t)).length;
  const onTime = active.filter((t) => !!t.dueDate && !isTaskOverdue(t)).length;

  const byStatus: Record<TaskStatus, number> = {
    'To Do': 0,
    'In Progress': 0,
    Review: 0,
    Done: 0,
  };
  const byPriority: Record<TaskPriority, number> = {
    Low: 0,
    Medium: 0,
    High: 0,
    Urgent: 0,
  };

  active.forEach((t) => {
    byStatus[t.status]++;
    byPriority[t.priority]++;
  });

  return {
    total: tasks.length,
    active: active.length,
    archived: archived.length,
    completionRate: active.length > 0 ? Math.round((done / active.length) * 100) : 0,
    withDueDate,
    overdue,
    dueSoon,
    onTime,
    deadlineHealthRate: withDueDate > 0 ? Math.round((onTime / withDueDate) * 100) : 0,
    byStatus,
    byPriority,
  };
}

// ─── CSV Export ────────────────────────────────────────────────────────────
function escapeCsv(value: string | undefined | null): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(tasks: Task[]): void {
  const header = CSV_COLUMNS.join(',');
  const rows = tasks.map((t) =>
    [
      escapeCsv(t.id),
      escapeCsv(t.title),
      escapeCsv(t.description),
      escapeCsv(t.status),
      escapeCsv(t.priority),
      escapeCsv(t.team ?? ''),
      escapeCsv(t.assigneeId ?? ''),
      escapeCsv(t.parentId ?? ''),
      escapeCsv(t.dueDate?.toISOString() ?? ''),
      escapeCsv(t.createdAt.toISOString()),
      escapeCsv(t.deletedAt?.toISOString() ?? ''),
    ].join(',')
  );

  const csv = [header, ...rows].join('\n');
  triggerDownload(csv, 'text/csv', `task-tracker-export-${datestamp()}.csv`);
}

// ─── JSON Export ───────────────────────────────────────────────────────────
export function exportToJson(tasks: Task[]): void {
  const payload = JSON.stringify(tasks, null, 2);
  triggerDownload(payload, 'application/json', `task-tracker-export-${datestamp()}.json`);
}

// ─── PDF Export ────────────────────────────────────────────────────────────
export function exportToPdf(tasks: Task[]): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Corporate Colors (Proxsis Blue & Neutral)
  const primaryColor: [number, number, number] = [0, 82, 155];
  const textColor: [number, number, number] = [50, 50, 50];
  const lightGray: [number, number, number] = [120, 120, 120];

  // Header / Kop Surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.text('PROXSIS digital', 14, 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text('PT PROXSIS DIGITAL SOLUSI INDONESIA', 14, 26);
  
  // Divider line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(14, 30, pageWidth - 14, 30);
  
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TASK TRACKER REPORT', 14, 40);
  
  // Timestamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 46);
  
  // Total stats summary
  const summary = calculateSummary(tasks);
  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  doc.text(
    `Total Tasks: ${summary.total}   |   Active: ${summary.active}   |   Archived: ${summary.archived}   |   Completion: ${summary.completionRate}%`,
    14, 52
  );

  // Map tasks for table grouping by parentId
  const mainTasks = tasks.filter(t => !t.parentId);
  const tableData: string[][] = [];

  mainTasks.forEach(mainTask => {
    tableData.push([
      mainTask.title,
      mainTask.status,
      mainTask.priority,
      mainTask.team || '-',
        mainTask.assigneeId || '-',
        mainTask.dueDate ? mainTask.dueDate.toLocaleDateString('id-ID') : '-',
        mainTask.createdAt.toLocaleDateString('id-ID'),
      mainTask.deletedAt ? 'Archived' : 'Active'
    ]);

    const childTasks = tasks.filter(t => t.parentId === mainTask.id);
    childTasks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    childTasks.forEach(child => {
      tableData.push([
        `   ↳ [SUB-TASK] ${child.title}`,
        child.status,
        child.priority,
        child.team || '-',
        child.assigneeId || '-',
        child.dueDate ? child.dueDate.toLocaleDateString('id-ID') : '-',
        child.createdAt.toLocaleDateString('id-ID'),
        child.deletedAt ? 'Archived' : 'Active'
      ]);
    });
  });

  autoTable(doc, {
    startY: 58,
    head: [['Title', 'Status', 'Priority', 'Team', 'Assignee', 'Due Date', 'Created', 'State']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didDrawPage: (data) => {
      // Footer: Page Number
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Halaman ${data.pageNumber} - PT Proxsis Digital Solusi Indonesia`,
        data.settings.margin.left,
        pageHeight - 10
      );
    }
  });

  doc.save(`task-tracker-export-${datestamp()}.pdf`);
}

// ─── Browser download trigger ──────────────────────────────────────────────
function triggerDownload(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function datestamp(): string {
  return new Date().toISOString().slice(0, 10);
}
