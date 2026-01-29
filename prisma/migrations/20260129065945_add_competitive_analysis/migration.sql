-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CompetitiveAnalysis" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "businessNiche" TEXT NOT NULL,
    "businessName" TEXT,
    "location" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "radiusKm" INTEGER,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PROCESSING',
    "depth" TEXT NOT NULL DEFAULT 'STANDARD',
    "competitors" JSONB NOT NULL,
    "totalFound" INTEGER NOT NULL DEFAULT 0,
    "seoInsights" JSONB,
    "rankings" JSONB,
    "recommendations" JSONB,
    "processingTimeMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitiveAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompetitiveAnalysis_accountId_idx" ON "CompetitiveAnalysis"("accountId");

-- CreateIndex
CREATE INDEX "CompetitiveAnalysis_status_idx" ON "CompetitiveAnalysis"("status");

-- CreateIndex
CREATE INDEX "CompetitiveAnalysis_businessNiche_idx" ON "CompetitiveAnalysis"("businessNiche");

-- CreateIndex
CREATE INDEX "CompetitiveAnalysis_accountId_status_idx" ON "CompetitiveAnalysis"("accountId", "status");

-- CreateIndex
CREATE INDEX "CompetitiveAnalysis_createdAt_idx" ON "CompetitiveAnalysis"("createdAt");

-- AddForeignKey
ALTER TABLE "CompetitiveAnalysis" ADD CONSTRAINT "CompetitiveAnalysis_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
