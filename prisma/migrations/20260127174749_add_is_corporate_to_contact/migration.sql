-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "isCorporate" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Contact_isCorporate_idx" ON "Contact"("isCorporate");
