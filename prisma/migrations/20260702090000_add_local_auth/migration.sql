ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "users" ADD COLUMN "sessionToken" TEXT;
ALTER TABLE "users" ADD COLUMN "sessionExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "users_sessionToken_key" ON "users"("sessionToken");
