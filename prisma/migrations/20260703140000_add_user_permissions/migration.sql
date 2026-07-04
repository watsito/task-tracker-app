-- AlterTable: Add permissions column to users table
ALTER TABLE "users" ADD COLUMN "permissions" JSONB;
