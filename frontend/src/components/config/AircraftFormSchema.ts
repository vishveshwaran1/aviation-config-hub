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

const timeString = z.string().regex(/^\d+:[0-5]\d$/, "Format must be HHHH:MM");
const optionalTimeString = z.string().regex(/^\d+:[0-5]\d$/, "Format must be HHHH:MM").optional().or(z.literal(""));

const engineFields = (index: number) => ({
    [`engine${index}_manufacturer`]: z.string().optional().or(z.literal("")),
    [`engine${index}_model`]: z.string().optional().or(z.literal("")),
    [`engine${index}_serial_number`]: z.string().optional().or(z.literal("")),
    [`confirm_engine${index}_serial_number`]: z.string().optional().or(z.literal("")),
    [`engine${index}_part_number`]: z.string().optional().or(z.literal("")),
    [`confirm_engine${index}_part_number`]: z.string().optional().or(z.literal("")),
    [`engine${index}_status`]: z.enum(["New", "Used", "N/A"]).optional(),
    [`engine${index}_manufacture_date`]: z.string().optional().or(z.literal("")),
    [`engine${index}_hours`]: optionalTimeString,
    [`engine${index}_cycles`]: z.coerce.number().min(0).optional(),
    [`engine${index}_last_shop_visit`]: z.string().optional().or(z.literal("")),
});

