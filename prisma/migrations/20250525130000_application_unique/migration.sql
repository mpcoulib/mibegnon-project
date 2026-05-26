-- CreateIndex
CREATE UNIQUE INDEX "applications_userId_scholarshipId_key" ON "applications"("userId", "scholarshipId");
