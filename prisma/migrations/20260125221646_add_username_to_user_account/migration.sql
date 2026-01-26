-- AlterTable: Add username column and make email optional
ALTER TABLE "UserAccount" ADD COLUMN "username" TEXT NOT NULL DEFAULT '';
ALTER TABLE "UserAccount" ALTER COLUMN "email" DROP NOT NULL;

-- DropIndex: Remove old email-based unique constraint and index
DROP INDEX "UserAccount_accountId_email_key";
DROP INDEX "UserAccount_email_idx";

-- CreateIndex: Add username-based unique constraint and index
CREATE UNIQUE INDEX "UserAccount_accountId_username_key" ON "UserAccount"("accountId", "username");
CREATE INDEX "UserAccount_username_idx" ON "UserAccount"("username");

-- Remove default after creation (usernames must be explicitly set)
ALTER TABLE "UserAccount" ALTER COLUMN "username" DROP DEFAULT;