export const aircraftSchema = z.object({
    id: z.string().optional(),
    model: requiredString,
    msn: requiredString,
    confirm_msn: requiredString,
    country: z.string().nullish(),
    registration_number: requiredString,
    confirm_registration_number: requiredString,
    manufacture_date: requiredString,
    delivery_date: requiredString,
    flight_hours: timeString,
    flight_cycles: z.coerce.number().min(0, "Flight cycles must be 0 or more"),
    engines_count: z.coerce.number().min(1).max(4),
    aircraft_received_status: z.enum(["New", "Used"]).default("New"),
    status: z.enum(["Active", "Inactive", "Maintenance", "Storage", "Pending", "Declined"]).default("Pending"),

    // Engine 1
    engine1_manufacturer: optionalString,
    engine1_model: optionalString,
    engine1_serial_number: optionalString,
    confirm_engine1_serial_number: optionalString,
    engine1_part_number: optionalString,
    confirm_engine1_part_number: optionalString,
    engine1_status: z.enum(["New", "Used", "N/A"]).optional(),
    engine1_manufacture_date: optionalString,
    engine1_hours: optionalTimeString,
    engine1_cycles: z.coerce.number().min(0).optional(),
    engine1_last_shop_visit: optionalString,

    // Engine 2
    engine2_manufacturer: optionalString,
    engine2_model: optionalString,
    engine2_serial_number: optionalString,
    confirm_engine2_serial_number: optionalString,
    engine2_part_number: optionalString,
    confirm_engine2_part_number: optionalString,
    engine2_status: z.enum(["New", "Used", "N/A"]).optional(),
    engine2_manufacture_date: optionalString,
    engine2_hours: optionalTimeString,
    engine2_cycles: z.coerce.number().min(0).optional(),
    engine2_last_shop_visit: optionalString,

    // Engine 3
    engine3_manufacturer: optionalString,
    engine3_model: optionalString,
    engine3_serial_number: optionalString,
    confirm_engine3_serial_number: optionalString,
    engine3_part_number: optionalString,
    confirm_engine3_part_number: optionalString,
    engine3_status: z.enum(["New", "Used", "N/A"]).optional(),
    engine3_manufacture_date: optionalString,
    engine3_hours: optionalTimeString,
    engine3_cycles: z.coerce.number().min(0).optional(),
    engine3_last_shop_visit: optionalString,

    // Engine 4
    engine4_manufacturer: optionalString,
    engine4_model: optionalString,
    engine4_serial_number: optionalString,
    confirm_engine4_serial_number: optionalString,
    engine4_part_number: optionalString,
    confirm_engine4_part_number: optionalString,
    engine4_status: z.enum(["New", "Used", "N/A"]).optional(),
    engine4_manufacture_date: optionalString,
    engine4_hours: optionalTimeString,
    engine4_cycles: z.coerce.number().min(0).optional(),
    engine4_last_shop_visit: optionalString,

    // APU Details
    apu_manufacturer: requiredString,
    apu_model: requiredString,
    apu_serial_number: requiredString,
    confirm_apu_serial_number: requiredString,
    apu_part_number: requiredString,
    confirm_apu_part_number: requiredString,
    apu_status: z.enum(["New", "Used", "N/A"]).default("Used"),
    apu_manufacture_date: requiredString,
    apu_last_shop_visit: optionalString,
    apu_hours: timeString,
    apu_cycles: z.coerce.number().min(0, "APU cycles must be 0 or more"),

    // Main Landing Gear Left
    mlg_left_manufacturer: requiredString,
    mlg_left_model: requiredString,
    mlg_left_serial_number: requiredString,
    confirm_mlg_left_serial_number: requiredString,
    mlg_left_part_number: requiredString,
    confirm_mlg_left_part_number: requiredString,
    mlg_left_status: z.enum(["New", "Used", "N/A"]).default("Used"),
    mlg_left_manufacture_date: requiredString,
    mlg_left_shop_visit: optionalString,
    mlg_left_hours: timeString,
    mlg_left_cycles: z.coerce.number().min(0, "MLG cycles must be 0 or more"),

    // Main Landing Gear Right
    mlg_right_manufacturer: requiredString,
    mlg_right_model: requiredString,
    mlg_right_serial_number: requiredString,
    confirm_mlg_right_serial_number: requiredString,
    mlg_right_part_number: requiredString,
    confirm_mlg_right_part_number: requiredString,
    mlg_right_status: z.enum(["New", "Used", "N/A"]).default("Used"),
    mlg_right_manufacture_date: requiredString,
    mlg_right_shop_visit: optionalString,
    mlg_right_hours: timeString,
    mlg_right_cycles: z.coerce.number().min(0, "MLG cycles must be 0 or more"),

    // Nose Landing Gear
    nlg_manufacturer: requiredString,
    nlg_model: requiredString,
    nlg_serial_number: requiredString,
    confirm_nlg_serial_number: requiredString,
    nlg_part_number: requiredString,
    confirm_nlg_part_number: requiredString,
    nlg_status: z.enum(["New", "Used", "N/A"]).default("Used"),
    nlg_manufacture_date: requiredString,
    nlg_shop_visit: optionalString,
    nlg_hours: timeString,
    nlg_cycles: z.coerce.number().min(0, "NLG cycles must be 0 or more"),
})
    .superRefine((data, ctx) => {
        // ... (refinement logic stays same)
        if (data.msn !== data.confirm_msn) {
            ctx.addIssue({ code: "custom", message: "MSN must match", path: ["confirm_msn"] });
        }
        if (data.registration_number !== data.confirm_registration_number) {
            ctx.addIssue({ code: "custom", message: "Registration ID must match", path: ["confirm_registration_number"] });
        }

        for (let i = 1; i <= data.engines_count; i++) {
            const prefix = `engine${i}_` as any;
            const mfr = (data as any)[`${prefix}manufacturer`];
            const model = (data as any)[`${prefix}model`];
            const sn = (data as any)[`${prefix}serial_number`];
            const csn = (data as any)[`confirm_engine${i}_serial_number`];
            const pn = (data as any)[`${prefix}part_number`];
            const cpn = (data as any)[`confirm_engine${i}_part_number`];
            const status = (data as any)[`${prefix}status`];
            const mfgDate = (data as any)[`${prefix}manufacture_date`];
            const hours = (data as any)[`${prefix}hours`];

            if (!mfr) ctx.addIssue({ code: "custom", message: "Required", path: [`${prefix}manufacturer`] });
            if (!model) ctx.addIssue({ code: "custom", message: "Required", path: [`${prefix}model`] });
            if (!sn) ctx.addIssue({ code: "custom", message: "Required", path: [`${prefix}serial_number`] });
            if (sn !== csn) ctx.addIssue({ code: "custom", message: "Serial Number must match", path: [`confirm_engine${i}_serial_number`] });
            if (!pn) ctx.addIssue({ code: "custom", message: "Required", path: [`${prefix}part_number`] });
            if (pn !== cpn) ctx.addIssue({ code: "custom", message: "Part Number must match", path: [`confirm_engine${i}_part_number`] });
            if (!status) ctx.addIssue({ code: "custom", message: "Required", path: [`${prefix}status`] });
            if (!mfgDate) ctx.addIssue({ code: "custom", message: "Required", path: [`${prefix}manufacture_date`] });
            if (!hours) ctx.addIssue({ code: "custom", message: "Required", path: [`${prefix}hours`] });
            else if (!/^\d+:[0-5]\d$/.test(hours)) ctx.addIssue({ code: "custom", message: "Format must be HHHH:MM", path: [`${prefix}hours`] });
        }

        if (data.apu_serial_number !== data.confirm_apu_serial_number) ctx.addIssue({ code: "custom", message: "APU Serial Number must match", path: ["confirm_apu_serial_number"] });
        if (data.apu_part_number !== data.confirm_apu_part_number) ctx.addIssue({ code: "custom", message: "APU Part Number must match", path: ["confirm_apu_part_number"] });
        if (data.mlg_left_serial_number !== data.confirm_mlg_left_serial_number) ctx.addIssue({ code: "custom", message: "MLG Left Serial No must match", path: ["confirm_mlg_left_serial_number"] });
        if (data.mlg_left_part_number !== data.confirm_mlg_left_part_number) ctx.addIssue({ code: "custom", message: "MLG Left Part No must match", path: ["confirm_mlg_left_part_number"] });
        if (data.mlg_right_serial_number !== data.confirm_mlg_right_serial_number) ctx.addIssue({ code: "custom", message: "MLG Right Serial No must match", path: ["confirm_mlg_right_serial_number"] });
        if (data.mlg_right_part_number !== data.confirm_mlg_right_part_number) ctx.addIssue({ code: "custom", message: "MLG Right Part No must match", path: ["confirm_mlg_right_part_number"] });
        if (data.nlg_serial_number !== data.confirm_nlg_serial_number) ctx.addIssue({ code: "custom", message: "NLG Serial No must match", path: ["confirm_nlg_serial_number"] });
        if (data.nlg_part_number !== data.confirm_nlg_part_number) ctx.addIssue({ code: "custom", message: "NLG Part No must match", path: ["confirm_nlg_part_number"] });
    });

export type AircraftFormData = z.infer<typeof aircraftSchema>;
