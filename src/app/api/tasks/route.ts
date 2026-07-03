import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toAppTask, toDbPriority, toDbStatus } from '@/features/tasks/utils/taskMapper';
import type { TaskPriority, TaskStatus } from '@/features/tasks/types/task';

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(tasks.map(toAppTask));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      parentId?: string | null;
      team?: string | null;
      dueDate?: string | null;
    };

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const dueDate = body.dueDate ? new Date(body.dueDate) : null;

    if (body.dueDate && Number.isNaN(dueDate?.getTime())) {
      return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() ?? '',
        status: toDbStatus(body.status ?? 'To Do'),
        priority: toDbPriority(body.priority ?? 'Medium'),
        ...(body.assigneeId ? { assignee: { connect: { id: body.assigneeId } } } : {}),
        ...(body.parentId ? { parent: { connect: { id: body.parentId } } } : {}),
        team: body.team ?? null,
        dueDate,
      },
    });

    return NextResponse.json(toAppTask(task), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
