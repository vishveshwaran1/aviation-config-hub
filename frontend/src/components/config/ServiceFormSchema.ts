import { z } from "zod";

const requiredString = z.string().min(1, "This field is required");

const timeString = z.string().regex(/^\d+:[0-5]\d$/, "Format must be HHHH:MM");

export const serviceSchema = z.object({
    aircraft_model: requiredString,
    task_name: requiredString,
    mpd_id: requiredString,
    amm_id: requiredString,
    task_card_ref: requiredString,
    description: requiredString.max(999, "Description must be less than 1000 characters"),
    assigned_component_text: requiredString,
    zones: z.array(z.string()).min(1, "Select at least one zone"),
    estimated_manhours: timeString,
    estimated_currency: z.string().default("MYR"),
    estimated_price: z.coerce.number().min(0, "Price must be 0 or more"),
    quotation_currency: z.string().default("MYR"),
    quotation_price: z.coerce.number().min(0, "Price must be 0 or more"),
    interval_threshold: z.string().min(1, "Enter threshold"),
    interval_threshold_unit: z.string().min(1, "Select unit").default("Hours"),
    repeat_interval: z.string().min(1, "Enter interval"),
    repeat_interval_unit: z.string().min(1, "Select unit").default("Hours"),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
