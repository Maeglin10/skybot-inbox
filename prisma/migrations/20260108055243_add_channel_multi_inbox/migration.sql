/* Multi-inbox: channel + direction enum, backfill existing rows, safe on non-empty DB */

-- Enums
DO $$ BEGIN
  CREATE TYPE "Channel" AS ENUM ('WHATSAPP','INSTAGRAM','FACEBOOK','EMAIL','WEB');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MessageDirection" AS ENUM ('IN','OUT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Inbox: channel (NOT NULL default)
ALTER TABLE "Inbox"
  ADD COLUMN IF NOT EXISTS "channel" "Channel" NOT NULL DEFAULT 'WHATSAPP';

-- Conversation: externalId + channel
ALTER TABLE "Conversation"
  ADD COLUMN IF NOT EXISTS "externalId" TEXT,
  ADD COLUMN IF NOT EXISTS "channel" "Channel" NOT NULL DEFAULT 'WHATSAPP';

-- Message: channel first nullable, then backfill, then set NOT NULL
ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "channel" "Channel";

-- Backfill Message.channel from Conversation.channel when possible
UPDATE "Message" m
SET "channel" = COALESCE(c."channel", 'WHATSAPP')
FROM "Conversation" c
WHERE m."conversationId" = c."id" AND m."channel" IS NULL;

UPDATE "Message"
SET "channel" = 'WHATSAPP'
WHERE "channel" IS NULL;

ALTER TABLE "Message"
  ALTER COLUMN "channel" SET NOT NULL;

-- Convert Message.direction (String -> enum) in-place
ALTER TABLE "Message"
  ALTER COLUMN "direction" TYPE "MessageDirection"
  USING (
    CASE
      WHEN "direction" IN ('OUT','out','OUTBOUND','outbound') THEN 'OUT'::"MessageDirection"
      ELSE 'IN'::"MessageDirection"
    END
  );

-- Drop old unique index/constraint on (conversationId, externalId) if it exists
DROP INDEX IF EXISTS "Message_conversationId_externalId_key";
DROP INDEX IF EXISTS "conv_external_unique";

-- Create indexes
CREATE INDEX IF NOT EXISTS "Inbox_channel_idx" ON "Inbox" ("channel");
CREATE INDEX IF NOT EXISTS "Conversation_channel_idx" ON "Conversation" ("channel");
CREATE INDEX IF NOT EXISTS "Conversation_externalId_idx" ON "Conversation" ("externalId");
CREATE INDEX IF NOT EXISTS "Message_channel_idx" ON "Message" ("channel");

-- Unique constraints for provider ids (allow multiple NULL externalId)
DO $$ BEGIN
  ALTER TABLE "Conversation"
    ADD CONSTRAINT "conversation_channel_externalId_unique"
    UNIQUE ("channel","externalId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Message"
    ADD CONSTRAINT "message_channel_externalId_unique"
    UNIQUE ("channel","externalId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;