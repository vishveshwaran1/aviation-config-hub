-- AlterTable
ALTER TABLE "AircraftComponent" ADD COLUMN "cycle_since_visit" DOUBLE PRECISION;
ALTER TABLE "AircraftComponent" ADD COLUMN "time_since_visit" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "JourneyLog" ADD COLUMN "due_at_cycles" DOUBLE PRECISION;