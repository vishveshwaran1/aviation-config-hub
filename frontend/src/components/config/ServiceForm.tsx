import { useState, useEffect } from "react";
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
    { label: "100 - Lower Half of Fuselage", value: "100" },
    { label: "200 - Upper Half of Fuselage", value: "200" },
    { label: "300 - Stabilizers", value: "300" },
    { label: "400 - Nacelles and Pylons", value: "400" },
    { label: "500 - Wings", value: "500" },
    { label: "600 - Landing Gear", value: "600" },
    { label: "700 - Landing Gear Doors", value: "700" },
    { label: "800 - Doors", value: "800" },
];

const AIRCRAFT_MODELS = [
    "B737-700",
    "B737-800",
    "B737-900",
    "B737-900ER",
    "A320-200",
    "ATR72-500",
    "ATR72-600",
];

export function ServiceForm() {
    const [loading, setLoading] = useState(false);
    const [components, setComponents] = useState<{ id: string; name: string }[]>([]);
    const navigate = useNavigate();

    const form = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            zones: [],
        },
    });

    useEffect(() => {
        fetchFormData();
    }, []);

    const fetchFormData = async () => {
        try {
            // Fetch Components for assignment
            const componentsData = await api.components.list();
            if (componentsData) setComponents(componentsData);
        } catch (error) {
            console.error("Error fetching form data:", error);
        }
    };

    async function onSubmit(data: ServiceFormData) {
        setLoading(true);
        try {
            await api.services.create({
                aircraft_model: data.aircraft_model,
                task_name: data.task_name,
                mpd_amm_task_ids: data.mpd_amm_task_ids || null,
                task_card_ref: data.task_card_ref || null,
                description: data.description || null,
                assigned_component_id: data.assigned_component_id || null,
                zones: data.zones,
                estimated_manhours: data.estimated_manhours || null,
                estimated_price: data.estimated_price || null,
                quotation_price: data.quotation_price || null,
                interval_threshold: data.interval_threshold || null,
                repeat_interval: data.repeat_interval || null,
            });

            toast.success("Service saved successfully");
            navigate("/dashboard");
        } catch (error: any) {
            console.error("Error saving service:", error);
            toast.error(error.message || "Failed to save service");
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
                        name="aircraft_model"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Aircraft Model</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select aircraft model" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {AIRCRAFT_MODELS.map((model) => (
                                                    <SelectItem key={model} value={model}>
                                                        {model}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="task_name"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Task Name</FormLabel>
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
                        name="mpd_amm_task_ids"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">MPD/AMM Task IDs</FormLabel>
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
                        name="task_card_ref"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Task Card Ref</FormLabel>
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
                        name="assigned_component_id"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Assigned Component</FormLabel>
                                <div className="col-span-3">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select component" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {components.map((comp) => (
                                                <SelectItem key={comp.id} value={comp.id}>
                                                    {comp.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="zones"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Zones</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <MultiSelect
                                            options={ZONE_OPTIONS}
                                            selected={field.value || []}
                                            onChange={field.onChange}
                                            placeholder="Select zones"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="estimated_manhours"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Estimated Manhours</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} />
                                    </FormControl>
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
                    <FormField
                        control={form.control}
                        name="interval_threshold"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Interval Threshold (Hours)</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="repeat_interval"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Repeat Interval (Hours)</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Description</FormLabel>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter service description..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <Button variant="outline" type="button" onClick={() => navigate("/dashboard")}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Service"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
