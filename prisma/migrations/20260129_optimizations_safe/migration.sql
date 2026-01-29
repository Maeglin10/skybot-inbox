-- =====================================================
-- SAFE DATABASE OPTIMIZATIONS
-- Only adds new features without modifying existing constraints
-- =====================================================

-- Enable PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- =====================================================
-- 1. MESSAGE STATUS ENUM
-- =====================================================

DO $$ BEGIN
  CREATE TYPE "MessageStatus" AS ENUM ('SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. ADD MESSAGE COLUMNS
-- =====================================================

-- Delivery tracking
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS status "MessageStatus" DEFAULT 'SENT';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "failedReason" TEXT;

-- Editing support
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "originalText" TEXT;

-- Soft deletion
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- Threading support
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "replyToMessageId" TEXT;

-- Optimistic locking
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Full-text search
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- =====================================================
-- 3. ADD CONVERSATION COLUMNS
-- =====================================================

ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "messageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "participantCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "unreadCount" INTEGER NOT NULL DEFAULT 0;

-- =====================================================
-- 4. CONVERSATION PARTICIPANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "ConversationParticipant" (
  id TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "userAccountId" TEXT NOT NULL,
  "lastReadMessageId" TEXT,
  "lastReadAt" TIMESTAMP(3),
  "unreadCount" INTEGER NOT NULL DEFAULT 0,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "leftAt" TIMESTAMP(3),
  muted BOOLEAN NOT NULL DEFAULT false,
  "mutedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

-- Add foreign keys if table was just created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConversationParticipant_conversationId_fkey'
  ) THEN
    ALTER TABLE "ConversationParticipant"
      ADD CONSTRAINT "ConversationParticipant_conversationId_fkey"
      FOREIGN KEY ("conversationId") REFERENCES "Conversation"(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConversationParticipant_userAccountId_fkey'
  ) THEN
    ALTER TABLE "ConversationParticipant"
      ADD CONSTRAINT "ConversationParticipant_userAccountId_fkey"
      FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConversationParticipant_conversationId_userAccountId_key'
  ) THEN
    ALTER TABLE "ConversationParticipant"
      ADD CONSTRAINT "ConversationParticipant_conversationId_userAccountId_key"
      UNIQUE ("conversationId", "userAccountId");
  END IF;
END $$;

-- =====================================================
-- 5. PRESENCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "Presence" (
  id TEXT PRIMARY KEY,
  "userAccountId" TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'offline',
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "currentConversationId" TEXT,
  "isTypingInConversation" TEXT,
  "socketId" TEXT,
  "deviceInfo" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

-- Add foreign key if table was just created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Presence_userAccountId_fkey'
  ) THEN
    ALTER TABLE "Presence"
      ADD CONSTRAINT "Presence_userAccountId_fkey"
      FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =====================================================
