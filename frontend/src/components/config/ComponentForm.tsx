import { useState, useEffect, useRef } from "react";
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

const INITIAL_MANUFACTURERS = [
    "3M Aerospace",
    "AAR Corp",
    "Airbus",
    "Astronics Corporation",
    "Aviation Industry Corporation of China (AVIC)",
    "BAE Systems",
    "BF Goodrich Rosemount",
    "Bridgestone Aircraft Tire",
    "CFM International",
    "Champion Aerospace (Ignition systems)",
    "Collins Aerospace",
    "Crane Aerospace & Electronics",
    "Eaton Aerospace",
    "Eldec Corporation",
    "GE Aerospace",
    "GE Aviation Systems",
    "GKN Aerospace",
    "Garmin Aviation",
    "Goodyear Aviation",
    "Hamilton Sundstrand",
    "Heroux-Devtek",
    "Hexcel Corporation (Composites)",
    "Honeywell ASCA",
    "Honeywell Aerospace",
    "Honeywell International",
    "IAE (International Aero Engines)",
    "Jamco Corporation",
    "Kawasaki Heavy Industries (KHI)",
    "L3Harris Technologies",
    "Leonardo",
    "Liebherr-Aerospace",
    "Lufthansa Technik",
    "Meggitt (now part of Parker Hannifin)",
    "Michelin Aircraft",
    "Mitsubishi Heavy Industries (MHI)",
    "Moog Inc.",
    "Panasonic Avionics",
    "Parker Aerospace (Parker Hannifin)",
    "PPG Aerospace (Windshields & Sealants)",
    "Pratt & Whitney",
    "Pratt&Whitney Canada",
    "RECARO Aircraft Seating",
    "Rockwell Collins",
    "Rolls-Royce",
    "ST Engineering",
    "Safran Aircraft Engines",
    "Safran Cabin",
    "Safran Landing Systems",
    "Saint-Gobain Aerospace",
    "Sensor Systems",
    "Spirit AeroSystems",
    "Subaru Aerospace",
    "Teledyne Controls",
    "Thales Group",
    "Woodward, Inc.",
    "Zodiac Aerospace"
].sort();

interface ComponentFormProps {
    defaultValues?: any;
    onSuccess?: () => void;
}

