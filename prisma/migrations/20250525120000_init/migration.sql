-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('TROISIEME', 'SECONDE', 'PREMIERE', 'TERMINALE', 'BAC_PLUS_1', 'BAC_PLUS_2');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('INTERESSE', 'EN_PREPARATION', 'POSTULE', 'EN_ATTENTE', 'ACCEPTE', 'REFUSE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "educationLevel" "EducationLevel",
    "fieldOfStudy" TEXT,
    "gpa" DOUBLE PRECISION,
    "targetCountries" TEXT[],
    "targetFields" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarships" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isFullFunding" BOOLEAN NOT NULL DEFAULT false,
    "deadline" TIMESTAMP(3),
    "academicLevels" TEXT[],
    "fields" TEXT[],
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "category" TEXT,
    "link" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ivoirianEligible" BOOLEAN NOT NULL DEFAULT true,
    "isTranslated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "ranking" INTEGER,
    "tuitionFee" DOUBLE PRECISION,
    "tuitionCurrency" TEXT NOT NULL DEFAULT 'USD',
    "hasScholarships" BOOLEAN NOT NULL DEFAULT false,
    "fields" TEXT[],
    "description" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scholarshipId" TEXT,
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scholarshipId" TEXT,
    "universityId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'INTERESSE',
    "notes" TEXT,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_scholarships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_submissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "academicLevels" TEXT[],
    "isFullFunding" BOOLEAN NOT NULL DEFAULT false,
    "deadline" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "submitterEmail" TEXT,
    "submitterNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scholarship_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_scholarshipId_key" ON "bookmarks"("userId", "scholarshipId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_universityId_key" ON "bookmarks"("userId", "universityId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_scholarships_userId_scholarshipId_key" ON "saved_scholarships"("userId", "scholarshipId");

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "scholarships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "scholarships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

