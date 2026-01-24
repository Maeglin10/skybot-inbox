-- CreateIndex
CREATE INDEX "Alert_accountId_status_idx" ON "Alert"("accountId", "status");

-- CreateIndex
CREATE INDEX "Conversation_lastActivityAt_idx" ON "Conversation"("lastActivityAt");

-- CreateIndex
CREATE INDEX "Conversation_status_lastActivityAt_idx" ON "Conversation"("status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "Lead_accountId_status_idx" ON "Lead"("accountId", "status");

-- CreateIndex
CREATE INDEX "Message_timestamp_idx" ON "Message"("timestamp");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "RoutingLog_clientKey_createdAt_idx" ON "RoutingLog"("clientKey", "createdAt");

-- CreateIndex
CREATE INDEX "RoutingLog_status_createdAt_idx" ON "RoutingLog"("status", "createdAt");
