-- 1) créer le type enum (idempotent)
DO $$ BEGIN
  CREATE TYPE "ConversationStatus" AS ENUM ('OPEN','PENDING','CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2) drop le default avant conversion (clé du fix P3006)
ALTER TABLE "Conversation"
  ALTER COLUMN "status" DROP DEFAULT;

-- 3) convertir le type sans perdre les données
ALTER TABLE "Conversation"
  ALTER COLUMN "status" TYPE "ConversationStatus"
  USING ("status"::text::"ConversationStatus");

-- 4) remettre un default compatible enum
ALTER TABLE "Conversation"
  ALTER COLUMN "status" SET DEFAULT 'OPEN'::"ConversationStatus";