-- 6. ADD FOREIGN KEY FOR MESSAGE REPLY
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Message_replyToMessageId_fkey'
  ) THEN
    ALTER TABLE "Message"
      ADD CONSTRAINT "Message_replyToMessageId_fkey"
      FOREIGN KEY ("replyToMessageId") REFERENCES "Message"(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- 7. FULL-TEXT SEARCH TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION message_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.text, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_search_update ON "Message";
CREATE TRIGGER message_search_update
  BEFORE INSERT OR UPDATE ON "Message"
  FOR EACH ROW EXECUTE FUNCTION message_search_trigger();

-- Backfill search_vector
UPDATE "Message" SET search_vector = to_tsvector('english', COALESCE(text, ''))
WHERE search_vector IS NULL AND text IS NOT NULL;

-- =====================================================
-- 8. MESSAGE COUNT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_message_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "Conversation"
    SET "messageCount" = "messageCount" + 1,
        "lastActivityAt" = NEW.timestamp
    WHERE id = NEW."conversationId";
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "Conversation"
    SET "messageCount" = GREATEST("messageCount" - 1, 0)
    WHERE id = OLD."conversationId";
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation_message_count ON "Message";
CREATE TRIGGER trg_update_conversation_message_count
  AFTER INSERT OR DELETE ON "Message"
  FOR EACH ROW EXECUTE FUNCTION update_conversation_message_count();

-- Backfill message counts
UPDATE "Conversation" c
SET "messageCount" = (
  SELECT COUNT(*) FROM "Message" m WHERE m."conversationId" = c.id
);

-- =====================================================
-- 9. AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION audit_trigger() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO "AuditLog" (action, "userId", "accountId", metadata)
    VALUES (
      TG_TABLE_NAME || '_deleted',
      NULLIF(current_setting('app.current_user_id', true), ''),
      NULLIF(current_setting('app.current_account_id', true), ''),
      jsonb_build_object('deleted_record', row_to_json(OLD))
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO "AuditLog" (action, "userId", "accountId", metadata)
    VALUES (
      TG_TABLE_NAME || '_updated',
      NULLIF(current_setting('app.current_user_id', true), ''),
      NULLIF(current_setting('app.current_account_id', true), ''),
      jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO "AuditLog" (action, "userId", "accountId", metadata)
    VALUES (
      TG_TABLE_NAME || '_created',
      NULLIF(current_setting('app.current_user_id', true), ''),
      NULLIF(current_setting('app.current_account_id', true), ''),
      jsonb_build_object('new_record', row_to_json(NEW))
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
DROP TRIGGER IF EXISTS audit_user_account ON "UserAccount";
CREATE TRIGGER audit_user_account
  AFTER INSERT OR UPDATE OR DELETE ON "UserAccount"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_integration ON "Integration";
CREATE TRIGGER audit_integration
  AFTER INSERT OR UPDATE OR DELETE ON "Integration"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_api_key ON "ApiKey";
CREATE TRIGGER audit_api_key
  AFTER INSERT OR UPDATE OR DELETE ON "ApiKey"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- =====================================================
-- 10. CREATE INDEXES
-- =====================================================

-- Message indexes
CREATE INDEX IF NOT EXISTS "Message_status_idx" ON "Message"(status);
CREATE INDEX IF NOT EXISTS "Message_replyToMessageId_idx" ON "Message"("replyToMessageId");
CREATE INDEX IF NOT EXISTS "Message_search_vector_idx" ON "Message" USING gin(search_vector);
CREATE INDEX IF NOT EXISTS "Message_conversationId_timestamp_direction_idx" ON "Message" ("conversationId", timestamp DESC, direction);

-- ConversationParticipant indexes
CREATE INDEX IF NOT EXISTS "ConversationParticipant_conversationId_idx" ON "ConversationParticipant"("conversationId");
CREATE INDEX IF NOT EXISTS "ConversationParticipant_userAccountId_idx" ON "ConversationParticipant"("userAccountId");
CREATE INDEX IF NOT EXISTS "ConversationParticipant_userAccountId_unreadCount_idx" ON "ConversationParticipant"("userAccountId", "unreadCount");

-- Presence indexes
CREATE INDEX IF NOT EXISTS "Presence_userAccountId_idx" ON "Presence"("userAccountId");
CREATE INDEX IF NOT EXISTS "Presence_status_idx" ON "Presence"(status);
CREATE INDEX IF NOT EXISTS "Presence_lastSeenAt_idx" ON "Presence"("lastSeenAt");

-- Conversation composite index
CREATE INDEX IF NOT EXISTS "Conversation_inboxId_status_lastActivityAt_idx" ON "Conversation" ("inboxId", status, "lastActivityAt" DESC);

-- JSONB indexes
CREATE INDEX IF NOT EXISTS "ClientConfig_allowedAgents_idx" ON "ClientConfig" USING gin("allowedAgents");
CREATE INDEX IF NOT EXISTS "ClientConfig_channels_idx" ON "ClientConfig" USING gin(channels);
CREATE INDEX IF NOT EXISTS "Account_features_idx" ON "Account" USING gin(features);

-- =====================================================
-- 11. ANALYZE TABLES
-- =====================================================

ANALYZE "Message";
ANALYZE "Conversation";
ANALYZE "ConversationParticipant";
ANALYZE "Presence";

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
