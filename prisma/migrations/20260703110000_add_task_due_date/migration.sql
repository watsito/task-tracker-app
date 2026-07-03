ALTER TABLE "tasks" ADD COLUMN "dueDate" TIMESTAMP(3);
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");
