import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { decimalToHoursMinutes, hoursMinutesToDecimal } from "@/lib/utils";

/* ── Dropdown option lists ─────────────────────────────────────── */
const AIRCRAFT_MODELS = ["B737-700", "B737-800", "B737-900", "B737-900ER", "A320-200", "ATR72-500", "ATR72-600"];

const APU_MANUFACTURERS = [
    "Honeywell", "Pratt & Whitney Canada", "AlliedSignal",
    "Garrett AiResearch", "HEICO", "Sundstrand", "TransDigm", "Chromalloy",
];

const ENGINE_MANUFACTURERS = ["CFM International", "General Electric", "Rolls-Royce", "Pratt & Whitney", "IAE"];
const ENGINE_STATUS = ["New", "Used"];
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

    // Helper to flatten components from defaultValues if they exist
    const getInitialValues = () => {
        // Format date for <input type="date"> (YYYY-MM-DD)
        const formatDate = (d: any) => {
            if (!d) return "";
            const date = new Date(d);
            if (isNaN(date.getTime())) return "";
            return date.toISOString().split('T')[0];
        };

        const baseValues = {
            status: "Pending",
            engines_count: 2,
            flight_cycles: 0,
            aircraft_received_status: "New",
            country: "N/A", // Default to N/A since field is hidden
            engine1_status: "New",
            engine2_status: "New",
            apu_status: "Used",
            mlg_left_status: "Used",
            mlg_right_status: "Used",
            nlg_status: "Used",
            ...defaultValues,
            // Re-populate re-entry fields for aircraft
            confirm_msn: (defaultValues as any)?.msn || "",
            confirm_registration_number: (defaultValues as any)?.registration_number || "",
            manufacture_date: formatDate(defaultValues?.manufacture_date),
            delivery_date: formatDate(defaultValues?.delivery_date),
            flight_hours: decimalToHoursMinutes(defaultValues?.flight_hours as any),
        };

        // Flatten nested components if they exist (from backend include)
        const components = (defaultValues as any)?.components || [];
        if (components.length > 0) {
            const findComp = (s: string) => components.find((c: any) => c.section === s) || {};

            const engineData: any = {};
            for (let i = 1; i <= 4; i++) {
                const e = findComp(`Engine ${i}`);
                const p = `engine${i}_`;
                engineData[`${p}manufacturer`] = e.manufacturer || "";
                engineData[`${p}model`] = e.model || "";
                engineData[`${p}serial_number`] = e.serial_number || "";
                engineData[`confirm_${p}serial_number`] = e.serial_number || "";
                engineData[`${p}part_number`] = e.part_number || "";
                engineData[`confirm_${p}part_number`] = e.part_number || "";
                engineData[`${p}status`] = e.status || (i <= (defaultValues?.engines_count || 2) ? "New" : "N/A");
                engineData[`${p}manufacture_date`] = formatDate(e.manufacture_date);
                engineData[`${p}hours`] = decimalToHoursMinutes(e.hours_since_new);
                engineData[`${p}cycles`] = e.cycles_since_new || 0;
                engineData[`${p}last_shop_visit`] = formatDate(e.last_shop_visit_date);
                engineData[`${p}time_since_visit`] = decimalToHoursMinutes(e.time_since_visit);
                engineData[`${p}cycle_since_visit`] = e.cycle_since_visit || 0;
            }

            const apu = findComp("APU");
            const ml = findComp("Main Landing Gear Left");
            const mr = findComp("Main Landing Gear Right");
            const nl = findComp("Nose Landing Gear");

            return {
                ...baseValues,
                ...engineData,
                apu_manufacturer: apu.manufacturer || "",
                apu_model: apu.model || "",
                apu_serial_number: apu.serial_number || "",
                confirm_apu_serial_number: apu.serial_number || "",
                apu_part_number: apu.part_number || "",
                confirm_apu_part_number: apu.part_number || "",
                apu_status: apu.status || "Used",
                apu_manufacture_date: formatDate(apu.manufacture_date),
                apu_hours: decimalToHoursMinutes(apu.hours_since_new),
                apu_cycles: apu.cycles_since_new || 0,
                apu_last_shop_visit: formatDate(apu.last_shop_visit_date),
                apu_time_since_visit: decimalToHoursMinutes(apu.time_since_visit),
                apu_cycle_since_visit: apu.cycle_since_visit || 0,

                mlg_left_manufacturer: ml.manufacturer || "",
                mlg_left_model: ml.model || "",
                mlg_left_serial_number: ml.serial_number || "",
                confirm_mlg_left_serial_number: ml.serial_number || "",
                mlg_left_part_number: ml.part_number || "",
                confirm_mlg_left_part_number: ml.part_number || "",
                mlg_left_status: ml.status || "Used",
                mlg_left_manufacture_date: formatDate(ml.manufacture_date),
                mlg_left_hours: decimalToHoursMinutes(ml.hours_since_new),
                mlg_left_cycles: ml.cycles_since_new || 0,
                mlg_left_shop_visit: formatDate(ml.last_shop_visit_date),
                mlg_left_time_since_visit: decimalToHoursMinutes(ml.time_since_visit),
                mlg_left_cycle_since_visit: ml.cycle_since_visit || 0,

                mlg_right_manufacturer: mr.manufacturer || "",
                mlg_right_model: mr.model || "",
                mlg_right_serial_number: mr.serial_number || "",
                confirm_mlg_right_serial_number: mr.serial_number || "",
                mlg_right_part_number: mr.part_number || "",
                confirm_mlg_right_part_number: mr.part_number || "",
                mlg_right_status: mr.status || "Used",
                mlg_right_manufacture_date: formatDate(mr.manufacture_date),
                mlg_right_hours: decimalToHoursMinutes(mr.hours_since_new),
                mlg_right_cycles: mr.cycles_since_new || 0,
                mlg_right_shop_visit: formatDate(mr.last_shop_visit_date),
                mlg_right_time_since_visit: decimalToHoursMinutes(mr.time_since_visit),
                mlg_right_cycle_since_visit: mr.cycle_since_visit || 0,

                nlg_manufacturer: nl.manufacturer || "",
                nlg_model: nl.model || "",
                nlg_serial_number: nl.serial_number || "",
                confirm_nlg_serial_number: nl.serial_number || "",
                nlg_part_number: nl.part_number || "",
                confirm_nlg_part_number: nl.part_number || "",
                nlg_status: nl.status || "Used",
                nlg_manufacture_date: formatDate(nl.manufacture_date),
                nlg_hours: decimalToHoursMinutes(nl.hours_since_new),
                nlg_cycles: nl.cycles_since_new || 0,
                nlg_shop_visit: formatDate(nl.last_shop_visit_date),
                nlg_time_since_visit: decimalToHoursMinutes(nl.time_since_visit),
                nlg_cycle_since_visit: nl.cycle_since_visit || 0,
            };
        }
        return baseValues;
    };

    const form = useForm<AircraftFormData>({
        resolver: zodResolver(aircraftSchema),
        mode: "onBlur",
        defaultValues: getInitialValues() as any,
    });

    async function onSubmit(data: AircraftFormData) {
        setLoading(true);
        try {
            const aircraftId = defaultValues?.id;

            if (aircraftId) {
                const payload = {
                    ...data,
                    flight_hours: hoursMinutesToDecimal(data.flight_hours)
                };
                await api.aircrafts.update(aircraftId, payload);

                const existingComponents = (defaultValues as any).components || [];
                const updatePromises = [];
                const createList: any[] = [];

                const componentMappings = [];
                for (let i = 1; i <= data.engines_count; i++) {
                    componentMappings.push({ section: `Engine ${i}`, prefix: `engine${i}_`, lastShopVisit: "last_shop_visit" });
                }
                componentMappings.push(
                    { section: "APU", prefix: "apu_", lastShopVisit: "last_shop_visit" },
                    { section: "Main Landing Gear Left", prefix: "mlg_left_", lastShopVisit: "shop_visit" },
                    { section: "Main Landing Gear Right", prefix: "mlg_right_", lastShopVisit: "shop_visit" },
                    { section: "Nose Landing Gear", prefix: "nlg_", lastShopVisit: "shop_visit" },
                );

                for (const mapping of componentMappings) {
                    const comp = existingComponents.find((c: any) => c.section === mapping.section);
                    const p = mapping.prefix;
                    const compData = {
                        aircraft_id: aircraftId,
                        section: mapping.section,
                        manufacturer: (data as any)[`${p}manufacturer`],
                        model: (data as any)[`${p}model`],
                        serial_number: (data as any)[`${p}serial_number`],
                        part_number: (data as any)[`${p}part_number`],
                        status: (data as any)[`${p}status`],
                        manufacture_date: (data as any)[`${p}manufacture_date`] || null,
                        last_shop_visit_date: (data as any)[`${p}${mapping.lastShopVisit}`] || null,
                        time_since_visit: hoursMinutesToDecimal((data as any)[`${p}time_since_visit`]),
                        cycle_since_visit: Number((data as any)[`${p}cycle_since_visit`] || 0),
                        hours_since_new: hoursMinutesToDecimal((data as any)[`${p}hours`]),
                        cycles_since_new: Number((data as any)[`${p}cycles`] || 0)
                    };

                    if (comp && comp.id) {
                        updatePromises.push(api.aircraftComponents.update(comp.id, {
                            manufacturer: (data as any)[`${p}manufacturer`],
                            model: (data as any)[`${p}model`],
                            serial_number: (data as any)[`${p}serial_number`],
                            part_number: (data as any)[`${p}part_number`],
                            status: (data as any)[`${p}status`],
                            manufacture_date: (data as any)[`${p}manufacture_date`] || null,
                            last_shop_visit_date: (data as any)[`${p}${mapping.lastShopVisit}`] || null,
                            time_since_visit: hoursMinutesToDecimal((data as any)[`${p}time_since_visit`]),
                            cycle_since_visit: Number((data as any)[`${p}cycle_since_visit`] || 0),
                            hours_since_new: hoursMinutesToDecimal((data as any)[`${p}hours`]),
                            cycles_since_new: Number((data as any)[`${p}cycles`] || 0)
                        }));
                    } else {
                        createList.push({
                            aircraft_id: aircraftId,
                            section: mapping.section,
                            manufacturer: (data as any)[`${p}manufacturer`],
                            model: (data as any)[`${p}model`],
                            serial_number: (data as any)[`${p}serial_number`],
                            part_number: (data as any)[`${p}part_number`],
                            status: (data as any)[`${p}status`],
                            manufacture_date: (data as any)[`${p}manufacture_date`] || null,
                            last_shop_visit_date: (data as any)[`${p}${mapping.lastShopVisit}`] || null,
                            time_since_visit: hoursMinutesToDecimal((data as any)[`${p}time_since_visit`]),
                            cycle_since_visit: Number((data as any)[`${p}cycle_since_visit`] || 0),
                            hours_since_new: hoursMinutesToDecimal((data as any)[`${p}hours`]),
                            cycles_since_new: Number((data as any)[`${p}cycles`] || 0)
                        });
                    }
                }

                if (updatePromises.length > 0) await Promise.all(updatePromises);
                if (createList.length > 0) await api.aircraftComponents.create(createList);

                toast.success("Aircraft and components updated successfully");
            } else {
                const aircraftPayload = {
                    ...data,
                    flight_hours: hoursMinutesToDecimal(data.flight_hours)
                };
                const aircraftData = await api.aircrafts.create(aircraftPayload);
                const newId = aircraftData.id;

                const componentsToInsert = [];
                for (let i = 1; i <= data.engines_count; i++) {
                    const p = `engine${i}_` as any;
                    componentsToInsert.push({
                        aircraft_id: newId, section: `Engine ${i}`,
                        manufacturer: (data as any)[`${p}manufacturer`],
                        model: (data as any)[`${p}model`],
                        serial_number: (data as any)[`${p}serial_number`],
                        part_number: (data as any)[`${p}part_number`],
                        status: (data as any)[`${p}status`],
                        manufacture_date: (data as any)[`${p}manufacture_date`],
                        last_shop_visit_date: (data as any)[`${p}last_shop_visit`] || null,
                        time_since_visit: hoursMinutesToDecimal((data as any)[`${p}time_since_visit`]),
                        cycle_since_visit: Number((data as any)[`${p}cycle_since_visit`] || 0),
                        hours_since_new: hoursMinutesToDecimal((data as any)[`${p}hours`]),
                        cycles_since_new: Number((data as any)[`${p}cycles`] || 0)
                    });
                }

                componentsToInsert.push(
                    {
                        aircraft_id: newId, section: "APU",
                        manufacturer: data.apu_manufacturer, model: data.apu_model,
                        serial_number: data.apu_serial_number, part_number: data.apu_part_number,
                        status: data.apu_status, manufacture_date: data.apu_manufacture_date,
                        last_shop_visit_date: data.apu_last_shop_visit || null,
                        time_since_visit: hoursMinutesToDecimal(data.apu_time_since_visit), cycle_since_visit: Number(data.apu_cycle_since_visit || 0),
                        hours_since_new: hoursMinutesToDecimal(data.apu_hours), cycles_since_new: Number(data.apu_cycles || 0)
                    },
                    {
                        aircraft_id: newId, section: "Main Landing Gear Left",
                        manufacturer: data.mlg_left_manufacturer, model: data.mlg_left_model,
                        serial_number: data.mlg_left_serial_number, part_number: data.mlg_left_part_number,
                        status: data.mlg_left_status, manufacture_date: data.mlg_left_manufacture_date,
                        last_shop_visit_date: data.mlg_left_shop_visit || null,
                        time_since_visit: hoursMinutesToDecimal(data.mlg_left_time_since_visit), cycle_since_visit: Number(data.mlg_left_cycle_since_visit || 0),
                        hours_since_new: hoursMinutesToDecimal(data.mlg_left_hours), cycles_since_new: Number(data.mlg_left_cycles || 0)
                    },
                    {
                        aircraft_id: newId, section: "Main Landing Gear Right",
                        manufacturer: data.mlg_right_manufacturer, model: data.mlg_right_model,
                        serial_number: data.mlg_right_serial_number, part_number: data.mlg_right_part_number,
                        status: data.mlg_right_status, manufacture_date: data.mlg_right_manufacture_date,
                        last_shop_visit_date: data.mlg_right_shop_visit || null,
                        time_since_visit: hoursMinutesToDecimal(data.mlg_right_time_since_visit), cycle_since_visit: Number(data.mlg_right_cycle_since_visit || 0),
                        hours_since_new: hoursMinutesToDecimal(data.mlg_right_hours), cycles_since_new: Number(data.mlg_right_cycles || 0)
                    },
                    {
                        aircraft_id: newId, section: "Nose Landing Gear",
                        manufacturer: data.nlg_manufacturer, model: data.nlg_model,
                        serial_number: data.nlg_serial_number, part_number: data.nlg_part_number,
                        status: data.nlg_status, manufacture_date: data.nlg_manufacture_date,
                        last_shop_visit_date: data.nlg_shop_visit || null,
                        time_since_visit: hoursMinutesToDecimal(data.nlg_time_since_visit), cycle_since_visit: Number(data.nlg_cycle_since_visit || 0),
                        hours_since_new: hoursMinutesToDecimal(data.nlg_hours), cycles_since_new: Number(data.nlg_cycles || 0)
                    },
                );
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
        disabled?: boolean,
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
                                disabled={disabled}
                                className={`h-9 text-sm ${fieldState.error ? 'border-red-500 focus-visible:ring-red-300 pr-7' : 'border-gray-300'} ${disabled ? 'bg-gray-100' : ''}`}
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

    // Auto-sync Shop Visit with Manufacture Date if status is "New"
    const watchAll = form.watch();

    useEffect(() => {
        const components: any[] = [];
        for (let i = 1; i <= watchAll.engines_count; i++) {
            const p = `engine${i}_`;
            components.push({
                status: (watchAll as any)[`${p}status`],
                mfg: (watchAll as any)[`${p}manufacture_date`],
                field: `${p}last_shop_visit`
            });
        }
        components.push(
            { status: watchAll.apu_status, mfg: watchAll.apu_manufacture_date, field: "apu_last_shop_visit" },
            { status: watchAll.mlg_left_status, mfg: watchAll.mlg_left_manufacture_date, field: "mlg_left_shop_visit" },
            { status: watchAll.mlg_right_status, mfg: watchAll.mlg_right_manufacture_date, field: "mlg_right_shop_visit" },
            { status: watchAll.nlg_status, mfg: watchAll.nlg_manufacture_date, field: "nlg_shop_visit" },
        );

        components.forEach(comp => {
            if (comp.status === "New" && comp.mfg) {
                form.setValue(comp.field as any, comp.mfg);
            }
        });
    }, [
        watchAll.engines_count,
        watchAll.engine1_status, watchAll.engine1_manufacture_date,
        watchAll.engine2_status, watchAll.engine2_manufacture_date,
        watchAll.engine3_status, watchAll.engine3_manufacture_date,
        watchAll.engine4_status, watchAll.engine4_manufacture_date,
        watchAll.apu_status, watchAll.apu_manufacture_date,
        watchAll.mlg_left_status, watchAll.mlg_left_manufacture_date,
        watchAll.mlg_right_status, watchAll.mlg_right_manufacture_date,
        watchAll.nlg_status, watchAll.nlg_manufacture_date,
        form.setValue
    ]);

    const onValidationError = (errors: any) => {
        console.error("Validation errors:", errors);
        const firstErrorField = Object.keys(errors)[0];
        const readableField = firstErrorField.replace(/_/g, ' ').replace(/\d/g, ' $&');
        toast.error(`Please check the ${readableField} field`);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onValidationError)} >
                {/* 2-column responsive grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

                    {/* ── Aircraft Setup fields ─────────────────────── */}
                    {SelectField("model", "Aircraft Model", AIRCRAFT_MODELS)}
                    {SelectField("aircraft_received_status", "Aircraft Received Status",
                        ["New", "Used"])}

                    {TextField("msn", "MSN")}
                    {TextField("confirm_msn", "Re-Enter MSN")}
                    {/* 
                    {TextField("country", "Country")} */}


                    {TextField("registration_number", "Aircraft Registration ID")}
                    {TextField("confirm_registration_number", "Re-Enter Aircraft Registration ID")}

                    {TextField("manufacture_date", "Manufactured Date", "DD/MM/YYYY", "date")}
                    {TextField("delivery_date", "Date Received", "DD/MM/YYYY", "date")}

                    {TextField("flight_hours", "Aircraft Hours", "HHHH:MM", "text")}
                    {TextField("flight_cycles", "Aircraft Cycles", "", "number")}

                    {/* engines_count as Select */}
                    <FormField control={form.control} name="engines_count" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-sm font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>No of Engines</FormLabel>
                                <div className="relative flex-1">
                                    <Select
                                        onValueChange={(v) => field.onChange(Number(v))}
                                        defaultValue={String(field.value ?? 2)}
                                        value={String(field.value ?? 2)}
                                    >
                                        <FormControl><SelectTrigger className={`h-9 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{[1, 2, 3, 4].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11rem]">Enter No of Engines</p>}
                        </FormItem>
                    )} />
                    {/* spacer — keeps grid even */}
                    <div />

                    {/* ── Dynamic Engine Details ────────────────────────── */}
                    {[...Array(watchAll.engines_count || 2)].map((_, i) => {
                        const idx = i + 1;
                        const p = `engine${idx}_` as any;
                        const status = (watchAll as any)[`${p}status`];
                        return (
                            <div key={idx} className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                <SectionTitle title={`Engine ${idx}`} />
                                {SelectField(`${p}manufacturer` as any, "Engine Manufacturer", ENGINE_MANUFACTURERS)}
                                {TextField(`${p}model` as any, "Engine Model")}
                                {TextField(`${p}serial_number` as any, "Serial No")}
                                {TextField(`confirm_${p}serial_number` as any, "Confirm Serial No")}
                                {TextField(`${p}part_number` as any, "Part No")}
                                {TextField(`confirm_${p}part_number` as any, "Confirm Part No")}
                                {SelectField(`${p}status` as any, "Engine Status", ENGINE_STATUS)}
                                {TextField(`${p}manufacture_date` as any, "Manufactured Date", "DD/MM/YYYY", "date")}
                                {TextField(`${p}hours` as any, "Total Hours", "HHHH:MM", "text")}
                                {TextField(`${p}cycles` as any, "Total Cycles", "", "number")}
                                <div className="col-span-2">
                                    {TextField(`${p}last_shop_visit` as any, "Last Shop Visit", "DD/MM/YYYY", "date", undefined, status === "New")}
                                </div>
                                {TextField(`${p}time_since_visit` as any, "Time Since Visit", "HHHH:MM", "text", undefined, status === "New")}
                                {TextField(`${p}cycle_since_visit` as any, "Cycle Since Visit", "", "number", undefined, status === "New")}
                            </div>
                        );
                    })}

                    {/* ── APU Details ───────────────────────────────── */}
                    <SectionTitle title="APU Details" />

                    {/* APU Manufacturer */}
                    <FormField control={form.control} name="apu_manufacturer" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-sm font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>APU Manufacturer</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={(v) => { field.onChange(v); setApuMfr(v); }} defaultValue={field.value} value={field.value}>
                                        <FormControl><SelectTrigger className={`h-9 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{APU_MANUFACTURERS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11rem]">Enter APU Manufacturer</p>}
                        </FormItem>
                    )} />

                    {/* APU Model (filtered by manufacturer) */}
                    <FormField control={form.control} name="apu_model" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-sm font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>APU Model</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl><SelectTrigger className={`h-9 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{(apuMfr && APU_MODELS_MAP[apuMfr]?.length ? APU_MODELS_MAP[apuMfr] : ALL_APU_MODELS).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11rem]">Enter APU Model</p>}
                        </FormItem>
                    )} />

                    {/* Serial & Confirm Serial */}
                    {TextField("apu_serial_number", "Serial No")}
                    {TextField("confirm_apu_serial_number", "Confirm Serial No")}

                    {/* Part & Confirm Part */}
                    {TextField("apu_part_number", "Part No")}
                    {TextField("confirm_apu_part_number", "Confirm Part No")}

                    {SelectField("apu_status", "APU Status", ENGINE_STATUS)}
                    {TextField("apu_manufacture_date", "Manufactured Date", "DD/MM/YYYY", "date")}

                    <div className="col-span-2">{TextField("apu_last_shop_visit", "Last Shop Visit", "DD/MM/YYYY", "date", undefined, watchAll.apu_status === "New")}</div>
                    {TextField("apu_time_since_visit", "Time Since Visit", "HHHH:MM", "text", undefined, watchAll.apu_status === "New")}
                    {TextField("apu_cycle_since_visit", "Cycle Since Visit", "", "number", undefined, watchAll.apu_status === "New")}

                    {TextField("apu_hours", "Total Hours", "HHHH:MM", "text")}
                    {TextField("apu_cycles", "Total Cycles", "", "number")}

                    {/* ── Main Landing Gear — Left ──────────────────── */}
                    <SectionTitle title="Main Landing Gear — Left" />

                    <FormField control={form.control} name="mlg_left_manufacturer" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-sm font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>Manufacturer</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl><SelectTrigger className={`h-9 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{LG_MANUFACTURERS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11rem]">Enter Manufacturer</p>}
                        </FormItem>
                    )} />
                    {/* MLG Left Model */}
                    <FormField control={form.control} name="mlg_left_model" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-sm font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>Model</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Textarea className={`min-h-[40px] text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`} {...field} /></FormControl>
                                    {fieldState.error && <span className="absolute right-2 top-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                        </FormItem>
                    )} />

                    {TextField("mlg_left_serial_number", "Serial No")}
                    {TextField("confirm_mlg_left_serial_number", "Re-Enter Serial No")}
                    {TextField("mlg_left_part_number", "Part Number")}
                    {TextField("confirm_mlg_left_part_number", "Re-Enter Part Number")}
                    {SelectField("mlg_left_status", "Status", ENGINE_STATUS)}
                    {TextField("mlg_left_manufacture_date", "Manufactured Date", "DD/MM/YYYY", "date")}
                    {TextField("mlg_left_shop_visit", "Last Shop Visit", "DD/MM/YYYY", "date", undefined, watchAll.mlg_left_status === "New")}
                    {TextField("mlg_left_time_since_visit", "Time Since Visit", "HHHH:MM", "text", undefined, watchAll.mlg_left_status === "New")}
                    {TextField("mlg_left_cycle_since_visit", "Cycle Since Visit", "", "number", undefined, watchAll.mlg_left_status === "New")}
                    {TextField("mlg_left_hours", "Total Hours", "HHHH:MM", "text")}
                    <div className="col-span-2">{TextField("mlg_left_cycles", "Total Cycles", "", "number")}</div>

                    {/* ── Main Landing Gear — Right ─────────────────── */}
                    <SectionTitle title="Main Landing Gear — Right" />

                    <FormField control={form.control} name="mlg_right_manufacturer" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-sm font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>Manufacturer</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl><SelectTrigger className={`h-9 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{LG_MANUFACTURERS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11rem]">Enter Manufacturer</p>}
                        </FormItem>
                    )} />
                    {/* MLG Right Model */}
                    <FormField control={form.control} name="mlg_right_model" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-sm font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>Model</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Textarea className={`min-h-[40px] text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`} {...field} /></FormControl>
                                    {fieldState.error && <span className="absolute right-2 top-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                        </FormItem>
                    )} />

                    {TextField("mlg_right_serial_number", "Serial No")}
                    {TextField("confirm_mlg_right_serial_number", "Re-Enter Serial No")}
                    {TextField("mlg_right_part_number", "Part Number")}
                    {TextField("confirm_mlg_right_part_number", "Re-Enter Part Number")}
                    {SelectField("mlg_right_status", "Status", ENGINE_STATUS)}
                    {TextField("mlg_right_manufacture_date", "Manufactured Date", "DD/MM/YYYY", "date")}
                    {TextField("mlg_right_shop_visit", "Last Shop Visit", "DD/MM/YYYY", "date", undefined, watchAll.mlg_right_status === "New")}
                    {TextField("mlg_right_time_since_visit", "Time Since Visit", "HHHH:MM", "text", undefined, watchAll.mlg_right_status === "New")}
                    {TextField("mlg_right_cycle_since_visit", "Cycle Since Visit", "", "number", undefined, watchAll.mlg_right_status === "New")}
                    {TextField("mlg_right_hours", "Total Hours", "HHHH:MM", "text")}
                    <div className="col-span-2">{TextField("mlg_right_cycles", "Total Cycles", "", "number")}</div>

                    {/* ── Nose Landing Gear ────────────────────────── */}
                    <SectionTitle title="Nose Landing Gear" />

                    <FormField control={form.control} name="nlg_manufacturer" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-sm font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>Manufacturer</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl><SelectTrigger className={`h-9 text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{LG_MANUFACTURERS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {fieldState.error && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11rem]">Enter Manufacturer</p>}
                        </FormItem>
                    )} />
                    {/* NLG Model */}
                    <FormField control={form.control} name="nlg_model" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={`w-40 shrink-0 text-sm font-medium leading-tight ${fieldState.error ? 'text-red-500' : 'text-gray-600'}`}>Model</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Textarea className={`min-h-[40px] text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`} {...field} /></FormControl>
                                    {fieldState.error && <span className="absolute right-2 top-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>}
                                </div>
                            </div>
                        </FormItem>
                    )} />

                    {TextField("nlg_serial_number", "Serial No")}
                    {TextField("confirm_nlg_serial_number", "Re-Enter Serial No")}
                    {TextField("nlg_part_number", "Part Number")}
                    {TextField("confirm_nlg_part_number", "Re-Enter Part Number")}
                    {SelectField("nlg_status", "Status", ENGINE_STATUS)}
                    {TextField("nlg_manufacture_date", "Manufactured Date", "DD/MM/YYYY", "date")}
                    {TextField("nlg_shop_visit", "Last Shop Visit", "DD/MM/YYYY", "date", undefined, watchAll.nlg_status === "New")}
                    {TextField("nlg_time_since_visit", "Time Since Visit", "HHHH:MM", "text", undefined, watchAll.nlg_status === "New")}
                    {TextField("nlg_cycle_since_visit", "Cycle Since Visit", "", "number", undefined, watchAll.nlg_status === "New")}
                    {TextField("nlg_hours", "Total Hours", "HHHH:MM", "text")}
                    <div className="col-span-2">{TextField("nlg_cycles", "Total Cycles", "", "number")}</div>

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
