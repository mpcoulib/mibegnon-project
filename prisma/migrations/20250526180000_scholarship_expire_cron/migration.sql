-- Sweep + purge queries: active rows with passed deadline
CREATE INDEX "scholarships_isActive_deadline_idx" ON "scholarships"("isActive", "deadline");

-- Cron observability (Prisma/server only, no public RLS policy)
CREATE TABLE "cron_runs" (
    "id" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "deactivated" INTEGER NOT NULL DEFAULT 0,
    "purged" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cron_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cron_runs_job_createdAt_idx" ON "cron_runs"("job", "createdAt");

ALTER TABLE "cron_runs" ENABLE ROW LEVEL SECURITY;
