-- Add conversation count columns if they don't exist
ALTER TABLE "Conversation" 
ADD COLUMN IF NOT EXISTS "messageCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "participantCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "unreadCount" INTEGER DEFAULT 0;
