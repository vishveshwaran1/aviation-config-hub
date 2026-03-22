import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { serviceSchema, ServiceFormData } from "./ServiceFormSchema";
import { useNavigate } from "react-router-dom";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { decimalToHoursMinutes, hoursMinutesToDecimal } from "@/lib/utils";

const ZONE_OPTIONS: Option[] = Array.from({ length: 900 }, (_, i) => ({
    label: `Zone ${i + 1}`,
    value: `Zone ${i + 1}`,
}));

const AIRCRAFT_MODELS = [
    "B737-700", "B737-800", "B737-900", "B737-900ER",
    "A320-200", "ATR72-500", "ATR72-600",
];

// Task class options matching old PanelGthreeForm service_class values
const SERVICE_CLASS_OPTIONS = [
    "GVI (General Visual Inspection)",
    "DET (Detailed Visual Inspection)",
    "FNC (Functional Check)",
    "DIS (Discard)",
    "LUB (Lubricate)",
    "OPC (Operational Check)",
    "RST (Restore)",
    "SVC (Servicing)",
    "VIC (Visual Check)",
    "Internal",
    "Third Party",
    "CAAM",
];

const CURRENCIES = ["MYR", "USD", "EUR"];
const UNIT_OPTIONS = ["Hours", "Cycles", "Months", "Years"];

interface ServiceFormProps {
    defaultValues?: any;
    onSuccess?: () => void;
}

