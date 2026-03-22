-- AlterTable
ALTER TABLE "JourneyLog" ADD COLUMN     "amo_name_approval" TEXT,
ADD COLUMN     "crs_sign_stamp" TEXT NOT NULL DEFAULT 'No',
ADD COLUMN     "fuel_density" DOUBLE PRECISION,
ADD COLUMN     "hyd_fluid" DOUBLE PRECISION,
ADD COLUMN     "lae_name_license" TEXT,
ADD COLUMN     "transit_inspection" TIMESTAMP(3);
