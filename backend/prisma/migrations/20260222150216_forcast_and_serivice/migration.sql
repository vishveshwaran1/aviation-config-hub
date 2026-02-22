-- AlterTable
ALTER TABLE "AircraftComponent" ADD COLUMN     "ata" TEXT,
ADD COLUMN     "csi" DOUBLE PRECISION,
ADD COLUMN     "tsi" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "interval_unit" TEXT NOT NULL DEFAULT 'Hours';

-- CreateTable
CREATE TABLE "Forecast" (
    "id" TEXT NOT NULL,
    "aircraft_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "interval_unit" TEXT NOT NULL DEFAULT 'Hours',
    "last_date" TIMESTAMP(3),
    "last_hours" DOUBLE PRECISION,
    "last_cycles" DOUBLE PRECISION,
    "next_date" TIMESTAMP(3),
    "next_hours" DOUBLE PRECISION,
    "next_cycles" DOUBLE PRECISION,
    "remaining_hours" DOUBLE PRECISION,
    "remaining_cycles" DOUBLE PRECISION,
    "avg_hours" DOUBLE PRECISION DEFAULT 10,
    "avg_cycles" DOUBLE PRECISION DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scheduler" (
    "id" TEXT NOT NULL,
    "aircraft_id" TEXT NOT NULL,
    "flight_date" TIMESTAMP(3) NOT NULL,
    "flight_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flight_cycles" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scheduler_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Forecast_aircraft_id_service_id_key" ON "Forecast"("aircraft_id", "service_id");
