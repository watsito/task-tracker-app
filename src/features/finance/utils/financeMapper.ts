import { Prisma } from '@/generated/prisma/client';
import type { FinanceProjectInput, FinanceProjectRecord } from '@/features/finance/types/finance';

export function validateFinanceProjectInput(input: FinanceProjectInput) {
  if (!input.clientName.trim()) {
    throw new Error('Nama klien wajib diisi.');
  }

  if (!input.projectName.trim()) {
    throw new Error('Nama project wajib diisi.');
  }

  if (!Number.isFinite(input.totalProject) || input.totalProject <= 0) {
    throw new Error('Total project harus lebih dari 0.');
  }

  if (input.termins.length === 0) {
    throw new Error('Minimal harus ada 1 termin.');
  }

  const invalidTermin = input.termins.find((termin) => !termin.name.trim());
  if (invalidTermin) {
    throw new Error('Setiap termin harus memiliki nama.');
  }

  const totalPercentage = input.termins.reduce((total, termin) => total + termin.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error('Total persentase termin harus tepat 100%.');
  }
}

export function toFinanceProjectResponse(project: {
  id: string;
  clientName: string;
  projectName: string;
  dateStart: Date | null;
  dateEnd: Date | null;
  totalProject: Prisma.Decimal;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { id: string; name: string } | null;
  termins: Array<{
    id: string;
    order: number;
    name: string;
    percentage: Prisma.Decimal;
    billingDate: Date | null;
    description: string;
    billingStatus: string;
    disbursementStatus: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}): FinanceProjectRecord {
  return {
    id: project.id,
    clientName: project.clientName,
    projectName: project.projectName,
    dateStart: project.dateStart?.toISOString() ?? null,
    dateEnd: project.dateEnd?.toISOString() ?? null,
    totalProject: Number(project.totalProject),
    status: project.status,
    notes: project.notes,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    createdBy: project.createdBy ?? null,
    termins: project.termins.map((termin) => ({
      id: termin.id,
      order: termin.order,
      name: termin.name,
      percentage: Number(termin.percentage),
      billingDate: termin.billingDate?.toISOString() ?? null,
      description: termin.description,
      billingStatus: termin.billingStatus === 'BILLABLE' ? 'BILLABLE' : 'NOT_BILLABLE',
      disbursementStatus: termin.disbursementStatus === 'DISBURSED' ? 'DISBURSED' : 'NOT_DISBURSED',
      createdAt: termin.createdAt.toISOString(),
      updatedAt: termin.updatedAt.toISOString(),
    })),
  };
}
