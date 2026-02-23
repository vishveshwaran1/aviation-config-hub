import { z } from "zod";

const requiredString = z.string().min(1, "This field is required");

export const serviceSchema = z.object({
    aircraft_model: requiredString,
    task_name: requiredString,
    mpd_id: requiredString,
    amm_id: requiredString,
    task_card_ref: requiredString,
    description: requiredString.max(999, "Description must be less than 1000 characters"),
    assigned_component_id: requiredString,
    zones: z.array(z.string()).min(1, "Select at least one zone"),
    estimated_manhours: z.coerce.number().min(0, "Manhours must be 0 or more"),
    currency: z.string().min(1, "Select currency").default("MYR"),
    estimated_price: z.coerce.number().min(0, "Price must be 0 or more"),
    quotation_price: z.coerce.number().min(0, "Price must be 0 or more"),
    interval_threshold: z.coerce.number().min(0, "Threshold must be 0 or more"),
    interval_threshold_unit: z.string().min(1, "Select unit").default("Hour"),
    repeat_interval: z.coerce.number().min(0, "Interval must be 0 or more"),
    repeat_interval_unit: z.string().min(1, "Select unit").default("Hour"),
    interval_unit: z.enum(["Hours", "Cycles"]).default("Hours"),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
