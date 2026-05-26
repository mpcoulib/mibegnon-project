-- Enable Row Level Security and lock down the public REST (anon/authenticated) surface.
--
-- The Next.js app accesses data server-side via Prisma, which connects as the
-- `postgres` (owner) role and therefore BYPASSES RLS. These policies only constrain
-- the public Supabase API key exposed in the browser — they do NOT affect the app's
-- own server-side queries.

-- ── Public catalog: read-only, active rows only ──────────────────────────────
ALTER TABLE "scholarships" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scholarships_public_read" ON "scholarships";
CREATE POLICY "scholarships_public_read" ON "scholarships"
  FOR SELECT TO anon, authenticated
  USING ("isActive" = true);

ALTER TABLE "universities" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "universities_public_read" ON "universities";
CREATE POLICY "universities_public_read" ON "universities"
  FOR SELECT TO anon, authenticated
  USING ("isActive" = true);

-- ── Scholarship submissions: anyone may submit (INSERT), nobody may read back ─
ALTER TABLE "scholarship_submissions" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "submissions_public_insert" ON "scholarship_submissions";
CREATE POLICY "submissions_public_insert" ON "scholarship_submissions"
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ── Personal data: owner-only (authenticated), anon fully denied ─────────────
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_self" ON "users";
CREATE POLICY "users_self" ON "users"
  FOR ALL TO authenticated
  USING (auth.uid()::text = "id")
  WITH CHECK (auth.uid()::text = "id");

ALTER TABLE "bookmarks" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookmarks_owner" ON "bookmarks";
CREATE POLICY "bookmarks_owner" ON "bookmarks"
  FOR ALL TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

ALTER TABLE "saved_scholarships" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_owner" ON "saved_scholarships";
CREATE POLICY "saved_owner" ON "saved_scholarships"
  FOR ALL TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "applications_owner" ON "applications";
CREATE POLICY "applications_owner" ON "applications"
  FOR ALL TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- documents have no userId — ownership is inherited via the parent application.
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_owner" ON "documents";
CREATE POLICY "documents_owner" ON "documents"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "applications" a
      WHERE a."id" = "documents"."applicationId"
        AND a."userId" = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "applications" a
      WHERE a."id" = "documents"."applicationId"
        AND a."userId" = auth.uid()::text
    )
  );
