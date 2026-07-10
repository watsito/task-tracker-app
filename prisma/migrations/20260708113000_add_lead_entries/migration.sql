CREATE TABLE IF NOT EXISTS "lead_entries" (
  "id" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "jobTitle" TEXT NOT NULL,
  "infoSource" TEXT NOT NULL,
  "leadSourceId" TEXT NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_entries_channel_idx" ON "lead_entries"("channel");
CREATE INDEX IF NOT EXISTS "lead_entries_leadSourceId_idx" ON "lead_entries"("leadSourceId");
CREATE INDEX IF NOT EXISTS "lead_entries_createdById_idx" ON "lead_entries"("createdById");
CREATE INDEX IF NOT EXISTS "lead_entries_createdAt_idx" ON "lead_entries"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_entries_leadSourceId_fkey'
  ) THEN
    ALTER TABLE "lead_entries"
      ADD CONSTRAINT "lead_entries_leadSourceId_fkey"
      FOREIGN KEY ("leadSourceId") REFERENCES "lead_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_entries_createdById_fkey'
  ) THEN
    ALTER TABLE "lead_entries"
      ADD CONSTRAINT "lead_entries_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
