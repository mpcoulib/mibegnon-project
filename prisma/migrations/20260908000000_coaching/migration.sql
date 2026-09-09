-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMININ', 'MASCULIN', 'NON_PRECISE');

-- CreateEnum
CREATE TYPE "CoachingStage" AS ENUM ('NOUVEAU', 'PAIEMENT_DEMANDE', 'RECU_ENVOYE', 'PAYE', 'COMPTE_INVITE', 'ACTIF', 'TERMINE', 'REJETE', 'INJOIGNABLE');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('RECU', 'BULLETIN', 'RELEVE', 'LISTE_UNIVERSITES', 'AUTRE');

-- CreateEnum
CREATE TYPE "Uploader" AS ENUM ('ADMIN', 'STUDENT');

-- CreateEnum
CREATE TYPE "NoteVisibility" AS ENUM ('PRIVEE', 'PARTAGEE');

-- CreateEnum
CREATE TYPE "ReceiptDecision" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'REFUSE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'STUDENT';

-- CreateTable
CREATE TABLE "coaching_leads" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "birthDate" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "city" TEXT NOT NULL,
    "educationLevel" "EducationLevel" NOT NULL,
    "institution" TEXT NOT NULL,
    "serie" TEXT,
    "stage" "CoachingStage" NOT NULL DEFAULT 'NOUVEAU',
    "paymentReference" TEXT NOT NULL,
    "amountFcfa" INTEGER NOT NULL DEFAULT 2000,
    "cohort" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaching_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_receipts" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "amountSeen" INTEGER,
    "waveTxId" TEXT,
    "decision" "ReceiptDecision" NOT NULL DEFAULT 'EN_ATTENTE',
    "decisionNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_logs" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "templateId" TEXT,
    "body" TEXT NOT NULL,
    "providerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "error" TEXT,
    "sentBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_events" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "from" "CoachingStage",
    "to" "CoachingStage" NOT NULL,
    "byUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_files" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "uploadedBy" "Uploader" NOT NULL,
    "kind" "FileKind" NOT NULL DEFAULT 'AUTRE',
    "label" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coaching_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_notes" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "visibility" "NoteVisibility" NOT NULL DEFAULT 'PRIVEE',
    "body" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaching_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curated_items" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "universityId" TEXT,
    "scholarshipId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curated_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activation_tokens" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coaching_leads_paymentReference_key" ON "coaching_leads"("paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "coaching_leads_userId_key" ON "coaching_leads"("userId");

-- CreateIndex
CREATE INDEX "coaching_leads_stage_createdAt_idx" ON "coaching_leads"("stage", "createdAt");

-- CreateIndex
CREATE INDEX "coaching_leads_phone_idx" ON "coaching_leads"("phone");

-- CreateIndex
CREATE INDEX "coaching_leads_cohort_idx" ON "coaching_leads"("cohort");

-- CreateIndex
CREATE INDEX "payment_receipts_leadId_idx" ON "payment_receipts"("leadId");

-- CreateIndex
CREATE INDEX "payment_receipts_decision_createdAt_idx" ON "payment_receipts"("decision", "createdAt");

-- CreateIndex
CREATE INDEX "message_logs_leadId_createdAt_idx" ON "message_logs"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "stage_events_leadId_createdAt_idx" ON "stage_events"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "coaching_files_leadId_createdAt_idx" ON "coaching_files"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "coaching_notes_leadId_visibility_createdAt_idx" ON "coaching_notes"("leadId", "visibility", "createdAt");

-- CreateIndex
CREATE INDEX "curated_items_leadId_priority_idx" ON "curated_items"("leadId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "curated_items_leadId_universityId_key" ON "curated_items"("leadId", "universityId");

-- CreateIndex
CREATE UNIQUE INDEX "curated_items_leadId_scholarshipId_key" ON "curated_items"("leadId", "scholarshipId");

-- CreateIndex
CREATE UNIQUE INDEX "activation_tokens_leadId_key" ON "activation_tokens"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "activation_tokens_tokenHash_key" ON "activation_tokens"("tokenHash");

-- AddForeignKey
ALTER TABLE "coaching_leads" ADD CONSTRAINT "coaching_leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "coaching_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "coaching_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_events" ADD CONSTRAINT "stage_events_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "coaching_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_files" ADD CONSTRAINT "coaching_files_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "coaching_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_notes" ADD CONSTRAINT "coaching_notes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "coaching_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curated_items" ADD CONSTRAINT "curated_items_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "coaching_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curated_items" ADD CONSTRAINT "curated_items_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curated_items" ADD CONSTRAINT "curated_items_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "scholarships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activation_tokens" ADD CONSTRAINT "activation_tokens_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "coaching_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── RLS: server-only tables (Prisma/postgres owner). No policies → anon/authenticated denied.
ALTER TABLE "coaching_leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "message_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stage_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coaching_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coaching_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "curated_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activation_tokens" ENABLE ROW LEVEL SECURITY;
