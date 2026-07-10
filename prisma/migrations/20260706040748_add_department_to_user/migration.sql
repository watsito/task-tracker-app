-- CreateEnum
CREATE TYPE "Department" AS ENUM ('MARKETING', 'OPERATIONAL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "departments" "Department"[];
