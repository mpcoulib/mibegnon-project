-- Donations: no public API access — server (Prisma/postgres owner) only.
ALTER TABLE "donations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "stripe_webhook_events" ENABLE ROW LEVEL SECURITY;
