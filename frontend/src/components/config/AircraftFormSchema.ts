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
    manufacture_date: z.string().optional(),
    delivery_date: z.string().optional(),
    flight_hours: z.coerce.number().min(0),
    flight_cycles: z.coerce.number().min(0),
    engines_count: z.coerce.number().min(1),
    status: z.enum(["Active", "Inactive", "Maintenance", "Storage", "Pending", "Declined"]).default("Pending"),

    // Section B: APU Details
    apu_manufacturer: optionalString,
    apu_model: optionalString,
    apu_serial_number: optionalString,
    confirm_apu_serial_number: optionalString,
    apu_part_number: optionalString,
    confirm_apu_part_number: optionalString,
    apu_last_shop_visit: z.string().optional(),
    apu_hours: z.coerce.number().optional(),
    apu_cycles: z.coerce.number().optional(),

    // Section C: Main Landing Gear Left
    mlg_left_manufacturer: optionalString,
    mlg_left_model: optionalString,
    mlg_left_serial_number: optionalString,
    confirm_mlg_left_serial_number: optionalString,
    mlg_left_part_number: optionalString,
    confirm_mlg_left_part_number: optionalString,
    mlg_left_shop_visit: z.string().optional(),
    mlg_left_hours: z.coerce.number().optional(),
    mlg_left_cycles: z.coerce.number().optional(),

    // Section D: Main Landing Gear Right
    mlg_right_manufacturer: optionalString,
    mlg_right_model: optionalString,
    mlg_right_serial_number: optionalString,
    confirm_mlg_right_serial_number: optionalString,
    mlg_right_part_number: optionalString,
    confirm_mlg_right_part_number: optionalString,
    mlg_right_shop_visit: z.string().optional(),
    mlg_right_hours: z.coerce.number().optional(),
    mlg_right_cycles: z.coerce.number().optional(),

    // Section E: Nose Landing Gear
    nlg_manufacturer: optionalString,
    nlg_model: optionalString,
    nlg_serial_number: optionalString,
    confirm_nlg_serial_number: optionalString,
    nlg_part_number: optionalString,
    confirm_nlg_part_number: optionalString,
    nlg_shop_visit: z.string().optional(),
    nlg_hours: z.coerce.number().optional(),
    nlg_cycles: z.coerce.number().optional(),
})
    .refine((data) => data.msn === data.confirm_msn, {
        message: "MSN must match",
        path: ["confirm_msn"],
    })
    .refine((data) => data.registration_number === data.confirm_registration_number, {
        message: "Registration ID must match",
        path: ["confirm_registration_number"],
    })
    .refine((data) => !data.apu_serial_number || data.apu_serial_number === data.confirm_apu_serial_number, {
        message: "APU Serial Number must match",
        path: ["confirm_apu_serial_number"],
    })
    .refine((data) => !data.apu_part_number || data.apu_part_number === data.confirm_apu_part_number, {
        message: "APU Part Number must match",
        path: ["confirm_apu_part_number"],
    })
    .refine((data) => !data.mlg_left_serial_number || data.mlg_left_serial_number === data.confirm_mlg_left_serial_number, {
        message: "MLG Left Serial No must match",
        path: ["confirm_mlg_left_serial_number"],
    })
    .refine((data) => !data.mlg_left_part_number || data.mlg_left_part_number === data.confirm_mlg_left_part_number, {
        message: "MLG Left Part No must match",
        path: ["confirm_mlg_left_part_number"],
    })
    .refine((data) => !data.mlg_right_serial_number || data.mlg_right_serial_number === data.confirm_mlg_right_serial_number, {
        message: "MLG Right Serial No must match",
        path: ["confirm_mlg_right_serial_number"],
    })
    .refine((data) => !data.mlg_right_part_number || data.mlg_right_part_number === data.confirm_mlg_right_part_number, {
        message: "MLG Right Part No must match",
        path: ["confirm_mlg_right_part_number"],
    })
    .refine((data) => !data.nlg_serial_number || data.nlg_serial_number === data.confirm_nlg_serial_number, {
        message: "NLG Serial No must match",
        path: ["confirm_nlg_serial_number"],
    })
    .refine((data) => !data.nlg_part_number || data.nlg_part_number === data.confirm_nlg_part_number, {
        message: "NLG Part No must match",
        path: ["confirm_nlg_part_number"],
    });

export type AircraftFormData = z.infer<typeof aircraftSchema>;
