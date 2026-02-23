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
import { serviceSchema, ServiceFormData } from "./ServiceFormSchema";
import { useNavigate } from "react-router-dom";
import { MultiSelect, Option } from "@/components/ui/multi-select";

const ZONE_OPTIONS: Option[] = [
    { label: "Zone 1", value: "Zone 1" },
    { label: "Zone 2", value: "Zone 2" },
    { label: "Zone 3", value: "Zone 3" },
];

const AIRCRAFT_MODELS = [
    "B737-700", "B737-800", "B737-900", "B737-900ER",
    "A320-200", "ATR72-500", "ATR72-600",
];

const CURRENCIES = ["MYR", "USD", "EUR"];
const UNIT_OPTIONS = ["Hour", "Cycle"];

interface ServiceFormProps {
    defaultValues?: any;
    onSuccess?: () => void;
}

export function ServiceForm({ defaultValues, onSuccess }: ServiceFormProps) {
    const [loading, setLoading] = useState(false);
    const [components, setComponents] = useState<{ id: string; name: string }[]>([]);
    const navigate = useNavigate();

    const form = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        mode: "onBlur",
        defaultValues: {
            zones: [],
            currency: "MYR",
            interval_threshold_unit: "Hour",
            repeat_interval_unit: "Hour",
            ...defaultValues,
        },
    });

    useEffect(() => { fetchFormData(); }, []);

    const fetchFormData = async () => {
        try {
            const componentsData = await api.components.list();
            if (componentsData) setComponents(componentsData);
        } catch (error) {
            console.error("Error fetching form data:", error);
        }
    };

    async function onSubmit(data: ServiceFormData) {
        setLoading(true);
        try {
            if (defaultValues?.id) {
                await api.services.update(defaultValues.id, data);
                toast.success("Service updated successfully");
            } else {
                await api.services.create({
                    ...data,
                    mpd_id: data.mpd_id || null,
                    amm_id: data.amm_id || null,
                    task_card_ref: data.task_card_ref || null,
                    description: data.description || null,
                    assigned_component_id: data.assigned_component_id || null,
                    estimated_manhours: data.estimated_manhours || null,
                    estimated_price: data.estimated_price || null,
                    quotation_price: data.quotation_price || null,
                    interval_threshold: data.interval_threshold || null,
                    repeat_interval: data.repeat_interval || null,
                });
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

                    {/* Task Name */}
                    <FormField control={form.control} name="task_name" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Task</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Task Name</p>}
                        </FormItem>
                    )} />

                    {/* MPD ID */}
                    <FormField control={form.control} name="mpd_id" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>MPD Task ID</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input className={inputCls(!!fieldState.error)} {...field} /></FormControl>
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
                                    <FormControl><Input className={inputCls(!!fieldState.error)} {...field} /></FormControl>
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
                                    <FormControl><Input className={inputCls(!!fieldState.error)} {...field} /></FormControl>
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
                                    <FormControl><Textarea className="min-h-[100px] text-sm border-gray-300" {...field} /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Description</p>}
                        </FormItem>
                    )} />

                    {/* Assigned Component */}
                    <FormField control={form.control} name="assigned_component_id" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}> Service Assigned Component</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={selectCls(!!fieldState.error)}>
                                                <SelectValue placeholder="Select component" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {components.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {fieldState.error && <SelectErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Assigned Component</p>}
                        </FormItem>
                    )} />

                    {/* Zones */}
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
                                            placeholder="Select zones"
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
                                    <FormControl><Input type="number" step="0.1" className={inputCls(!!fieldState.error)} {...field} /></FormControl>
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
                                    <FormField control={form.control} name="currency" render={({ field: cf }) => (
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
                                    <FormField control={form.control} name="currency" render={({ field: cf }) => (
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
                    <FormField control={form.control} name="interval_threshold" render={({ field, fieldState }) => (
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
                                        <FormControl><Input type="number" className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                        {fieldState.error && <ErrorBadge />}
                                    </div>
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Interval Threshold</p>}
                        </FormItem>
                    )} />

                    {/* Repeat Interval */}
                    <FormField control={form.control} name="repeat_interval" render={({ field, fieldState }) => (
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
                                        <FormControl><Input type="number" className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                        {fieldState.error && <ErrorBadge />}
                                    </div>
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Repeat Interval</p>}
                        </FormItem>
                    )} />

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
