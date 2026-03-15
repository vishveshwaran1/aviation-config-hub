-- AlterTable
ALTER TABLE "Aircraft" ADD COLUMN     "initial_flight_cycles" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "initial_flight_hours" DOUBLE PRECISION NOT NULL DEFAULT 0;
