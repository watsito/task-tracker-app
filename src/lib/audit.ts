import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@/generated/prisma/client';

export async function createAuditLog(
  taskId: string,
  action: string,
  oldValue?: unknown,
  newValue?: unknown
) {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      taskId,
      action,
      oldValue: oldValue !== undefined && oldValue !== null ? (oldValue as Prisma.InputJsonValue) : undefined,
      newValue: newValue !== undefined && newValue !== null ? (newValue as Prisma.InputJsonValue) : undefined,
    },
  });
}

export function diffFields(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  fields: string[]
): { field: string; oldVal: unknown; newVal: unknown }[] {
  const changes: { field: string; oldVal: unknown; newVal: unknown }[] = [];
  for (const field of fields) {
    const oldVal = oldObj[field];
    const newVal = newObj[field];
    if (oldVal !== newVal) {
      changes.push({ field, oldVal, newVal });
    }
  }
  return changes;
}
