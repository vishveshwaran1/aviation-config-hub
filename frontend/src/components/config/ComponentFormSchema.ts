import { z } from "zod";

const requiredString = z.string().min(1, "This field is required");
const optionalString = z.string().optional();

export const componentSchema = z.object({
    manufacturer: requiredString,
    name: requiredString,
    confirm_name: requiredString,
    part_number: requiredString,
    confirm_part_number: requiredString,
    cmm_number: optionalString,
    confirm_cmm_number: optionalString,
    classification: optionalString,
    classification_date: z.string().optional(),
    class_linkage: optionalString,
    compatible_aircraft_models: z.array(z.string()).min(1, "Select at least one model"),
    currency: z.enum(["MYR", "USD", "EUR"]).default("MYR"),
    estimated_price: z.coerce.number().min(0).optional(),
    quotation_price: z.coerce.number().min(0).optional(),
})
    .refine((data) => data.name === data.confirm_name, {
        message: "Component Name must match",
        path: ["confirm_name"],
    })
    .refine((data) => data.part_number === data.confirm_part_number, {
        message: "Part Number must match",
        path: ["confirm_part_number"],
    })
    .refine((data) => !data.cmm_number || data.cmm_number === data.confirm_cmm_number, {
        message: "CMM Number must match",
        path: ["confirm_cmm_number"],
    });

export type ComponentFormData = z.infer<typeof componentSchema>;
