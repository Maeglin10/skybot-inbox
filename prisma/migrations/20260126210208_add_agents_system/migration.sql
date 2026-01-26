-- CreateEnum
CREATE TYPE "ChannelConnectionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'PENDING');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('SALES', 'SUPPORT', 'ANALYTICS', 'HR', 'FINANCE', 'LEGAL', 'CONTENT', 'MARKETPLACE', 'DEVOPS', 'OPERATIONS', 'INTERNAL', 'INTELLIGENCE');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DEPLOYING', 'ERROR', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('SUCCESS', 'ERROR', 'TIMEOUT', 'CANCELLED');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "accountId" TEXT;

-- CreateTable
CREATE TABLE "ChannelConnection" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "channelType" "Channel" NOT NULL,
    "channelIdentifier" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "ChannelConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSync" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'INACTIVE',
    "n8nWorkflowId" TEXT,
    "templatePath" TEXT NOT NULL,
    "configJson" JSONB,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deployedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentLog" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "executionStatus" "ExecutionStatus" NOT NULL,
    "inputMessage" TEXT,
    "outputMessage" TEXT,
    "processingTimeMs" INTEGER NOT NULL,
    "openaiTokensUsed" INTEGER,
    "openaiCostUsd" DECIMAL(10,6),
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChannelConnection_accountId_idx" ON "ChannelConnection"("accountId");

-- CreateIndex
CREATE INDEX "ChannelConnection_channelType_idx" ON "ChannelConnection"("channelType");

-- CreateIndex
CREATE INDEX "ChannelConnection_status_idx" ON "ChannelConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelConnection_accountId_channelType_channelIdentifier_key" ON "ChannelConnection"("accountId", "channelType", "channelIdentifier");

-- CreateIndex
CREATE INDEX "Agent_accountId_idx" ON "Agent"("accountId");

-- CreateIndex
CREATE INDEX "Agent_status_idx" ON "Agent"("status");

-- CreateIndex
CREATE INDEX "Agent_agentType_idx" ON "Agent"("agentType");

-- CreateIndex
CREATE INDEX "Agent_accountId_status_idx" ON "Agent"("accountId", "status");

-- CreateIndex
CREATE INDEX "AgentLog_agentId_idx" ON "AgentLog"("agentId");

-- CreateIndex
CREATE INDEX "AgentLog_accountId_idx" ON "AgentLog"("accountId");

-- CreateIndex
CREATE INDEX "AgentLog_timestamp_idx" ON "AgentLog"("timestamp");

-- CreateIndex
CREATE INDEX "AgentLog_executionStatus_idx" ON "AgentLog"("executionStatus");

-- CreateIndex
CREATE INDEX "AgentLog_agentId_timestamp_idx" ON "AgentLog"("agentId", "timestamp");

-- CreateIndex
CREATE INDEX "AgentLog_accountId_timestamp_idx" ON "AgentLog"("accountId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_accountId_idx" ON "AuditLog"("accountId");

-- AddForeignKey
ALTER TABLE "ChannelConnection" ADD CONSTRAINT "ChannelConnection_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentLog" ADD CONSTRAINT "AgentLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
