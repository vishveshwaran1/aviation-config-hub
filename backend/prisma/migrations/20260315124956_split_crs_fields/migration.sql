/*
  Warnings:

  - You are about to drop the column `amo_name_approval` on the `JourneyLog` table. All the data in the column will be lost.
  - You are about to drop the column `crs_sign_stamp` on the `JourneyLog` table. All the data in the column will be lost.
  - You are about to drop the column `lae_name_license` on the `JourneyLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "JourneyLog" DROP COLUMN "amo_name_approval",
DROP COLUMN "crs_sign_stamp",
DROP COLUMN "lae_name_license",
ADD COLUMN     "amo_approval" TEXT,
ADD COLUMN     "amo_name" TEXT,
ADD COLUMN     "crs_signature" TEXT NOT NULL DEFAULT 'No',
ADD COLUMN     "digital_stamp" TEXT NOT NULL DEFAULT 'No',
ADD COLUMN     "lae_license" TEXT,
ADD COLUMN     "lae_name" TEXT;
