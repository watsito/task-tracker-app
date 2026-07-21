export type FinanceProjectStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';
export type FinanceTerminStatus = 'TO_INVOICE' | 'OPEN_INVOICE' | 'OUTSTANDING' | 'PAID';

export type FinanceTerminAuditAction = 'STATUS_CHANGED' | 'BILLING_DATE_SET' | 'BILLING_DATE_EDITED' | 'PAYMENT_DEADLINE_EDITED';

export interface FinanceTerminAuditRecord {
  id: string;
  action: FinanceTerminAuditAction;
  fromStatus: FinanceTerminStatus | null;
  toStatus: FinanceTerminStatus | null;
  metadata: Record<string, unknown> | null;
  createdByName: string;
  createdAt: string;
}

export interface FinanceTerminStatusTransitionRequest {
  targetStatus: FinanceTerminStatus;
  billingDate?: string | null;
  paymentDeadline?: string | null;
}

export interface FinanceTerminDateUpdateRequest {
  billingDate: string | null;
  paymentDeadline: string | null;
}

export interface FinanceTerminInput {
  id?: string;
  order: number;
  name: string;
  percentage: number;
  billingDate: string | null;
  paymentDeadline: string | null;
  description: string;
}

export interface FinanceProjectInput {
  clientName: string;
  projectName: string;
  dateStart: string | null;
  dateEnd: string | null;
  totalProject: number;
  status: FinanceProjectStatus;
  notes: string;
  termins: FinanceTerminInput[];
}

export interface FinanceTermin extends FinanceTerminInput {
  id: string;
  termStatus: FinanceTerminStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceProjectRecord {
  id: string;
  clientName: string;
  projectName: string;
  dateStart: string | null;
  dateEnd: string | null;
  totalProject: number;
  status: FinanceProjectStatus;
  notes: string;
  termins: FinanceTermin[];
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
  } | null;
}

export interface FinanceDashboardSummary {
  totalProjects: number;
  totalProjectValue: number;
  totalTerminAmount: number;
  averageTerminPerProject: number;
  byStatus: Array<{
    status: FinanceProjectStatus;
    count: number;
    totalValue: number;
  }>;
}
