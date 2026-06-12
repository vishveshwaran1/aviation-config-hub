-- CreateTable
CREATE TABLE "OccmHistory" (
    "id" TEXT NOT NULL,
    "component_name" TEXT,
    "part_number" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "manufacturer" TEXT,
    "date_of_manufacture" TIMESTAMP(3),
    "event_date" TIMESTAMP(3) NOT NULL,
    "action_type" TEXT NOT NULL,
    "ac_reg_facility" TEXT,
    "airframe_total_time" TEXT,
    "component_tsn_csn" TEXT,
    "component_tso_cso" TEXT,
    "doc_ref_details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OccmHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OccmHistory_part_number_serial_number_idx" ON "OccmHistory"("part_number", "serial_number");
