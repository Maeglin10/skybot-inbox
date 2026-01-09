-- CreateTable
CREATE TABLE "ExternalAccount" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "externalId" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalAccount_accountId_idx" ON "ExternalAccount"("accountId");

-- CreateIndex
CREATE INDEX "ExternalAccount_clientKey_idx" ON "ExternalAccount"("clientKey");

-- CreateIndex
CREATE INDEX "ExternalAccount_channel_idx" ON "ExternalAccount"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalAccount_accountId_channel_externalId_key" ON "ExternalAccount"("accountId", "channel", "externalId");

-- AddForeignKey
ALTER TABLE "ExternalAccount" ADD CONSTRAINT "ExternalAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
