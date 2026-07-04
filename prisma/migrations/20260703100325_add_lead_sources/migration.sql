-- CreateTable
CREATE TABLE "lead_sources" (
    "id" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "formType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "monthLabel" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "channels" JSONB NOT NULL,
    "totalLeads" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_sources_team_idx" ON "lead_sources"("team");

-- CreateIndex
CREATE INDEX "lead_sources_formType_idx" ON "lead_sources"("formType");

-- CreateIndex
CREATE INDEX "lead_sources_createdAt_idx" ON "lead_sources"("createdAt");
