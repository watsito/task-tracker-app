import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { deletedAt: null },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();
    const activeTasks = tasks;
    const totalTasks = activeTasks.length;
    const inProgress = activeTasks.filter((task) => task.status === 'IN_PROGRESS').length;
    const done = activeTasks.filter((task) => task.status === 'DONE').length;
    const overdue = activeTasks.filter((task) => !!task.dueDate && task.status !== 'DONE' && task.dueDate < now).length;
    const completionRate = totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0;

    const byStatus = {
      'To Do': activeTasks.filter((task) => task.status === 'TODO').length,
      'In Progress': activeTasks.filter((task) => task.status === 'IN_PROGRESS').length,
      Review: activeTasks.filter((task) => task.status === 'REVIEW').length,
      Done: activeTasks.filter((task) => task.status === 'DONE').length,
    };

    const byPriority = {
      Low: activeTasks.filter((task) => task.priority === 'LOW').length,
      Medium: activeTasks.filter((task) => task.priority === 'MEDIUM').length,
      High: activeTasks.filter((task) => task.priority === 'HIGH').length,
      Urgent: activeTasks.filter((task) => task.priority === 'URGENT').length,
    };

    const assigneeMap = new Map();
    for (const task of activeTasks) {
      const key = task.assignee?.id ?? 'unassigned';
      const label = task.assignee?.name ?? 'Unassigned';
      const existing = assigneeMap.get(key) ?? { id: key, name: label, tasks: 0, byStatus: { 'To Do': 0, 'In Progress': 0, Review: 0, Done: 0 } };
      existing.tasks += 1;
      if (task.status === 'TODO') existing.byStatus['To Do'] += 1;
      if (task.status === 'IN_PROGRESS') existing.byStatus['In Progress'] += 1;
      if (task.status === 'REVIEW') existing.byStatus.Review += 1;
      if (task.status === 'DONE') existing.byStatus.Done += 1;
      assigneeMap.set(key, existing);
    }

    const topAssignees = Array.from(assigneeMap.values()).sort((a, b) => b.tasks - a.tasks).slice(0, 8);

    const projectMap = new Map();
    for (const task of activeTasks) {
      const key = task.project?.id ?? 'no-project';
      const label = task.project?.name ?? 'Tanpa Project';
      const existing = projectMap.get(key) ?? { id: key, name: label, tasks: 0, done: 0 };
      existing.tasks += 1;
      if (task.status === 'DONE') existing.done += 1;
      projectMap.set(key, existing);
    }

    const topProjects = Array.from(projectMap.values())
      .map((project) => ({
        ...project,
        completionRate: project.tasks > 0 ? Math.round((project.done / project.tasks) * 100) : 0,
      }))
      .sort((a, b) => b.tasks - a.tasks)
      .slice(0, 8);

    return NextResponse.json({
      summary: {
        totalTasks,
        inProgress,
        overdue,
        completionRate,
      },
      byStatus,
      byPriority,
      topAssignees,
      topProjects,
    });
  } catch (error) {
    console.error('[GET /api/dashboard/operational]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load operational dashboard' }, { status: 500 });
  }
}
