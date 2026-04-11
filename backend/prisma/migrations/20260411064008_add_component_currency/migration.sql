-- AlterTable
ALTER TABLE "Component" ADD COLUMN     "estimated_currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "quotation_currency" TEXT NOT NULL DEFAULT 'USD';
