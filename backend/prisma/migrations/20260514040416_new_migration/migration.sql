/*
  Warnings:

  - You are about to drop the column `amm_id` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `mpd_id` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Service" DROP COLUMN "amm_id",
DROP COLUMN "mpd_id",
ADD COLUMN     "compliance_type" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "source_ref" TEXT,
ADD COLUMN     "task_ref" TEXT;
