import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const now = new Date();

    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: 'DONE' },
        deletedAt: null,
        assigneeId: { not: null },
      },
    });

    let created = 0;

    for (const task of overdueTasks) {
      if (!task.assigneeId) continue;

      const existing = await prisma.notification.findFirst({
        where: {
          userId: task.assigneeId,
          taskId: task.id,
          type: 'deadline_overdue',
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: task.assigneeId,
            type: 'deadline_overdue',
            title: 'Task Overdue',
            message: `"${task.title}" has passed its deadline.`,
            taskId: task.id,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ checked: overdueTasks.length, created });
  } catch (error) {
    console.error('[POST /api/notifications/check-deadlines]', error);
    return NextResponse.json({ error: 'Failed to check deadlines' }, { status: 500 });
  }
}
