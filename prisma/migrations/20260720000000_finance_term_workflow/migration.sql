CREATE TYPE "TermStatus" AS ENUM ('TO_INVOICE', 'OPEN_INVOICE', 'OUTSTANDING', 'PAID');

ALTER TABLE "finance_termins"
ADD COLUMN IF NOT EXISTS "termStatus" "TermStatus" NOT NULL DEFAULT 'TO_INVOICE',
ADD COLUMN IF NOT EXISTS "termOfPaymentDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "paymentDeadline" TIMESTAMPTZ;

UPDATE "finance_termins"
SET "termStatus" = CASE
    WHEN "disbursementStatus" = 'DISBURSED' THEN 'PAID'::"TermStatus"
    WHEN "billingStatus" = 'BILLABLE' THEN 'OPEN_INVOICE'::"TermStatus"
    ELSE 'TO_INVOICE'::"TermStatus"
END;

UPDATE "finance_termins"
SET "termOfPaymentDays" = 0
WHERE "termOfPaymentDays" IS NULL;

UPDATE "finance_termins"
SET "paymentDeadline" = NULL
WHERE "paymentDeadline" IS NULL;

CREATE TABLE IF NOT EXISTS "finance_termin_audits" (
    "id" TEXT NOT NULL,
    "financeTerminId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "TermStatus",
    "toStatus" "TermStatus",
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "finance_termin_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "finance_termin_audits_financeTerminId_idx" ON "finance_termin_audits"("financeTerminId");
CREATE INDEX IF NOT EXISTS "finance_termin_audits_userId_idx" ON "finance_termin_audits"("userId");
CREATE INDEX IF NOT EXISTS "finance_termin_audits_action_idx" ON "finance_termin_audits"("action");
CREATE INDEX IF NOT EXISTS "finance_termin_audits_createdAt_idx" ON "finance_termin_audits"("createdAt");

ALTER TABLE "finance_termin_audits"
ADD CONSTRAINT "finance_termin_audits_financeTerminId_fkey"
FOREIGN KEY ("financeTerminId") REFERENCES "finance_termins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "finance_termin_audits"
ADD CONSTRAINT "finance_termin_audits_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
