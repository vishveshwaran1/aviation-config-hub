/*
  Warnings:

  - The `next_due_maintenance` column on the `JourneyLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "JourneyLog" DROP COLUMN "next_due_maintenance",
ADD COLUMN     "next_due_maintenance" DOUBLE PRECISION;