export function ServiceForm({ defaultValues, onSuccess }: ServiceFormProps) {
    const [loading, setLoading] = useState(false);
    const [descriptionCount, setDescriptionCount] = useState(0);
    const navigate = useNavigate();

    const form = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        mode: "onBlur",
        defaultValues: {
            zones: [],
            assigned_component_text: defaultValues?.assigned_component_id || "",
            estimated_currency: "MYR",
            quotation_currency: "MYR",
            interval_threshold_unit: "Hours",
            repeat_interval_unit: "Hours",
            ...defaultValues,
            // Format time fields
            estimated_manhours: decimalToHoursMinutes(defaultValues?.estimated_manhours),
            interval_threshold: defaultValues?.interval_threshold_unit === "Hours" || !defaultValues?.interval_threshold_unit ? decimalToHoursMinutes(defaultValues?.interval_threshold) : (defaultValues?.interval_threshold?.toString() || ""),
            repeat_interval: defaultValues?.repeat_interval_unit === "Hours" || !defaultValues?.repeat_interval_unit ? decimalToHoursMinutes(defaultValues?.repeat_interval) : (defaultValues?.repeat_interval?.toString() || ""),
        },
    });

    // Watch aircraft model to filter components
    const watchedAircraftModel = useWatch({ control: form.control, name: "aircraft_model" });

    useEffect(() => {
        // Any initial data fetching if needed
    }, []);



    async function onSubmit(data: ServiceFormData) {
        setLoading(true);
        try {
            // Strip all UI-only fields that the backend doesn't accept
            const {
                estimated_currency,
                quotation_currency,
                assigned_component_text,
                interval_threshold_unit,
                repeat_interval_unit,
                ...rest
            } = data;

            // Map form fields to backend field names
            const payload = {
                ...rest,
                // Backend expects a single assigned_component_id (string | null)
                // We map our text area content here
                assigned_component_id: assigned_component_text || null,
                // Backend stores a single interval_unit; use threshold unit as the primary
                interval_unit: interval_threshold_unit || "Hours",
                // Nullable optional fields
                mpd_id: data.mpd_id || null,
                amm_id: data.amm_id || null,
                task_card_ref: data.task_card_ref || null,
                description: data.description || null,
                estimated_manhours: hoursMinutesToDecimal(data.estimated_manhours),
                estimated_price: data.estimated_price ?? null,
                quotation_price: data.quotation_price ?? null,
                interval_threshold: interval_threshold_unit === "Hours" ? hoursMinutesToDecimal(data.interval_threshold) : Number(data.interval_threshold),
                repeat_interval: repeat_interval_unit === "Hours" ? hoursMinutesToDecimal(data.repeat_interval) : Number(data.repeat_interval),
            };

            if (defaultValues?.id) {
                await api.services.update(defaultValues.id, payload);
                toast.success("Service updated successfully");
            } else {
                await api.services.create(payload);
                toast.success("Service saved successfully");
            }
            if (onSuccess) onSuccess();
            else navigate("/config/services");
        } catch (error: any) {
            console.error("Error saving service:", error);
            toast.error(error.message || "Failed to save service");
        } finally {
            setLoading(false);
        }
    }

    /* ── Shared style helpers (matches ComponentForm pattern) ── */
    const labelCls = (hasError: boolean) =>
        `w-44 shrink-0 text-sm font-medium leading-tight ${hasError ? "text-red-500" : "text-gray-600"}`;

    const inputCls = (hasError: boolean) =>
        `h-9 text-sm ${hasError ? "border-red-500 focus-visible:ring-red-300 pr-7" : "border-gray-300"}`;

    const selectCls = (hasError: boolean) =>
        `h-9 text-sm ${hasError ? "border-red-500" : "border-gray-300"}`;

    const ErrorBadge = () => (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>
    );

    const SelectErrorBadge = () => (
        <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none select-none">!</span>
    );

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-5">

                    {/* Aircraft Model */}
                    <FormField control={form.control} name="aircraft_model" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Aircraft Model</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={selectCls(!!fieldState.error)}>
                                                <SelectValue placeholder="Select aircraft model" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {AIRCRAFT_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {fieldState.error && <SelectErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Aircraft Model</p>}
                        </FormItem>
                    )} />

                    {/* Task Class (maps to task_name in DB — same as old service_class) */}
                    <FormField control={form.control} name="task_name" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Task</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={selectCls(!!fieldState.error)}>
                                                <SelectValue placeholder="Select task class" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {SERVICE_CLASS_OPTIONS.map(cls => (
                                                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldState.error && <SelectErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Select Task Class</p>}
                        </FormItem>
                    )} />

                    {/* MPD ID */}
                    <FormField control={form.control} name="mpd_id" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>MPD Task ID</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input
                                        className={inputCls(!!fieldState.error)}
                                        maxLength={40}
                                        autoComplete="off"
                                        onPaste={(e) => e.preventDefault()}
                                        onCopy={(e) => e.preventDefault()}
                                        {...field}
                                    /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter MPD ID</p>}
                        </FormItem>
                    )} />

                    {/* AMM ID */}
                    <FormField control={form.control} name="amm_id" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>AMM Task ID</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input
                                        className={inputCls(!!fieldState.error)}
                                        maxLength={40}
                                        autoComplete="off"
                                        onPaste={(e) => e.preventDefault()}
                                        onCopy={(e) => e.preventDefault()}
                                        {...field}
                                    /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter AMM ID</p>}
                        </FormItem>
                    )} />

                    {/* Task Card Ref */}
                    <FormField control={form.control} name="task_card_ref" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Task Card Ref ID</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input
                                        className={inputCls(!!fieldState.error)}
                                        maxLength={40}
                                        autoComplete="off"
                                        onPaste={(e) => e.preventDefault()}
                                        onCopy={(e) => e.preventDefault()}
                                        {...field}
                                    /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Task Card Ref</p>}
                        </FormItem>
                    )} />

                    {/* Description */}
                    <FormField control={form.control} name="description" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Description</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Textarea
                                        className="min-h-[100px] text-sm border-gray-300"
                                        maxLength={999}
                                        placeholder="This textarea has a limit of 999 chars."
                                        onPaste={(e) => e.preventDefault()}
                                        onCopy={(e) => e.preventDefault()}
                                        onChange={(e) => {
                                            setDescriptionCount(e.target.value.length);
                                            field.onChange(e);
                                        }}
                                        value={field.value}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        ref={field.ref}
                                    /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                    {descriptionCount > 0 && (
                                        <span className="text-xs text-green-600 font-medium mt-0.5 block">
                                            {descriptionCount} / 999
                                        </span>
                                    )}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Description</p>}
                        </FormItem>
                    )} />

                    {/* Assigned Component — Changed to text enter area (Textarea) */}
                    <FormField control={form.control} name="assigned_component_text" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Service Assigned Component</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl>
                                        <Textarea
                                            className="min-h-[60px] text-sm border-gray-300"
                                            placeholder="Enter assigned component(s)"
                                            {...field}
                                        />
                                    </FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Assigned Component</p>}
                        </FormItem>
                    )} />

                    {/* Zones — creatable: user can type and add custom zones */}
                    <FormField control={form.control} name="zones" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Zones</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl>
                                        <MultiSelect
                                            options={ZONE_OPTIONS}
                                            selected={field.value || []}
                                            onChange={field.onChange}
                                            placeholder="Select or type to create zones"
                                            creatable
                                        />
                                    </FormControl>
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Zones</p>}
                        </FormItem>
                    )} />

                    {/* Estimated Manhours */}
                    <FormField control={form.control} name="estimated_manhours" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Estimated Manhours</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input type="text" placeholder="HHHH:MM" className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Estimated Manhours</p>}
                        </FormItem>
                    )} />

                    {/* Estimated Price with inline currency */}
                    <FormField control={form.control} name="estimated_price" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Comp Price</FormLabel>
                                <div className="flex gap-2 flex-1">
                                    <FormField control={form.control} name="estimated_currency" render={({ field: cf }) => (
                                        <Select onValueChange={cf.onChange} value={cf.value as string}>
                                            <SelectTrigger className="w-24 shrink-0 h-9 text-sm border-gray-300">
                                                <SelectValue placeholder="CCY" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )} />
                                    <div className="relative flex-1">
                                        <FormControl><Input type="number" step="0.01" className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                        {fieldState.error && <ErrorBadge />}
                                    </div>
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Comp Price</p>}
                        </FormItem>
                    )} />

                    {/* Quotation Price with inline currency */}
                    <FormField control={form.control} name="quotation_price" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Service Price</FormLabel>
                                <div className="flex gap-2 flex-1">
                                    <FormField control={form.control} name="quotation_currency" render={({ field: cf }) => (
                                        <Select onValueChange={cf.onChange} value={cf.value as string}>
                                            <SelectTrigger className="w-24 shrink-0 h-9 text-sm border-gray-300">
                                                <SelectValue placeholder="CCY" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )} />
                                    <div className="relative flex-1">
                                        <FormControl><Input type="number" step="0.01" className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                        {fieldState.error && <ErrorBadge />}
                                    </div>
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Service Price</p>}
                        </FormItem>
                    )} />

                    {/* Interval Threshold */}
                    <FormField control={form.control} name="interval_threshold" render={({ field, fieldState }) => {
                        const unit = form.watch("interval_threshold_unit");
                        const placeholder = unit === "Hours" ? "HHHH" : unit === "Cycles" ? "Enter Threshold in Cycles" : "Enter Threshold";
                        return (
                            <FormItem className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-3">
                                    <FormLabel className={labelCls(!!fieldState.error)}>Interval Threshold</FormLabel>
                                    <div className="flex gap-2 flex-1">
                                        <FormField control={form.control} name="interval_threshold_unit" render={({ field: uf }) => (
                                            <Select onValueChange={uf.onChange} value={uf.value as string}>
                                                <SelectTrigger className="w-24 shrink-0 h-9 text-sm border-gray-300">
                                                    <SelectValue placeholder="Unit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {UNIT_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )} />
                                        <div className="relative flex-1">
                                            <FormControl><Input
                                                type={unit === "Hours" ? "text" : "number"}
                                                placeholder={unit === "Hours" ? "HHHH:MM" : placeholder}
                                                className={inputCls(!!fieldState.error)}
                                                {...field}
                                                value={field.value as string}
                                            /></FormControl>
                                            {fieldState.error && <ErrorBadge />}
                                        </div>
                                    </div>
                                </div>
                                {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Interval Threshold</p>}
                            </FormItem>
                        );
                    }} />

                    {/* Repeat Interval */}
                    <FormField control={form.control} name="repeat_interval" render={({ field, fieldState }) => {
                        const unit = form.watch("repeat_interval_unit");
                        const placeholder = unit === "Hours" ? "HHHH" : unit === "Cycles" ? "Enter Interval Repeat in Cycles" : "Enter Interval Repeat";
                        return (
                            <FormItem className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-3">
                                    <FormLabel className={labelCls(!!fieldState.error)}>Interval Repeat</FormLabel>
                                    <div className="flex gap-2 flex-1">
                                        <FormField control={form.control} name="repeat_interval_unit" render={({ field: uf }) => (
                                            <Select onValueChange={uf.onChange} value={uf.value as string}>
                                                <SelectTrigger className="w-24 shrink-0 h-9 text-sm border-gray-300">
                                                    <SelectValue placeholder="Unit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {UNIT_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )} />
                                        <div className="relative flex-1">
                                            <FormControl><Input
                                                type={unit === "Hours" ? "text" : "number"}
                                                placeholder={unit === "Hours" ? "HHHH:MM" : placeholder}
                                                className={inputCls(!!fieldState.error)}
                                                {...field}
                                                value={field.value as string}
                                            /></FormControl>
                                            {fieldState.error && <ErrorBadge />}
                                        </div>
                                    </div>
                                </div>
                                {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Repeat Interval</p>}
                            </FormItem>
                        );
                    }} />

                </div>

                <div className="flex justify-end gap-4 pt-6 border-t mt-6">
                    <Button variant="outline" type="button" onClick={() => onSuccess ? onSuccess() : navigate("/config/services")}>
                        ← Back
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-[#556ee6] hover:bg-[#4a5fcc] text-white px-10 h-10">
                        {loading ? "Saving..." : defaultValues?.id ? "Update Service" : "Save Configuration"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
