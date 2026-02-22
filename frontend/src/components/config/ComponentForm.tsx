import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
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

interface ComponentFormProps {
    defaultValues?: any;
    onSuccess?: () => void;
}

export function ComponentForm({ defaultValues, onSuccess }: ComponentFormProps) {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const form = useForm<ComponentFormData>({
        resolver: zodResolver(componentSchema),
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
                // Edit mode — PATCH
                const res = await fetch(`http://localhost:3000/api/components/${defaultValues.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
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
            console.error("Error saving component:", error);
            toast.error(error.message || "Failed to save component");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    <FormField
                        control={form.control}
                        name="manufacturer"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Component Manufacturer</FormLabel>
                                <div className="col-span-3">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select manufacturer" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Hamilton Sundstrand">Hamilton Sundstrand</SelectItem>
                                            <SelectItem value="Honeywell International">Honeywell International</SelectItem>
                                            <SelectItem value="Pratt&Whitney Canada">Pratt&Whitney Canada</SelectItem>
                                            <SelectItem value="Eaton Aerospace">Eaton Aerospace</SelectItem>
                                            <SelectItem value="Honeywell ASCA">Honeywell ASCA</SelectItem>
                                            <SelectItem value="CFM International">CFM International</SelectItem>
                                            <SelectItem value="BAE Systems">BAE Systems</SelectItem>
                                            <SelectItem value="Rockwell Collins">Rockwell Collins</SelectItem>
                                            <SelectItem value="Eldec Corporation">Eldec Corporation</SelectItem>
                                            <SelectItem value="Sensor Systems">Sensor Systems</SelectItem>
                                            <SelectItem value="GE Aviation Systems">GE Aviation Systems</SelectItem>
                                            <SelectItem value="BF Goodrich Rosemount">BF Goodrich Rosemount</SelectItem>
                                            <SelectItem value="Safran Landing Systems">Safran Landing Systems</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Component Name</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirm_name"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Confirm Component Name</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="part_number"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Part No</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirm_part_number"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Confirm Part No</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cmm_number"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">CMM No</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirm_cmm_number"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Confirm CMM No</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="classification"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Component Classification</FormLabel>
                                <div className="col-span-3">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
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
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="classification_date"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Classification Date</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="class_linkage"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Component Class Linkage</FormLabel>
                                <div className="col-span-3">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select class linkage" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Subassembly">Subassembly</SelectItem>
                                            <SelectItem value="Single">Single</SelectItem>
                                            <SelectItem value="Consumable">Consumable</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="compatible_aircraft_models"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Compatible Aircraft Models</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <MultiSelect
                                            options={AIRCRAFT_MODELS}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select aircraft models"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Currency</FormLabel>
                                <div className="col-span-3">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="MYR">MYR</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="estimated_price"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Estimated Price</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="quotation_price"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Quotation Price</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <Button variant="outline" type="button" onClick={() => onSuccess ? onSuccess() : navigate("/config/components")}>
                        ← Back
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : defaultValues?.id ? "Update Component" : "Save Component"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
