import { z } from "zod";

const requiredString = z.string().min(1, "This field is required");
const optionalString = z.string().optional();

// Helper to create a re-entry validation schema
const createReEntrySchema = (fieldName: string, label: string) => {
    return z.object({
        [fieldName]: requiredString,
        [`confirm_${fieldName}`]: requiredString,
    }).refine((data) => data[fieldName] === data[`confirm_${fieldName}`], {
        message: `${label} must match`,
        path: [`confirm_${fieldName}`],
    });
};

export const aircraftSchema = z.object({
    // Optional id for edit mode
    id: z.string().optional(),
    // Section A: Aircraft Setup
    model: requiredString,
    msn: requiredString,
    confirm_msn: requiredString,
    country: requiredString,
    registration_number: requiredString,
    confirm_registration_number: requiredString,
    manufacture_date: requiredString,
    delivery_date: requiredString,
    flight_hours: z.coerce.number().min(0, "Flight hours must be 0 or more"),
    flight_cycles: z.coerce.number().min(0, "Flight cycles must be 0 or more"),
    engines_count: z.coerce.number().min(1),
    aircraft_received_status: z.enum(["New", "Used"]).default("New"),
    status: z.enum(["Active", "Inactive", "Maintenance", "Storage", "Pending", "Declined"]).default("Pending"),

    // Section: Engine 1
    engine1_manufacturer: requiredString,
    engine1_model: requiredString,
    engine1_serial_number: requiredString,
    confirm_engine1_serial_number: requiredString,
    engine1_part_number: requiredString,
    confirm_engine1_part_number: requiredString,
    engine1_status: z.enum(["New", "Used", "N/A"]),
    engine1_manufacture_date: requiredString,
    engine1_hours: z.coerce.number().min(0, "Engine hours must be 0 or more"),
    engine1_cycles: z.coerce.number().min(0, "Engine cycles must be 0 or more"),
    engine1_last_shop_visit: requiredString,

    // Section: Engine 2
    engine2_manufacturer: requiredString,
    engine2_model: requiredString,
    engine2_serial_number: requiredString,
    confirm_engine2_serial_number: requiredString,
    engine2_part_number: requiredString,
    confirm_engine2_part_number: requiredString,
    engine2_status: z.enum(["New", "Used", "N/A"]),
    engine2_manufacture_date: requiredString,
    engine2_hours: z.coerce.number().min(0, "Engine hours must be 0 or more"),
    engine2_cycles: z.coerce.number().min(0, "Engine cycles must be 0 or more"),
    engine2_last_shop_visit: requiredString,

    // Section B: APU Details
    apu_manufacturer: requiredString,
    apu_model: requiredString,
    apu_serial_number: requiredString,
    confirm_apu_serial_number: requiredString,
    apu_part_number: requiredString,
    confirm_apu_part_number: requiredString,
    apu_last_shop_visit: requiredString,
    apu_hours: z.coerce.number().min(0, "APU hours must be 0 or more"),
    apu_cycles: z.coerce.number().min(0, "APU cycles must be 0 or more"),

    // Section C: Main Landing Gear Left
    mlg_left_manufacturer: requiredString,
    mlg_left_model: requiredString,
    mlg_left_serial_number: requiredString,
    confirm_mlg_left_serial_number: requiredString,
    mlg_left_part_number: requiredString,
    confirm_mlg_left_part_number: requiredString,
    mlg_left_shop_visit: requiredString,
    mlg_left_hours: z.coerce.number().min(0, "MLG hours must be 0 or more"),
    mlg_left_cycles: z.coerce.number().min(0, "MLG cycles must be 0 or more"),

    // Section D: Main Landing Gear Right
    mlg_right_manufacturer: requiredString,
    mlg_right_model: requiredString,
    mlg_right_serial_number: requiredString,
    confirm_mlg_right_serial_number: requiredString,
    mlg_right_part_number: requiredString,
    confirm_mlg_right_part_number: requiredString,
    mlg_right_shop_visit: requiredString,
    mlg_right_hours: z.coerce.number().min(0, "MLG hours must be 0 or more"),
    mlg_right_cycles: z.coerce.number().min(0, "MLG cycles must be 0 or more"),

    // Section E: Nose Landing Gear
    nlg_manufacturer: requiredString,
    nlg_model: requiredString,
    nlg_serial_number: requiredString,
    confirm_nlg_serial_number: requiredString,
    nlg_part_number: requiredString,
    confirm_nlg_part_number: requiredString,
    nlg_shop_visit: requiredString,
    nlg_hours: z.coerce.number().min(0, "NLG hours must be 0 or more"),
    nlg_cycles: z.coerce.number().min(0, "NLG cycles must be 0 or more"),
})
    .refine((data) => data.msn === data.confirm_msn, {
        message: "MSN must match",
        path: ["confirm_msn"],
    })
    .refine((data) => data.registration_number === data.confirm_registration_number, {
        message: "Registration ID must match",
        path: ["confirm_registration_number"],
    })
    .refine((data) => data.engine1_serial_number === data.confirm_engine1_serial_number, {
        message: "Engine 1 Serial Number must match",
        path: ["confirm_engine1_serial_number"],
    })
    .refine((data) => data.engine1_part_number === data.confirm_engine1_part_number, {
        message: "Engine 1 Part Number must match",
        path: ["confirm_engine1_part_number"],
    })
    .refine((data) => data.engine2_serial_number === data.confirm_engine2_serial_number, {
        message: "Engine 2 Serial Number must match",
        path: ["confirm_engine2_serial_number"],
    })
    .refine((data) => data.engine2_part_number === data.confirm_engine2_part_number, {
        message: "Engine 2 Part Number must match",
        path: ["confirm_engine2_part_number"],
    })
    .refine((data) => data.apu_serial_number === data.confirm_apu_serial_number, {
        message: "APU Serial Number must match",
        path: ["confirm_apu_serial_number"],
    })
    .refine((data) => data.apu_part_number === data.confirm_apu_part_number, {
        message: "APU Part Number must match",
        path: ["confirm_apu_part_number"],
    })
    .refine((data) => data.mlg_left_serial_number === data.confirm_mlg_left_serial_number, {
        message: "MLG Left Serial No must match",
        path: ["confirm_mlg_left_serial_number"],
    })
    .refine((data) => data.mlg_left_part_number === data.confirm_mlg_left_part_number, {
        message: "MLG Left Part No must match",
        path: ["confirm_mlg_left_part_number"],
    })
    .refine((data) => data.mlg_right_serial_number === data.confirm_mlg_right_serial_number, {
        message: "MLG Right Serial No must match",
        path: ["confirm_mlg_right_serial_number"],
    })
    .refine((data) => data.mlg_right_part_number === data.confirm_mlg_right_part_number, {
        message: "MLG Right Part No must match",
        path: ["confirm_mlg_right_part_number"],
    })
    .refine((data) => data.nlg_serial_number === data.confirm_nlg_serial_number, {
        message: "NLG Serial No must match",
        path: ["confirm_nlg_serial_number"],
    })
    .refine((data) => data.nlg_part_number === data.confirm_nlg_part_number, {
        message: "NLG Part No must match",
        path: ["confirm_nlg_part_number"],
    });

export type AircraftFormData = z.infer<typeof aircraftSchema>;
