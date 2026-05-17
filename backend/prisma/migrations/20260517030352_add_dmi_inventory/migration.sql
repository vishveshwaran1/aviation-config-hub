-- AlterTable
ALTER TABLE "JourneyLogDefect" ADD COLUMN     "part_availability" TEXT,
ADD COLUMN     "part_required" TEXT;

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "part_number" TEXT NOT NULL,
    "description" TEXT,
    "ata" TEXT,
    "effectivity" TEXT,
    "interchangeable" TEXT,
    "sn_or_batch" TEXT,
    "condition" TEXT,
    "cert_type" TEXT,
    "cure_date" TEXT,
    "on_hand" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reserved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "available" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "min_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lead_time_days" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DMI" (
    "id" TEXT NOT NULL,
    "dmi_number" TEXT NOT NULL,
    "aircraft_id" TEXT NOT NULL,
    "journey_log_id" TEXT,
    "defect_id" TEXT,
    "part_number" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SOURCING',
    "deferral_reason" TEXT,
    "mel_reference" TEXT,
    "mel_category" TEXT,
    "mel_expiry_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DMI_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_part_number_key" ON "Inventory"("part_number");

-- CreateIndex
CREATE UNIQUE INDEX "DMI_dmi_number_key" ON "DMI"("dmi_number");

-- CreateIndex
CREATE UNIQUE INDEX "DMI_defect_id_key" ON "DMI"("defect_id");

-- AddForeignKey
ALTER TABLE "DMI" ADD CONSTRAINT "DMI_defect_id_fkey" FOREIGN KEY ("defect_id") REFERENCES "JourneyLogDefect"("id") ON DELETE SET NULL ON UPDATE CASCADE;
