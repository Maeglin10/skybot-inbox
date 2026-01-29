-- Cleanup duplicate columns and add statusCode index
-- This migration cleans up snake_case duplicates created by manual SQL migrations

-- Drop duplicate snake_case columns from Conversation table
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "message_count";
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "participant_count";
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "unread_count";

-- Drop duplicate snake_case columns from Message table
ALTER TABLE "Message" DROP COLUMN IF EXISTS "delivered_at";
ALTER TABLE "Message" DROP COLUMN IF EXISTS "read_at";
ALTER TABLE "Message" DROP COLUMN IF EXISTS "failed_reason";
ALTER TABLE "Message" DROP COLUMN IF EXISTS "edited_at";
ALTER TABLE "Message" DROP COLUMN IF EXISTS "original_text";
ALTER TABLE "Message" DROP COLUMN IF EXISTS "deleted_at";
ALTER TABLE "Message" DROP COLUMN IF EXISTS "deleted_by";

-- Drop duplicate foreign key constraint (if it exists)
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "fk_message_reply_to";

-- Drop duplicate reply_to_message_id column
ALTER TABLE "Message" DROP COLUMN IF EXISTS "reply_to_message_id";

-- Add statusCode index to IdempotencyKey for atomic check queries
CREATE INDEX IF NOT EXISTS "IdempotencyKey_statusCode_idx" ON "IdempotencyKey"("statusCode");
