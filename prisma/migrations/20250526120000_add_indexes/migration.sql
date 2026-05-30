-- Scholarships list filters (isActive + isTranslated + ivoirianEligible)
CREATE INDEX "scholarships_isActive_isTranslated_idx" ON "scholarships"("isActive", "isTranslated");

CREATE INDEX "scholarships_category_idx" ON "scholarships"("category");

CREATE INDEX "scholarships_country_idx" ON "scholarships"("country");

-- Universities list filter
CREATE INDEX "universities_isActive_idx" ON "universities"("isActive");

-- FK lookups (bookmarks, applications, documents, saved favorites)
CREATE INDEX "bookmarks_userId_idx" ON "bookmarks"("userId");

CREATE INDEX "bookmarks_scholarshipId_idx" ON "bookmarks"("scholarshipId");

CREATE INDEX "bookmarks_universityId_idx" ON "bookmarks"("universityId");

CREATE INDEX "applications_userId_idx" ON "applications"("userId");

CREATE INDEX "applications_scholarshipId_idx" ON "applications"("scholarshipId");

CREATE INDEX "applications_universityId_idx" ON "applications"("universityId");

CREATE INDEX "documents_applicationId_idx" ON "documents"("applicationId");

CREATE INDEX "saved_scholarships_userId_idx" ON "saved_scholarships"("userId");
