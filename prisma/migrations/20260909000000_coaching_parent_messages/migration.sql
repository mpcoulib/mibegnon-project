-- AlterTable
ALTER TABLE "coaching_leads" ADD COLUMN "parentPhone" TEXT;

-- AlterTable
ALTER TABLE "message_logs" ADD COLUMN "toPhone" TEXT;
ALTER TABLE "message_logs" ADD COLUMN "toRole" TEXT;
