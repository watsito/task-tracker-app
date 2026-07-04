import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toAppTask, toDbPriority, toDbStatus } from '@/features/tasks/utils/taskMapper';
import { createAuditLog } from '@/lib/audit';
import type { TaskPriority, TaskStatus } from '@/features/tasks/types/task';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const STATUS_MAP: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};

const PRIORITY_MAP: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const oldTask = await prisma.task.findUnique({ where: { id } });
  if (!oldTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const body = await request.json() as {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    parentId?: string | null;
    team?: string | null;
    projectId?: string | null;
    milestoneId?: string | null;
    dueDate?: string | null;
    deletedAt?: string | null;
  };

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description.trim() } : {}),
      ...(body.status !== undefined ? { status: toDbStatus(body.status) } : {}),
      ...(body.priority !== undefined ? { priority: toDbPriority(body.priority) } : {}),
      ...(body.assigneeId !== undefined ? { assignee: body.assigneeId ? { connect: { id: body.assigneeId } } : { disconnect: true } } : {}),
      ...(body.parentId !== undefined ? { parent: body.parentId ? { connect: { id: body.parentId } } : { disconnect: true } } : {}),
      ...(body.projectId !== undefined ? { project: body.projectId ? { connect: { id: body.projectId } } : { disconnect: true } } : {}),
      ...(body.milestoneId !== undefined ? { milestone: body.milestoneId ? { connect: { id: body.milestoneId } } : { disconnect: true } } : {}),
      ...(body.team !== undefined ? { team: body.team } : {}),
      ...(body.dueDate !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
      ...(body.deletedAt !== undefined ? { deletedAt: body.deletedAt ? new Date(body.deletedAt) : null } : {}),
    },
  });

  if (body.status !== undefined && body.status !== STATUS_MAP[oldTask.status]) {
    await createAuditLog(id, 'status_changed', STATUS_MAP[oldTask.status], body.status);
  }
  if (body.priority !== undefined && body.priority !== PRIORITY_MAP[oldTask.priority]) {
    await createAuditLog(id, 'priority_changed', PRIORITY_MAP[oldTask.priority], body.priority);
  }
  if (body.assigneeId !== undefined && body.assigneeId !== oldTask.assigneeId) {
    await createAuditLog(id, 'assignee_changed', oldTask.assigneeId, body.assigneeId);
  }
  if (body.team !== undefined && body.team !== oldTask.team) {
    await createAuditLog(id, 'team_changed', oldTask.team, body.team);
  }
  if (body.title !== undefined && body.title.trim() !== oldTask.title) {
    await createAuditLog(id, 'title_changed', oldTask.title, body.title.trim());
  }
  if (body.deletedAt !== undefined) {
    const wasDeleted = oldTask.deletedAt !== null;
    const isDeleted = body.deletedAt !== null;
    if (wasDeleted !== isDeleted) {
      await createAuditLog(id, isDeleted ? 'archived' : 'restored', null, null);
    }
  }

  return NextResponse.json(toAppTask(task));
}