export function ComponentForm({ defaultValues, onSuccess }: ComponentFormProps) {
    const [loading, setLoading] = useState(false);
    const [dbManufacturers, setDbManufacturers] = useState<string[]>([]);
    const [manufacturerDropdownOpen, setManufacturerDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch existing components from DB to extract their manufacturers globally
        const fetchExistingManufacturers = async () => {
            try {
                const components = await api.components.list();
                const manufacturersFromDb = components
                    .map((c: any) => c.manufacturer)
                    .filter((m: string) => m && m.trim().length > 0);
                
                setDbManufacturers([...new Set(manufacturersFromDb)] as string[]);
            } catch (error) {
                console.error("Failed to fetch manufacturers for suggestions", error);
            }
        };

        fetchExistingManufacturers();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setManufacturerDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const allManufacturers = Array.from(new Set([...INITIAL_MANUFACTURERS, ...dbManufacturers])).sort();

    const form = useForm<ComponentFormData>({
        resolver: zodResolver(componentSchema),
        mode: "onBlur",
        defaultValues: {
            manufacturer: defaultValues?.manufacturer || "",
            name: defaultValues?.name || "",
            confirm_name: defaultValues?.name || "",
            part_number: defaultValues?.part_number || "",
            confirm_part_number: defaultValues?.part_number || "",
            cmm_number: defaultValues?.cmm_number || "",
            confirm_cmm_number: defaultValues?.cmm_number || "",
            classification: defaultValues?.classification || "",
            classification_date: defaultValues?.classification_date ? new Date(defaultValues.classification_date).toISOString().split('T')[0] : "",
            class_linkage: defaultValues?.class_linkage || "",
            compatible_aircraft_models: defaultValues?.compatible_aircraft_models || [],
            estimated_currency: defaultValues?.estimated_currency || "MYR",
            quotation_currency: defaultValues?.quotation_currency || "MYR",
            estimated_price: defaultValues?.estimated_price || 0,
            quotation_price: defaultValues?.quotation_price || 0,
        },
    });

    const onFormError = (errors: any) => {
        console.error("Form Validation Errors:", errors);
        toast.error("Please fill in all required fields correctly.");
    };

    const cmmNumber = form.watch("cmm_number");

    useEffect(() => {
        if (cmmNumber) {
            if (cmmNumber.startsWith("32")) {
                form.setValue("class_linkage", "Landing Gear", { shouldValidate: true });
            } else if (cmmNumber.startsWith("24")) {
                form.setValue("class_linkage", "Electrical Power", { shouldValidate: true });
            } else if (cmmNumber.startsWith("25")) {
                form.setValue("class_linkage", "Equipment/Furnishing", { shouldValidate: true });
            }
        }
    }, [cmmNumber, form]);

    async function onSubmit(data: ComponentFormData) {
        setLoading(true);
        try {
            if (defaultValues?.id) {
                await api.components.update(defaultValues.id, data);
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
            <form onSubmit={form.handleSubmit(onSubmit, onFormError)}>
                <div className="flex flex-col gap-5">

                    {/* Component Manufacturer */}
                    <FormField control={form.control} name="manufacturer" render={({ field, fieldState }) => {
                        const filteredManufacturers = allManufacturers.filter(m => m.toLowerCase().includes(field.value?.toLowerCase() || ''));
                        return (
                            <FormItem className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-3">
                                    <FormLabel className={labelCls(!!fieldState.error)}>Component Manufacturer</FormLabel>
                                    <div className="relative flex-1" ref={dropdownRef}>
                                        <FormControl>
                                            <Input
                                                autoComplete="off"
                                                placeholder="Select or enter manufacturer"
                                                className={inputCls(!!fieldState.error)}
                                                {...field}
                                                onFocus={() => setManufacturerDropdownOpen(true)}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    setManufacturerDropdownOpen(true);
                                                }}
                                            />
                                        </FormControl>
                                        
                                        {/* Neatly Styled Suggestion Dropdown */}
                                        {manufacturerDropdownOpen && filteredManufacturers.length > 0 && (
                                            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg shadow-black/5 outline-none custom-scrollbar">
                                                <div className="p-1">
                                                    {filteredManufacturers.map(m => (
                                                        <div
                                                            key={m}
                                                            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100 hover:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault(); // Prevents input from losing focus immediately
                                                                field.onChange(m);
                                                                setManufacturerDropdownOpen(false);
                                                            }}
                                                        >
                                                            {m}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {fieldState.error && <ErrorBadge />}
                                    </div>
                                </div>
                                {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter Component Manufacturer</p>}
                            </FormItem>
                        );
                    }} />

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
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={selectCls(!!fieldState.error)}>
                                                <SelectValue placeholder="Select classification" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Rotatable">Rotatable</SelectItem>
                                            <SelectItem value="Repairable">Repairable</SelectItem>
                                            <SelectItem value="Expendable/consumable">Expendable/consumable</SelectItem>
                                            <SelectItem value="Life-Limited-part">Life-Limited-part</SelectItem>
                                            <SelectItem value="Standard parts">Standard parts</SelectItem>
                                            <SelectItem value = "Tooling/Ground Support Equipment" >Tooling/Ground Support Equipment</SelectItem>
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

                    {/* ATA Chapter */}
                    <FormField control={form.control} name="class_linkage" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <FormLabel className={labelCls(!!fieldState.error)}> ATA chapter</FormLabel>
                                <div className="relative flex-1">
                                    <FormControl><Input className={inputCls(!!fieldState.error)} {...field} placeholder="ATA chapter linkage" /></FormControl>
                                    {fieldState.error && <ErrorBadge />}
                                </div>
                            </div>
                            {fieldState.error && <p className="text-xs text-red-500 ml-[11.5rem]">Enter ATA Chapter</p>}
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
                                    <FormField control={form.control} name="estimated_currency" render={({ field: cf }) => (
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
                                    <FormField control={form.control} name="quotation_currency" render={({ field: cf }) => (
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
