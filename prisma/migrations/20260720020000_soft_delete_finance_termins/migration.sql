ALTER TABLE "finance_termins"
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "finance_termins_deletedAt_idx"
ON "finance_termins"("deletedAt");
