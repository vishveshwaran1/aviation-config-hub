/*
  Warnings:

  - You are about to drop the column `mpd_amm_task_ids` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Service" DROP COLUMN "mpd_amm_task_ids",
ADD COLUMN     "amm_id" TEXT,
ADD COLUMN     "mpd_id" TEXT;
