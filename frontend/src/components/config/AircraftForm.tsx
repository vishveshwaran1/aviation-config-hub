import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { aircraftSchema, AircraftFormData } from "./AircraftFormSchema";

/* ── Dropdown option lists ─────────────────────────────────────── */
const AIRCRAFT_MODELS = ["B737-700", "B737-800", "B737-900", "B737-900ER", "A320-200", "ATR72-500", "ATR72-600"];

const APU_MANUFACTURERS = [
    "Honeywell", "Pratt & Whitney Canada", "AlliedSignal",
    "Garrett AiResearch", "HEICO", "Sundstrand", "TransDigm", "Chromalloy",
];
const APU_MODELS_MAP: Record<string, string[]> = {
    "Honeywell": ["GTCP131-9A", "GTCP131-9B", "GTCP331-200", "GTCP331-350"],
    "Pratt & Whitney Canada": ["PW901A", "PW902D", "APS3200"],
    "AlliedSignal": ["GTCP36-300", "GTCP85"],
    "Garrett AiResearch": ["GTCP85-98D", "GTCP36-100"],
    "HEICO": ["GTCP131-9", "GTCP331"],
    "Sundstrand": ["APS2000", "APS2300"],
    "TransDigm": ["T-62T-40-1"],
    "Chromalloy": [],
};
const ALL_APU_MODELS = Object.values(APU_MODELS_MAP).flat();

const LG_MANUFACTURERS = [
    "Safran Landing Systems", "Messier-Bugatti", "UTC Aerospace Systems",
    "Goodrich", "Heroux-Devtek", "Liebherr", "Dowty",
];
const LG_MODELS = ["Model-100A", "Model-200B", "MLG-300", "NLG-150", "Standard", "N/A"];

/* ── Shared sub-components ──────────────────────────────────────── */

/** A centered, bold section-title divider spanning both columns */
const SectionTitle = ({ title }: { title: string }) => (
    <div className="col-span-2 text-center font-semibold text-[#343a40] text-sm pt-2 pb-0.5 border-b mb-1">
        {title}
    </div>
);

/** A horizontal rule spacer */
const Divider = () => <div className="col-span-2 border-t my-1" />;

/* ── Props ──────────────────────────────────────────────────────── */
interface AircraftFormProps {
    defaultValues?: Partial<AircraftFormData>;
    onSuccess?: () => void;
}

