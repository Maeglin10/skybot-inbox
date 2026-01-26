-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('SHOPIFY', 'WHATSAPP', 'AIRTABLE', 'STRIPE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('PENDING', 'ACTIVE', 'ERROR', 'DISABLED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "IngestionJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "KnowledgeType" AS ENUM ('PRODUCT', 'FAQ', 'POLICY', 'CUSTOM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'CLIENT_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'AGENT_USER';

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN     "tier" "Tier" NOT NULL DEFAULT 'STARTER',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TenantModule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "limits" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'PENDING',
    "credentials" TEXT,
    "config" JSONB,
    "lastHealthCheck" TIMESTAMP(3),
    "healthStatus" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateNumber" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "department" TEXT,
    "notes" TEXT,
    "autoRespond" BOOLEAN NOT NULL DEFAULT false,
    "alertOnContact" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "tier" "Tier" NOT NULL DEFAULT 'STARTER',
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageTracking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "source" TEXT,
    "sourceId" TEXT,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "IngestionJobStatus" NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL,
    "source" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsTotal" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "KnowledgeType" NOT NULL DEFAULT 'CUSTOM',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "metadata" JSONB,
    "sourceUrl" TEXT,
    "embedding" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantModule_tenantId_idx" ON "TenantModule"("tenantId");

-- CreateIndex
CREATE INDEX "TenantModule_moduleKey_idx" ON "TenantModule"("moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "TenantModule_tenantId_moduleKey_key" ON "TenantModule"("tenantId", "moduleKey");

-- CreateIndex
CREATE INDEX "Integration_tenantId_idx" ON "Integration"("tenantId");

-- CreateIndex
CREATE INDEX "Integration_provider_idx" ON "Integration"("provider");

-- CreateIndex
CREATE INDEX "Integration_status_idx" ON "Integration"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_tenantId_provider_key" ON "Integration"("tenantId", "provider");

-- CreateIndex
CREATE INDEX "CorporateNumber_tenantId_idx" ON "CorporateNumber"("tenantId");

-- CreateIndex
CREATE INDEX "CorporateNumber_phone_idx" ON "CorporateNumber"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateNumber_tenantId_phone_key" ON "CorporateNumber"("tenantId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_idx" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "UsageTracking_tenantId_idx" ON "UsageTracking"("tenantId");

-- CreateIndex
CREATE INDEX "UsageTracking_metric_idx" ON "UsageTracking"("metric");

-- CreateIndex
CREATE INDEX "UsageTracking_period_idx" ON "UsageTracking"("period");

-- CreateIndex
CREATE UNIQUE INDEX "UsageTracking_tenantId_metric_period_key" ON "UsageTracking"("tenantId", "metric", "period");

-- CreateIndex
CREATE INDEX "Media_tenantId_idx" ON "Media"("tenantId");

-- CreateIndex
CREATE INDEX "Media_type_idx" ON "Media"("type");

-- CreateIndex
CREATE INDEX "Media_source_idx" ON "Media"("source");

-- CreateIndex
CREATE INDEX "Media_sourceId_idx" ON "Media"("sourceId");

-- CreateIndex
CREATE INDEX "IngestionJob_tenantId_idx" ON "IngestionJob"("tenantId");

-- CreateIndex
CREATE INDEX "IngestionJob_status_idx" ON "IngestionJob"("status");

-- CreateIndex
CREATE INDEX "IngestionJob_type_idx" ON "IngestionJob"("type");

-- CreateIndex
CREATE INDEX "IngestionJob_createdAt_idx" ON "IngestionJob"("createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeItem_tenantId_idx" ON "KnowledgeItem"("tenantId");

-- CreateIndex
CREATE INDEX "KnowledgeItem_type_idx" ON "KnowledgeItem"("type");

-- CreateIndex
CREATE INDEX "KnowledgeItem_tags_idx" ON "KnowledgeItem"("tags");

-- CreateIndex
CREATE INDEX "KnowledgeItem_createdAt_idx" ON "KnowledgeItem"("createdAt");

-- CreateIndex
CREATE INDEX "Account_tier_idx" ON "Account"("tier");

-- CreateIndex
CREATE INDEX "Account_status_idx" ON "Account"("status");

-- AddForeignKey
ALTER TABLE "TenantModule" ADD CONSTRAINT "TenantModule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateNumber" ADD CONSTRAINT "CorporateNumber_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageTracking" ADD CONSTRAINT "UsageTracking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeItem" ADD CONSTRAINT "KnowledgeItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
