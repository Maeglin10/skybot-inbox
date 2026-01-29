-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "caption" TEXT,
    "link" TEXT,
    "status" "StoryStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "externalId" TEXT,
    "phoneNumberId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Story_accountId_idx" ON "Story"("accountId");

-- CreateIndex
CREATE INDEX "Story_status_idx" ON "Story"("status");

-- CreateIndex
CREATE INDEX "Story_scheduledAt_idx" ON "Story"("scheduledAt");

-- CreateIndex
CREATE INDEX "Story_accountId_status_idx" ON "Story"("accountId", "status");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
