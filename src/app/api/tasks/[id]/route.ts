import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toAppTask, toDbPriority, toDbStatus } from '@/features/tasks/utils/taskMapper';
import type { TaskPriority, TaskStatus } from '@/features/tasks/types/task';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json() as {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    parentId?: string | null;
    team?: string | null;
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
      ...(body.team !== undefined ? { team: body.team } : {}),
      ...(body.dueDate !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
      ...(body.deletedAt !== undefined ? { deletedAt: body.deletedAt ? new Date(body.deletedAt) : null } : {}),
    },
  });

  return NextResponse.json(toAppTask(task));
}
