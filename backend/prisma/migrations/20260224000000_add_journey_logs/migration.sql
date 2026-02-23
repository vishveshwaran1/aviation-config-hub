-- CreateTable: JourneyLog
CREATE TABLE "JourneyLog" (
    "id"                     TEXT NOT NULL,
    "aircraft_id"            TEXT NOT NULL,
    "company_name"           TEXT,
    "date"                   TIMESTAMP(3) NOT NULL,
    "registration"           TEXT NOT NULL,
    "aircraft_type"          TEXT,
    "log_sl_no"              TEXT,
    "pic_name"               TEXT NOT NULL,
    "pic_license_no"         TEXT,
    "pic_sign"               TEXT NOT NULL DEFAULT 'No',
    "commander_sign"         TEXT NOT NULL DEFAULT 'No',
    "fuel_arrival"           DOUBLE PRECISION,
    "fuel_departure"         DOUBLE PRECISION,
    "remaining_fuel_onboard" DOUBLE PRECISION,
    "fuel_uplift"            DOUBLE PRECISION,
    "calculate_total_fuel"   DOUBLE PRECISION,
    "fuel_discrepancy"       DOUBLE PRECISION,
    "aircraft_total_hrs"     DOUBLE PRECISION,
    "aircraft_total_cyc"     DOUBLE PRECISION,
    "fuel_flight_deck_gauge" DOUBLE PRECISION,
    "next_due_maintenance"   TIMESTAMP(3),
    "due_at_date"            TIMESTAMP(3),
    "due_at_hours"           DOUBLE PRECISION,
    "total_flight_hrs"       DOUBLE PRECISION,
    "total_flight_cyc"       DOUBLE PRECISION,
    "daily_inspection"       TIMESTAMP(3),
    "type_of_maintenance"    TEXT,
    "apu_hrs"                DOUBLE PRECISION,
    "apu_cyc"                DOUBLE PRECISION,
    "oil_uplift_eng1"        DOUBLE PRECISION,
    "oil_uplift_eng2"        DOUBLE PRECISION,
    "oil_uplift_apu"         DOUBLE PRECISION,
    "daily_inspection_sign"  TEXT NOT NULL DEFAULT 'No',
    "sign_stamp"             TEXT NOT NULL DEFAULT 'No',
    "created_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"             TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: JourneyLogSector
CREATE TABLE "JourneyLogSector" (
    "id"                 TEXT NOT NULL,
    "journey_log_id"     TEXT NOT NULL,
    "sl_no"              INTEGER NOT NULL,
    "flight_num"         TEXT,
    "sector_from"        TEXT,
    "sector_to"          TEXT,
    "on_chock_dep_date"  TEXT,
    "on_chock_dep_time"  TEXT,
    "on_chock_arr_date"  TEXT,
    "on_chock_arr_time"  TEXT,
    "on_chock_duration"  TEXT,
    "off_chock_dep_date" TEXT,
    "off_chock_dep_time" TEXT,
    "off_chock_arr_date" TEXT,
    "off_chock_arr_time" TEXT,
    "off_chock_duration" TEXT,
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JourneyLogSector_pkey" PRIMARY KEY ("id")
);

-- CreateTable: JourneyLogDefect
CREATE TABLE "JourneyLogDefect" (
    "id"                 TEXT NOT NULL,
    "journey_log_id"     TEXT NOT NULL,
    "sl_no"              INTEGER NOT NULL,
    "category"           TEXT NOT NULL DEFAULT 'PIREP',
    "defect_description" TEXT,
    "action_taken"       TEXT,
    "mel_expiry_date"    TEXT,
    "mel_reference"      TEXT,
    "mel_repair_cat"     TEXT,
    "lic_no"             TEXT,
    "part1_description"  TEXT,
    "part1_number_on"    TEXT,
    "part1_number_off"   TEXT,
    "part1_serial_on"    TEXT,
    "part1_serial_off"   TEXT,
    "part1_cert_num"     TEXT,
    "part2_description"  TEXT,
    "part2_number_on"    TEXT,
    "part2_number_off"   TEXT,
    "part2_serial_on"    TEXT,
    "part2_serial_off"   TEXT,
    "part2_cert_num"     TEXT,
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JourneyLogDefect_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JourneyLog" ADD CONSTRAINT "JourneyLog_aircraft_id_fkey"
    FOREIGN KEY ("aircraft_id") REFERENCES "Aircraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyLogSector" ADD CONSTRAINT "JourneyLogSector_journey_log_id_fkey"
    FOREIGN KEY ("journey_log_id") REFERENCES "JourneyLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyLogDefect" ADD CONSTRAINT "JourneyLogDefect_journey_log_id_fkey"
    FOREIGN KEY ("journey_log_id") REFERENCES "JourneyLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
