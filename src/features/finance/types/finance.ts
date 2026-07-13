export type FinanceProjectStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';
export type FinanceBillingStatus = 'NOT_BILLABLE' | 'BILLABLE';
export type FinanceDisbursementStatus = 'NOT_DISBURSED' | 'DISBURSED';

export interface FinanceTerminInput {
  id?: string;
  order: number;
  name: string;
  percentage: number;
  billingDate: string | null;
  description: string;
  billingStatus: FinanceBillingStatus;
  disbursementStatus: FinanceDisbursementStatus;
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
  terminBillingSummary: Array<{
    status: FinanceBillingStatus;
    label: string;
    count: number;
    totalValue: number;
    terminDetails: Array<{
      projectId: string;
      projectName: string;
      count: number;
      totalValue: number;
    }>;
  }>;
  terminDisbursementSummary: Array<{
    status: FinanceDisbursementStatus;
    label: string;
    count: number;
    totalValue: number;
    terminDetails: Array<{
      projectId: string;
      projectName: string;
      count: number;
      totalValue: number;
    }>;
  }>;
}
