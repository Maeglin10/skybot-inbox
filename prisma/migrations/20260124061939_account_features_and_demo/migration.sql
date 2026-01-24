-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "features" JSONB,
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Account_isDemo_idx" ON "Account"("isDemo");
