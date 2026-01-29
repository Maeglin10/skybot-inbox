-- =====================================================
-- DATABASE OPTIMIZATIONS MIGRATION
-- Based on research of Cal.com, Supabase, Chatwoot, etc.
-- =====================================================

-- Enable PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- Trigram similarity for fuzzy search
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- For exclusion constraints
CREATE EXTENSION IF NOT EXISTS unaccent;     -- Remove accents for search

-- =====================================================
-- 1. PARTIAL INDEXES (40-60% smaller, faster queries)
-- =====================================================

-- Active conversations only (excludes CLOSED)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_active
ON "Conversation" (inbox_id, last_activity_at)
WHERE status IN ('OPEN', 'PENDING');

-- Non-revoked refresh tokens (active sessions)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_active
ON "RefreshToken" (user_account_id, expires_at)
WHERE revoked_at IS NULL AND expires_at > NOW();

-- High-priority open alerts (most queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_high_priority_open
ON "Alert" (account_id, created_at)
WHERE status = 'OPEN' AND priority = 'HIGH';

-- Active integrations health check
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integrations_active_health
ON "Integration" (tenant_id, last_health_check)
WHERE status = 'ACTIVE';

-- Corporate contacts for filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_corporate
ON "Contact" (account_id, inbox_id, phone)
WHERE is_corporate = true;

-- =====================================================
-- 2. EXPRESSION INDEXES (computed values)
-- =====================================================

-- Normalized phone numbers (remove +, spaces, dashes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_phone_normalized
ON "Contact" (REGEXP_REPLACE(phone, '[^0-9]', '', 'g'));

-- Lowercase email for case-insensitive search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_accounts_email_lower
ON "UserAccount" (LOWER(email)) WHERE email IS NOT NULL;

-- Message text length (for analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_text_length
ON "Message" (LENGTH(text)) WHERE text IS NOT NULL;

-- =====================================================
-- 3. CHECK CONSTRAINTS (data integrity at DB level)
-- =====================================================

-- Ensure phone numbers start with +
ALTER TABLE "Contact" ADD CONSTRAINT chk_contact_phone_format
CHECK (phone ~ '^\+[0-9]+$');

-- Ensure corporate numbers start with +
ALTER TABLE "CorporateNumber" ADD CONSTRAINT chk_corporate_phone_format
CHECK (phone ~ '^\+[0-9]+$');

-- Ensure rating is between 1-5
ALTER TABLE "Feedback" ADD CONSTRAINT chk_feedback_rating_range
CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Ensure alert amount is positive
ALTER TABLE "Alert" ADD CONSTRAINT chk_alert_amount_positive
CHECK (amount IS NULL OR amount >= 0);

-- Ensure media size is positive
ALTER TABLE "Media" ADD CONSTRAINT chk_media_size_positive
CHECK (size IS NULL OR size > 0);

-- Ensure refresh token expires in the future at creation
ALTER TABLE "RefreshToken" ADD CONSTRAINT chk_refresh_token_future_expiry
CHECK (expires_at > created_at);

-- Ensure story expiry is after publishing
ALTER TABLE "Story" ADD CONSTRAINT chk_story_expiry_after_publish
CHECK (expires_at IS NULL OR published_at IS NULL OR expires_at > published_at);

-- =====================================================
-- 4. CONVERSATION PARTICIPANTS (read receipts)
-- =====================================================

CREATE TABLE IF NOT EXISTS "ConversationParticipant" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversation_id TEXT NOT NULL,
  user_account_id TEXT NOT NULL,

  -- Read receipt tracking
  last_read_message_id TEXT,
  last_read_at TIMESTAMP(3),

  -- Cached unread count for performance
  unread_count INTEGER NOT NULL DEFAULT 0,

  -- Presence in conversation
  joined_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP(3),

  -- Notification preferences
  muted BOOLEAN NOT NULL DEFAULT false,
  muted_until TIMESTAMP(3),

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES "Conversation"(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_account FOREIGN KEY (user_account_id) REFERENCES "UserAccount"(id) ON DELETE CASCADE,
  CONSTRAINT uq_conversation_participant UNIQUE (conversation_id, user_account_id)
);

-- Indexes for ConversationParticipant
CREATE INDEX IF NOT EXISTS idx_conversation_participant_conversation ON "ConversationParticipant"(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participant_user ON "ConversationParticipant"(user_account_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participant_unread ON "ConversationParticipant"(user_account_id, unread_count) WHERE unread_count > 0;

-- =====================================================
-- 5. MESSAGE STATUS & DELIVERY TRACKING
-- =====================================================

-- Add message status enum
DO $$ BEGIN
  CREATE TYPE "MessageStatus" AS ENUM ('SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add message columns
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS status "MessageStatus" DEFAULT 'SENT';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS read_at TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS failed_reason TEXT;

-- Message editing support
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS original_text TEXT;

-- Soft deletion
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- Threading support
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS reply_to_message_id TEXT;
ALTER TABLE "Message" ADD CONSTRAINT fk_message_reply_to FOREIGN KEY (reply_to_message_id) REFERENCES "Message"(id) ON DELETE SET NULL;

-- Optimistic locking
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Indexes for new message columns
CREATE INDEX IF NOT EXISTS idx_messages_status ON "Message"(status) WHERE status != 'SENT';
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON "Message"(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted ON "Message"(conversation_id, timestamp) WHERE deleted_at IS NULL;

-- =====================================================
-- 6. FULL-TEXT SEARCH FOR MESSAGES
-- =====================================================

-- Add tsvector column for full-text search
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for full-text search (fast lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_search
ON "Message" USING gin(search_vector);

-- Trigger to auto-update search_vector
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

-- Backfill search_vector for existing messages
UPDATE "Message" SET search_vector = to_tsvector('english', COALESCE(text, '')) WHERE search_vector IS NULL;

-- =====================================================
-- 7. PRESENCE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS "Presence" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_account_id TEXT NOT NULL,

  -- Online status
  status TEXT NOT NULL DEFAULT 'offline', -- online, away, busy, offline
  last_seen_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),

  -- Current activity
  current_conversation_id TEXT,
  is_typing_in_conversation TEXT,

  -- Connection info
  socket_id TEXT,
  device_info JSONB,

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_presence_user FOREIGN KEY (user_account_id) REFERENCES "UserAccount"(id) ON DELETE CASCADE,
  CONSTRAINT uq_presence_user UNIQUE (user_account_id)
);

-- Indexes for Presence
CREATE INDEX IF NOT EXISTS idx_presence_user ON "Presence"(user_account_id);
CREATE INDEX IF NOT EXISTS idx_presence_status ON "Presence"(status) WHERE status = 'online';
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON "Presence"(last_seen_at);

-- =====================================================
-- 8. AUDIT TRAIL TRIGGER (auto-logging)
-- =====================================================

-- Create audit trigger for sensitive tables
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO "AuditLog" (action, user_id, account_id, metadata)
    VALUES (
      TG_TABLE_NAME || '_deleted',
      NULLIF(current_setting('app.current_user_id', true), ''),
      NULLIF(current_setting('app.current_account_id', true), ''),
      jsonb_build_object('deleted_record', row_to_json(OLD))
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO "AuditLog" (action, user_id, account_id, metadata)
    VALUES (
      TG_TABLE_NAME || '_updated',
      NULLIF(current_setting('app.current_user_id', true), ''),
      NULLIF(current_setting('app.current_account_id', true), ''),
      jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO "AuditLog" (action, user_id, account_id, metadata)
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

-- Apply audit trigger to sensitive tables
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
-- 9. MATERIALIZED VIEW FOR DASHBOARD METRICS
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_account_metrics AS
SELECT
  a.id as account_id,
  a.name as account_name,
  a.tier,
  a.status,

  -- Conversation metrics
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(DISTINCT CASE WHEN c.status = 'OPEN' THEN c.id END) as open_conversations,

  -- Message metrics
  COUNT(DISTINCT m.id) as total_messages,
  COUNT(DISTINCT CASE WHEN m.direction = 'IN' THEN m.id END) as messages_received,
  COUNT(DISTINCT CASE WHEN m.direction = 'OUT' THEN m.id END) as messages_sent,

  -- Contact metrics
  COUNT(DISTINCT co.id) as total_contacts,
  COUNT(DISTINCT CASE WHEN co.is_corporate = true THEN co.id END) as corporate_contacts,

  -- Alert metrics
  COUNT(DISTINCT al.id) as total_alerts,
  COUNT(DISTINCT CASE WHEN al.status = 'OPEN' THEN al.id END) as open_alerts,

  -- User metrics
  COUNT(DISTINCT ua.id) as total_users,
  COUNT(DISTINCT CASE WHEN ua.status = 'ACTIVE' THEN ua.id END) as active_users,

  -- Latest activity
  MAX(c.last_activity_at) as last_conversation_activity,
  MAX(m.timestamp) as last_message_at,

  -- Computed at
  NOW() as computed_at

FROM "Account" a
LEFT JOIN "Conversation" c ON c.inbox_id = ANY(SELECT id FROM "Inbox" WHERE account_id = a.id)
LEFT JOIN "Message" m ON m.conversation_id = c.id
LEFT JOIN "Contact" co ON co.account_id = a.id
LEFT JOIN "Alert" al ON al.account_id = a.id
LEFT JOIN "UserAccount" ua ON ua.account_id = a.id
GROUP BY a.id, a.name, a.tier, a.status;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_account_metrics_account_id ON mv_account_metrics(account_id);
CREATE INDEX IF NOT EXISTS idx_mv_account_metrics_tier ON mv_account_metrics(tier);
CREATE INDEX IF NOT EXISTS idx_mv_account_metrics_open_conv ON mv_account_metrics(open_conversations);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_account_metrics() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_account_metrics;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. CONVERSATION METRICS (cached aggregates)
-- =====================================================

-- Add cached metrics to Conversation table
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS message_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS participant_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0;

-- Trigger to update message count
CREATE OR REPLACE FUNCTION update_conversation_message_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "Conversation"
    SET message_count = message_count + 1,
        last_activity_at = NEW.timestamp
    WHERE id = NEW.conversation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "Conversation"
    SET message_count = GREATEST(message_count - 1, 0)
    WHERE id = OLD.conversation_id;
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
SET message_count = (
  SELECT COUNT(*) FROM "Message" m WHERE m.conversation_id = c.id
);

-- =====================================================
-- 11. COMPOSITE INDEXES (multi-column queries)
-- =====================================================

-- Conversation inbox + status + activity (inbox view with filters)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_inbox_status_activity
ON "Conversation" (inbox_id, status, last_activity_at DESC);

-- Message conversation + timestamp + direction (timeline view)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_conversation_time_dir
ON "Message" (conversation_id, timestamp DESC, direction);

-- Alert account + status + priority + date (alert dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_account_status_priority_date
ON "Alert" (account_id, status, priority, created_at DESC);

-- Lead account + status + temperature (lead pipeline)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_account_status_temp
ON "Lead" (account_id, status, temperature);

-- Feedback account + status + rating (feedback dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_account_status_rating
ON "Feedback" (account_id, status, rating DESC NULLS LAST);

-- =====================================================
-- 12. BTREE_GIST EXCLUSION CONSTRAINTS
-- =====================================================

-- Prevent overlapping active sessions for same user
-- (Only one active refresh token per device)
-- Note: This is commented out as it may be too restrictive
-- ALTER TABLE "RefreshToken" ADD CONSTRAINT excl_active_token_per_device
-- EXCLUDE USING gist (
--   user_account_id WITH =,
--   tstzrange(created_at, COALESCE(revoked_at, 'infinity'::timestamp), '[)') WITH &&
-- ) WHERE (revoked_at IS NULL);

-- =====================================================
-- 13. JSONB OPTIMIZATIONS
-- =====================================================

-- GIN index for ClientConfig JSONB columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_config_allowed_agents
ON "ClientConfig" USING gin(allowed_agents);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_config_channels
ON "ClientConfig" USING gin(channels);

-- GIN index for Account features
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_features
ON "Account" USING gin(features);

-- =====================================================
-- 14. STATISTICS UPDATE (better query planning)
-- =====================================================

-- Increase statistics target for frequently queried columns
ALTER TABLE "Message" ALTER COLUMN conversation_id SET STATISTICS 1000;
ALTER TABLE "Conversation" ALTER COLUMN inbox_id SET STATISTICS 1000;
ALTER TABLE "Message" ALTER COLUMN timestamp SET STATISTICS 1000;
ALTER TABLE "Conversation" ALTER COLUMN last_activity_at SET STATISTICS 1000;

-- =====================================================
-- 15. ANALYZE TABLES (refresh statistics)
-- =====================================================

ANALYZE "Account";
ANALYZE "Conversation";
ANALYZE "Message";
ANALYZE "Contact";
ANALYZE "Alert";
ANALYZE "UserAccount";
ANALYZE "RefreshToken";
ANALYZE "ConversationParticipant";
ANALYZE "Presence";

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
