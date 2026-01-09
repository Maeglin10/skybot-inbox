-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RoutingStatus" AS ENUM ('RECEIVED', 'FORWARDED', 'FAILED');

-- CreateTable
CREATE TABLE "ClientConfig" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT,
    "defaultAgentKey" TEXT NOT NULL DEFAULT 'master-router',
    "allowedAgents" JSONB NOT NULL,
    "channels" JSONB NOT NULL,
    "externalAccounts" JSONB NOT NULL,
    "n8nOverrides" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "agentKey" TEXT,
    "channel" "Channel",
    "externalAccountId" TEXT,
    "conversationId" TEXT,
    "status" "RoutingStatus" NOT NULL DEFAULT 'RECEIVED',
    "latencyMs" INTEGER,
    "error" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientConfig_accountId_idx" ON "ClientConfig"("accountId");

-- CreateIndex
CREATE INDEX "ClientConfig_status_idx" ON "ClientConfig"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ClientConfig_accountId_clientKey_key" ON "ClientConfig"("accountId", "clientKey");

-- CreateIndex
CREATE UNIQUE INDEX "RoutingLog_requestId_key" ON "RoutingLog"("requestId");

-- CreateIndex
CREATE INDEX "RoutingLog_accountId_idx" ON "RoutingLog"("accountId");

-- CreateIndex
CREATE INDEX "RoutingLog_clientKey_idx" ON "RoutingLog"("clientKey");

-- CreateIndex
CREATE INDEX "RoutingLog_status_idx" ON "RoutingLog"("status");

-- CreateIndex
CREATE INDEX "RoutingLog_createdAt_idx" ON "RoutingLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ClientConfig" ADD CONSTRAINT "ClientConfig_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingLog" ADD CONSTRAINT "RoutingLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
