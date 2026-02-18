import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { aircraftSchema, AircraftFormData } from "./AircraftFormSchema";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function AircraftForm() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const form = useForm<AircraftFormData>({
        resolver: zodResolver(aircraftSchema),
        defaultValues: {
            status: "Active",
            engines_count: 2,
        },
    });

    async function onSubmit(data: AircraftFormData) {
        setLoading(true);
        try {
            const aircraftData = await api.aircrafts.create(data);
            const aircraftId = aircraftData.id;

            const componentsToInsert = [
                {
                    aircraft_id: aircraftId,
                    section: "APU",
                    manufacturer: data.apu_manufacturer,
                    model: data.apu_model,
                    serial_number: data.apu_serial_number,
                    part_number: data.apu_part_number,
                    last_shop_visit_date: data.apu_last_shop_visit || null,
                    hours_since_new: data.apu_hours || 0,
                    cycles_since_new: data.apu_cycles || 0,
                },
                {
                    aircraft_id: aircraftId,
                    section: "Main Landing Gear Left",
                    manufacturer: data.mlg_left_manufacturer,
                    model: data.mlg_left_model,
                    serial_number: data.mlg_left_serial_number,
                    part_number: data.mlg_left_part_number,
                    last_shop_visit_date: data.mlg_left_shop_visit || null,
                    hours_since_new: data.mlg_left_hours || 0,
                    cycles_since_new: data.mlg_left_cycles || 0,
                },
                {
                    aircraft_id: aircraftId,
                    section: "Main Landing Gear Right",
                    manufacturer: data.mlg_right_manufacturer,
                    model: data.mlg_right_model,
                    serial_number: data.mlg_right_serial_number,
                    part_number: data.mlg_right_part_number,
                    last_shop_visit_date: data.mlg_right_shop_visit || null,
                    hours_since_new: data.mlg_right_hours || 0,
                    cycles_since_new: data.mlg_right_cycles || 0,
                },
                {
                    aircraft_id: aircraftId,
                    section: "Nose Landing Gear",
                    manufacturer: data.nlg_manufacturer,
                    model: data.nlg_model,
                    serial_number: data.nlg_serial_number,
                    part_number: data.nlg_part_number,
                    last_shop_visit_date: data.nlg_shop_visit || null,
                    hours_since_new: data.nlg_hours || 0,
                    cycles_since_new: data.nlg_cycles || 0,
                },
            ];

            await api.aircraftComponents.create(componentsToInsert);

            toast.success("Aircraft configuration saved successfully");
            navigate("/dashboard");
        } catch (error: any) {
            console.error("Error saving aircraft:", error);
            toast.error(error.message || "Failed to save aircraft configuration");
        } finally {
            setLoading(false);
        }
    }

    const { t } = useTranslation();

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Section A: Aircraft Setup */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('section_a')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('aircraft_model')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="B737-700">B737-700</SelectItem>
                                            <SelectItem value="B737-800">B737-800</SelectItem>
                                            <SelectItem value="B737-900">B737-900</SelectItem>
                                            <SelectItem value="B737-900ER">B737-900ER</SelectItem>
                                            <SelectItem value="A320-200">A320-200</SelectItem>
                                            <SelectItem value="ATR72-500">ATR72-500</SelectItem>
                                            <SelectItem value="ATR72-600">ATR72-600</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Added Country Field */}
                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('country')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter country" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="msn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('msn')}</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirm_msn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('re_enter_msn')}</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="registration_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>National Registration ID</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirm_registration_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Re-Enter National Registration ID</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="manufacture_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Manufactured Date (DD/MM/YYYY)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="delivery_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date Received (DD/MM/YYYY)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="flight_hours"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Aircraft Hours (HHHH-MM)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="flight_cycles"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Aircraft Cycles</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="engines_count"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>No. of Engines</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Aircraft Received Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                                            <SelectItem value="Storage">Storage</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Section B: APU Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('section_b')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="apu_manufacturer"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>APU Manufacturer</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Select..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="apu_model"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>APU Model</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Select..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="apu_serial_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>APU Serial No</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirm_apu_serial_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Re-Enter APU Serial No</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="apu_part_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>APU Part Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirm_apu_part_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Re-Enter Part Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="apu_last_shop_visit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>APU Last Shop Visit (DD/MM/YYYY)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="apu_hours"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>APU Total Hours (HHHH-MM)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="apu_cycles"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>APU Total Cycles</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Section C: Main Landing Gear Left */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('section_c')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="mlg_left_manufacturer"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Manufacturer</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Select..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mlg_left_model"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Model</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Select..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="mlg_left_serial_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Serial No</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirm_mlg_left_serial_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Re-Enter Serial No</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="mlg_left_part_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Part Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirm_mlg_left_part_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Re-Enter Part Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="mlg_left_shop_visit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Shop Visit (DD/MM/YYYY)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="mlg_left_hours"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Hours (HHHH-MM)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mlg_left_cycles"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Cycles</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Section D: Main Landing Gear Right */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('section_d')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="mlg_right_manufacturer"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Manufacturer</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Select..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mlg_right_model"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Model</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Select..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="mlg_right_serial_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Serial No</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirm_mlg_right_serial_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Re-Enter Serial No</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="mlg_right_part_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Part Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirm_mlg_right_part_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Re-Enter Part Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="mlg_right_shop_visit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Shop Visit (DD/MM/YYYY)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="mlg_right_hours"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Hours (HHHH-MM)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mlg_right_cycles"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Cycles</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Section E: Nose Landing Gear Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('section_e')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="nlg_manufacturer"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Manufacturer</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Select..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="nlg_model"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Model</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Select..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="nlg_serial_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Serial No</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirm_nlg_serial_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Re-Enter Serial No</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="nlg_part_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Part Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirm_nlg_part_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Re-Enter Part Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="nlg_shop_visit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Shop Visit (DD/MM/YYYY)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="nlg_hours"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Hours (HHHH-MM)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="nlg_cycles"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Cycles</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-4">
                    <Button variant="outline" type="button" onClick={() => navigate("/dashboard")}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Configuration"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