/* ═══════════════════════════════════════════════════════════════ */
export function AircraftForm({ defaultValues, onSuccess }: AircraftFormProps) {
    const [loading, setLoading] = useState(false);
    const [apuMfr, setApuMfr] = useState(defaultValues?.apu_manufacturer ?? "");

    const form = useForm<AircraftFormData>({
        resolver: zodResolver(aircraftSchema),
        mode: "onBlur",
        defaultValues: {
            status: "Pending",
            engines_count: 2,
            ...defaultValues,
        },
    });

    async function onSubmit(data: AircraftFormData) {
        setLoading(true);
        try {
            if (defaultValues?.id) {
                await api.aircrafts.update(defaultValues.id, data);
                toast.success("Aircraft updated successfully");
            } else {
                const aircraftData = await api.aircrafts.create(data);
                const aircraftId = aircraftData.id;

                const componentsToInsert = [
                    {
                        aircraft_id: aircraftId, section: "APU",
                        manufacturer: data.apu_manufacturer, model: data.apu_model,
                        serial_number: data.apu_serial_number, part_number: data.apu_part_number,
                        last_shop_visit_date: data.apu_last_shop_visit || null,
                        hours_since_new: data.apu_hours || 0, cycles_since_new: data.apu_cycles || 0
                    },
                    {
                        aircraft_id: aircraftId, section: "Main Landing Gear Left",
                        manufacturer: data.mlg_left_manufacturer, model: data.mlg_left_model,
                        serial_number: data.mlg_left_serial_number, part_number: data.mlg_left_part_number,
                        last_shop_visit_date: data.mlg_left_shop_visit || null,
                        hours_since_new: data.mlg_left_hours || 0, cycles_since_new: data.mlg_left_cycles || 0
                    },
                    {
                        aircraft_id: aircraftId, section: "Main Landing Gear Right",
                        manufacturer: data.mlg_right_manufacturer, model: data.mlg_right_model,
                        serial_number: data.mlg_right_serial_number, part_number: data.mlg_right_part_number,
                        last_shop_visit_date: data.mlg_right_shop_visit || null,
                        hours_since_new: data.mlg_right_hours || 0, cycles_since_new: data.mlg_right_cycles || 0
                    },
                    {
                        aircraft_id: aircraftId, section: "Nose Landing Gear",
                        manufacturer: data.nlg_manufacturer, model: data.nlg_model,
                        serial_number: data.nlg_serial_number, part_number: data.nlg_part_number,
                        last_shop_visit_date: data.nlg_shop_visit || null,
                        hours_since_new: data.nlg_hours || 0, cycles_since_new: data.nlg_cycles || 0
                    },
                ];
                await api.aircraftComponents.create(componentsToInsert);
                toast.success("Aircraft configuration saved successfully");
            }
            onSuccess?.();
        } catch (error: any) {
            console.error("Error saving aircraft:", error);
            toast.error(error.message || "Failed to save aircraft configuration");
        } finally {
            setLoading(false);
        }
    }

    /* helper: render a <Select> inside a FormField */
    const SelectField = (
        name: keyof AircraftFormData,
        label: string,
        options: string[],
        onChangeCb?: (v: string) => void,
        isNumeric?: boolean,
    ) => (
        <FormField control={form.control} name={name} render={({ field, fieldState }) => (
            <FormItem className="flex flex-col gap-0.5">
                <div className="flex items-center gap-3">
                    <FormLabel className={`w-40 shrink-0 text-sm font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>
                        {label}
                    </FormLabel>
                    <div className="relative flex-1">
                        <Select
                            onValueChange={(v) => {
                                field.onChange(isNumeric ? Number(v) : v);
                                onChangeCb?.(v);
                            }}
                            defaultValue={isNumeric ? String(field.value) : (field.value as string)}
                        >
                            <FormControl>
                                <SelectTrigger className={`h-9 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {fieldState.error && (
                            <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>
                        )}
                    </div>
                </div>
                {fieldState.error && (
                    <p className="text-xs text-red-500 ml-[11rem]">Enter {label}</p>
                )}
            </FormItem>
        )} />
    );

    /** helper: render a text / date / number <Input> inside a FormField */
    const TextField = (
        name: keyof AircraftFormData,
        label: string,
        placeholder = "",
        type: React.HTMLInputTypeAttribute = "text",
        step?: string,
    ) => (
        <FormField control={form.control} name={name} render={({ field, fieldState }) => (
            <FormItem className="flex flex-col gap-0.5">
                <div className="flex items-center gap-3">
                    <FormLabel className={`w-40 shrink-0 text-sm font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>
                        {label}
                    </FormLabel>
                    <div className="relative flex-1">
                        <FormControl>
                            <Input
                                type={type}
                                step={step}
                                placeholder={placeholder}
                                className={`h-9 text-sm ${fieldState.error ? 'border-red-500 focus-visible:ring-red-300 pr-7' : 'border-gray-300'}`}
                                {...field}
                                value={field.value as string ?? ""}
                            />
                        </FormControl>
                        {fieldState.error && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>
                        )}
                    </div>
                </div>
                {fieldState.error && (
                    <p className="text-xs text-red-500 ml-[11rem]">Enter {label}</p>
                )}
            </FormItem>
        )} />
    );

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} >
                {/* 2-column responsive grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

                    {/* ── Aircraft Setup fields ─────────────────────── */}
                    {SelectField("model", "Aircraft Model", AIRCRAFT_MODELS)}
                    {SelectField("status", "Aircraft Received Status",
                        ["New", "Used"])}

                    {TextField("msn", "MSN")}
                    {TextField("confirm_msn", "Re-Enter MSN")}
                    {/* 
                    {TextField("country", "Country")} */}


                    {TextField("registration_number", "National Registration ID")}
                    {TextField("confirm_registration_number", "Re-Enter National Registration ID")}

                    {TextField("manufacture_date", "Manufactured Date", "DD/MM/YYYY", "date")}
                    {TextField("delivery_date", "Date Received", "DD/MM/YYYY", "date")}

                    {TextField("flight_hours", "Aircraft Hours", "HHHH-MM", "number", "0.01")}
                    {TextField("flight_cycles", "Aircraft Cycles", "", "number")}

                    {/* engines_count as Select */}
                    <FormField control={form.control} name="engines_count" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-xs font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>No of Engines</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value ?? 2)}>
                                        <FormControl><SelectTrigger className={`h-8 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{[1, 2, 3, 4].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-[11px] text-red-500 ml-[11rem]">Enter No of Engines</p>}
                        </FormItem>
                    )} />
                    {/* spacer — keeps grid even */}
                    <div />

                    {/* ── APU Details ───────────────────────────────── */}
                    <SectionTitle title="APU Details" />

                    {/* APU Manufacturer */}
                    <FormField control={form.control} name="apu_manufacturer" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-xs font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>APU Manufacturer</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={(v) => { field.onChange(v); setApuMfr(v); }} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className={`h-8 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{APU_MANUFACTURERS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-[11px] text-red-500 ml-[11rem]">Enter APU Manufacturer</p>}
                        </FormItem>
                    )} />

                    {/* APU Model (filtered by manufacturer) */}
                    <FormField control={form.control} name="apu_model" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-xs font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>APU Model</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className={`h-8 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{(apuMfr && APU_MODELS_MAP[apuMfr]?.length ? APU_MODELS_MAP[apuMfr] : ALL_APU_MODELS).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-[11px] text-red-500 ml-[11rem]">Enter APU Model</p>}
                        </FormItem>
                    )} />

                    {TextField("apu_serial_number", "APU Serial No")}
                    {TextField("confirm_apu_serial_number", "Re-Enter APU Serial No")}
                    {TextField("apu_part_number", "APU Part Number")}
                    {TextField("confirm_apu_part_number", "Re-Enter Part Number")}
                    {TextField("apu_last_shop_visit", "APU Last Shop Visit", "DD/MM/YYYY", "date")}
                    {TextField("apu_hours", "APU Total Hours", "HHHH-MM", "number", "0.01")}
                    {TextField("apu_cycles", "APU Total Cycles", "", "number")}
                    <div />

                    {/* ── Main Landing Gear — Left ──────────────────── */}
                    <SectionTitle title="Main Landing Gear — Left" />

                    <FormField control={form.control} name="mlg_left_manufacturer" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-xs font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>Manufacturer</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className={`h-8 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{LG_MANUFACTURERS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-[11px] text-red-500 ml-[11rem]">Enter Manufacturer</p>}
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="mlg_left_model" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-xs font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>Model</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className={`h-8 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{LG_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-[11px] text-red-500 ml-[11rem]">Enter Model</p>}
                        </FormItem>
                    )} />

                    {TextField("mlg_left_serial_number", "Serial No")}
                    {TextField("confirm_mlg_left_serial_number", "Re-Enter Serial No")}
                    {TextField("mlg_left_part_number", "Part Number")}
                    {TextField("confirm_mlg_left_part_number", "Re-Enter Part Number")}
                    {TextField("mlg_left_shop_visit", "Last Shop Visit", "DD/MM/YYYY", "date")}
                    {TextField("mlg_left_hours", "Total Hours", "HHHH-MM", "number", "0.01")}
                    {TextField("mlg_left_cycles", "Total Cycles", "", "number")}
                    <div />

                    {/* ── Main Landing Gear — Right ─────────────────── */}
                    <SectionTitle title="Main Landing Gear — Right" />

                    <FormField control={form.control} name="mlg_right_manufacturer" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-xs font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>Manufacturer</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className={`h-8 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{LG_MANUFACTURERS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-[11px] text-red-500 ml-[11rem]">Enter Manufacturer</p>}
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="mlg_right_model" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-xs font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>Model</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className={`h-8 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{LG_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-[11px] text-red-500 ml-[11rem]">Enter Model</p>}
                        </FormItem>
                    )} />

                    {TextField("mlg_right_serial_number", "Serial No")}
                    {TextField("confirm_mlg_right_serial_number", "Re-Enter Serial No")}
                    {TextField("mlg_right_part_number", "Part Number")}
                    {TextField("confirm_mlg_right_part_number", "Re-Enter Part Number")}
                    {TextField("mlg_right_shop_visit", "Last Shop Visit", "DD/MM/YYYY", "date")}
                    {TextField("mlg_right_hours", "Total Hours", "HHHH-MM", "number", "0.01")}
                    {TextField("mlg_right_cycles", "Total Cycles", "", "number")}
                    <div />

                    {/* ── Nose Landing Gear ────────────────────────── */}
                    <SectionTitle title="Nose Landing Gear" />

                    <FormField control={form.control} name="nlg_manufacturer" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-xs font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>Manufacturer</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className={`h-8 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{LG_MANUFACTURERS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-[11px] text-red-500 ml-[11rem]">Enter Manufacturer</p>}
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="nlg_model" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-xs font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>Model</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className={`h-8 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{LG_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-[11px] text-red-500 ml-[11rem]">Enter Model</p>}
                        </FormItem>
                    )} />

                    {TextField("nlg_serial_number", "Serial No")}
                    {TextField("confirm_nlg_serial_number", "Re-Enter Serial No")}
                    {TextField("nlg_part_number", "Part Number")}
                    {TextField("confirm_nlg_part_number", "Re-Enter Part Number")}
                    {TextField("nlg_shop_visit", "Last Shop Visit", "DD/MM/YYYY", "date")}
                    {TextField("nlg_hours", "Total Hours", "HHHH-MM", "number", "0.01")}
                    {TextField("nlg_cycles", "Total Cycles", "", "number")}
                    <div />

                </div>

                {/* Submit row */}
                <div className="flex justify-end gap-4 pt-4 border-t mt-4">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-[#556ee6] hover:bg-[#4a5fcc] text-white px-10 h-10"
                    >
                        {loading ? "Saving..." : defaultValues?.id ? "Update Configuration" : "Save Configuration"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
