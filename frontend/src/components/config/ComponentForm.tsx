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
import { componentSchema, ComponentFormData } from "./ComponentFormSchema";
import { useNavigate } from "react-router-dom";
import { MultiSelect, Option } from "@/components/ui/multi-select";

const AIRCRAFT_MODELS: Option[] = [
    { label: "B737-700", value: "B737-700" },
    { label: "B737-800", value: "B737-800" },
    { label: "B737-900", value: "B737-900" },
    { label: "B737-900ER", value: "B737-900ER" },
    { label: "A320-200", value: "A320-200" },
    { label: "ATR72-500", value: "ATR72-500" },
    { label: "ATR72-600", value: "ATR72-600" },
];

const MANUFACTURERS = [
    "Hamilton Sundstrand", "Honeywell International", "Pratt&Whitney Canada",
    "Eaton Aerospace", "Honeywell ASCA", "CFM International", "BAE Systems",
    "Rockwell Collins", "Eldec Corporation", "Sensor Systems",
    "GE Aviation Systems", "BF Goodrich Rosemount", "Safran Landing Systems",
];

interface ComponentFormProps {
    defaultValues?: any;
    onSuccess?: () => void;
}

export function ComponentForm({ defaultValues, onSuccess }: ComponentFormProps) {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const form = useForm<ComponentFormData>({
        resolver: zodResolver(componentSchema),
        mode: "onBlur",
        defaultValues: {
            compatible_aircraft_models: [],
            currency: "MYR",
            ...defaultValues,
        },
    });

    async function onSubmit(data: ComponentFormData) {
        setLoading(true);
        try {
            if (defaultValues?.id) {
                const res = await fetch(`http://localhost:3000/api/components/${defaultValues.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
                    body: JSON.stringify(data),
                });
                if (!res.ok) throw await res.json();
                toast.success("Component updated successfully");
            } else {
                await api.components.create(data);
                toast.success("Component saved successfully");
            }
            if (onSuccess) onSuccess();
            else navigate("/config/components");
        } catch (error: any) {
            toast.error(error.message || "Failed to save component");
        } finally {
            setLoading(false);
        }
    }

    /* ── Shared field row styles ── */
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

                    {/* Component Manufacturer */}
                    <FormField control={form.control} name="manufacturer" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Component Manufacturer</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={selectCls(!!fieldState.error)}>
                                                <SelectValue placeholder="Select manufacturer" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {MANUFACTURERS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {fieldState.error && <SelectErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Component Manufacturer</p>}
                        </FormItem>
                    )} />

                    {/* Component Name */}
                    <FormField control={form.control} name="name" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Component Name</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Component Name</p>}
                        </FormItem>
                    )} />

                    {/* Confirm Component Name */}
                    <FormField control={form.control} name="confirm_name" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Re-Enter Component Name</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Confirm Component Name</p>}
                        </FormItem>
                    )} />

                    {/* Part No */}
                    <FormField control={form.control} name="part_number" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Component Part No</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Part No</p>}
                        </FormItem>
                    )} />

                    {/* Confirm Part No */}
                    <FormField control={form.control} name="confirm_part_number" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Re-enter Component  Part No</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Confirm Part No</p>}
                        </FormItem>
                    )} />

                    {/* CMM No */}
                    <FormField control={form.control} name="cmm_number" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>CMM No</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter CMM No</p>}
                        </FormItem>
                    )} />

                    {/* Confirm CMM No */}
                    <FormField control={form.control} name="confirm_cmm_number" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Re-enter CMM No</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Confirm CMM No</p>}
                        </FormItem>
                    )} />

                    {/* Component Classification */}
                    <FormField control={form.control} name="classification" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Component Classification</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={selectCls(!!fieldState.error)}>
                                                <SelectValue placeholder="Select classification" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Alternative">Alternative</SelectItem>
                                            <SelectItem value="Obsolete">Obsolete</SelectItem>
                                            <SelectItem value="Superseded">Superseded</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {fieldState.error && <SelectErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Component Classification</p>}
                        </FormItem>
                    )} />

                    {/* Classification Date */}
                    <FormField control={form.control} name="classification_date" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}> Component Classification Changed Date</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input type="date" className={inputCls(!!fieldState.error)} {...field} /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Classification Date</p>}
                        </FormItem>
                    )} />

                    {/* Component Class Linkage */}
                    <FormField control={form.control} name="class_linkage" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Component Class Linkage</FormLabel>
                                <div className="relative flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={selectCls(!!fieldState.error)}>
                                                <SelectValue placeholder="Select class linkage" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Subassembly">Subassembly</SelectItem>
                                            <SelectItem value="Single">Single</SelectItem>
                                            <SelectItem value="Consumable">Consumable</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {fieldState.error && <SelectErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Component Class Linkage</p>}
                        </FormItem>
                    )} />

                    {/* Compatible Aircraft Models */}
                    <FormField control={form.control} name="compatible_aircraft_models" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Compatible Aircraft Models</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl>
                                        <MultiSelect
                                            options={AIRCRAFT_MODELS}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select aircraft models"
                                        />
                                    </FormControl>
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Compatible Aircraft Models</p>}
                        </FormItem>
                    )} />

                    {/* Estimated Price with inline currency */}
                    <FormField control={form.control} name="estimated_price" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Estimated Price</FormLabel>
                                <div className="flex gap-2 flex-1">
                                    <FormField control={form.control} name="currency" render={({ field: cf }) => (
                                        <Select onValueChange={cf.onChange} value={cf.value}>
                                            <SelectTrigger className="w-24 shrink-0 h-9 text-sm border-gray-300">
                                                <SelectValue placeholder="CCY" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MYR">MYR</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                                <SelectItem value="EUR">EUR</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )} />
                                    <div className="relative flex-1">
                                        <FormControl>
                                            <Input type="number" step="0.01" className={inputCls(!!fieldState.error)} {...field} />
                                        </FormControl>
                                        {fieldState.error && <ErrorBadge />}
                                    </div>
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Estimated Price</p>}
                        </FormItem>
                    )} />

                    {/* Quotation Price with inline currency */}
                    <FormField control={form.control} name="quotation_price" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}>Quotation Price</FormLabel>
                                <div className="flex gap-2 flex-1">
                                    <FormField control={form.control} name="currency" render={({ field: cf }) => (
                                        <Select onValueChange={cf.onChange} value={cf.value}>
                                            <SelectTrigger className="w-24 shrink-0 h-9 text-sm border-gray-300">
                                                <SelectValue placeholder="CCY" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MYR">MYR</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                                <SelectItem value="EUR">EUR</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )} />
                                    <div className="relative flex-1">
                                        <FormControl>
                                            <Input type="number" step="0.01" className={inputCls(!!fieldState.error)} {...field} />
                                        </FormControl>
                                        {fieldState.error && <ErrorBadge />}
                                    </div>
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Quotation Price</p>}
                        </FormItem>
                    )} />

                </div>

                <div className="flex justify-end gap-4 pt-6 border-t mt-6">
                    <Button variant="outline" type="button" onClick={() => onSuccess ? onSuccess() : navigate("/config/components")}>
                        ← Back
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-[#556ee6] hover:bg-[#4a5fcc] text-white px-10 h-10">
                        {loading ? "Saving..." : defaultValues?.id ? "Update Component" : "Save Configuration"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
