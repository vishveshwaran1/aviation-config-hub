import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Settings, MoreHorizontal, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { decimalToHoursMinutes } from "@/lib/utils";
import { format, addDays, addYears, addMonths } from "date-fns";

interface Aircraft {
    id: string;
    model: string;
    msn: string;
    registration_number: string;
    engines_count: number;
    flight_hours: number;
    flight_cycles: number;
    status: string;
    next_due_date?: string;
    next_due_task?: string;
}

/** Map internal status values to user-friendly display labels */
const statusDisplayLabel = (status: string): string => {
    switch (status) {
        case "Active":
            return "Serviceable";
        case "Inactive":
            return "Non-Serviceable";
        default:
            return status;
    }
};

export function AircraftTable() {
    const [data, setData] = useState<Aircraft[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemPerPage] = useState(5);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAircraft();
    }, []);

    const fetchAircraft = async () => {
        try {
            setLoading(true);
            const data = await api.aircrafts.list();
            let aircrafts = Array.isArray(data) ? data : [];
            
            try {
                const allServices = await api.services.list();
                const activeAircrafts = aircrafts.filter((a: any) => a.status === 'Active');
                const forecastsPromises = activeAircrafts.map((a: any) => api.forecast.getForAircraft(a.id));
                const allForecastsArrays = await Promise.all(forecastsPromises);
                
                const aircraftForecasts: Record<string, any[]> = {};
                activeAircrafts.forEach((a: any, index: number) => {
                    aircraftForecasts[a.id] = allForecastsArrays[index] || [];
                });
                
                aircrafts = aircrafts.map((ac: any) => {
                    if (ac.status !== 'Active') return { ...ac, next_due_date: "—" };
                    
                    const forecasts = aircraftForecasts[ac.id] || [];
                    const withAvg = forecasts.filter((f: any) => f.avg_hours);
                    const avgHours = withAvg.length > 0 ? (withAvg[withAvg.length - 1].avg_hours ?? 10) : 10;
                    const avgCycles = withAvg.length > 0 ? (withAvg[withAvg.length - 1].avg_cycles ?? 2) : 2;
                
                    const modelServices = allServices.filter((s: any) => s.aircraft_model === ac.model);
                    let earliestDate: Date | null = null;
                    let earliestTask: string | null = null;
                
                    for (const service of modelServices) {
                        const forecast = forecasts.find((f: any) => f.service_id === service.id) ?? null;
                        if (!forecast) continue;
                        
                        const unit = service.repeat_interval_unit ?? service.interval_unit ?? "Hours";
                        const repeat = service.repeat_interval ?? 0;
                        let nextDate: Date | null = null;
                        
                        if (unit === "Hours") {
                            const nextHours = (forecast.last_hours ?? 0) + repeat;
                            const remainingHours = nextHours - ac.flight_hours;
                            const numDays = remainingHours > 0 ? Math.floor(remainingHours / avgHours) : 0;
                            nextDate = addDays(new Date(), numDays);
                        } else if (unit === "Cycles") {
                            const nextCycles = (forecast.last_cycles ?? 0) + repeat;
                            const remainingCycles = nextCycles - ac.flight_cycles;
                            const numDays = remainingCycles > 0 ? Math.floor(remainingCycles / avgCycles) : 0;
                            nextDate = addDays(new Date(), numDays);
                        } else if (unit === "Years") {
                            if (forecast.last_date) {
                                nextDate = addYears(new Date(forecast.last_date), repeat);
                            }
                        } else if (unit === "Months") {
                            if (forecast.last_date) {
                                nextDate = addMonths(new Date(forecast.last_date), repeat);
                            }
                        }
                        
                        if (nextDate) {
                            if (!earliestDate || nextDate < earliestDate) {
                                earliestDate = nextDate;
                                earliestTask = service.task_name || service.mpd_id || service.id;
                            }
                        }
                    }
                    
                    return {
                        ...ac,
                        next_due_date: earliestDate ? format(earliestDate, "dd-MMM-yyyy") : "—",
                        next_due_task: earliestTask
                    };
                });
            } catch (err) {
                console.error("Failed to fetch services/forecasts for next due date", err);
                aircrafts = aircrafts.map((ac: any) => ({ ...ac, next_due_date: "—", next_due_task: undefined }));
            }

            setData(aircrafts);
        } catch (error: any) {
            console.error("Error fetching aircraft:", error);
            if (error?.status === 403 || error?.error?.toLowerCase().includes("unauth") || error?.error?.toLowerCase().includes("forbidden")) {
                toast.error("Session expired. Please log in again.");
            } else {
                toast.error("Failed to fetch aircraft data");
            }
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter((item) =>
        item.status === 'Active' &&
        Object.values(item).some(
            (value) =>
                value &&
                value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const totalPages = Math.ceil(filteredData.length / itemPerPage);
    const startIndex = (currentPage - 1) * itemPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    if (loading) {
        return <div className="text-center py-10">Loading aircraft data...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search aircraft..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Total: {filteredData.length} aircraft
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Aircraft Model</TableHead>
                            <TableHead>MSN</TableHead>
                            <TableHead>Aircraft Reg ID</TableHead>
                            {/* <TableHead>No of Engines</TableHead> */}
                            <TableHead>Flight Hours</TableHead>
                            <TableHead>Flight Cycles</TableHead>
                            <TableHead>Next Major Due</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-24">
                                    No aircraft found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentData.map((aircraft, index) => (
                                <TableRow key={aircraft.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium">{aircraft.model}</TableCell>
                                    <TableCell>{aircraft.msn}</TableCell>
                                    <TableCell>{aircraft.registration_number}</TableCell>
                                    {/* <TableCell>{aircraft.engines_count}</TableCell> */}
                                    <TableCell>{decimalToHoursMinutes(aircraft.flight_hours)}</TableCell>
                                    <TableCell>{aircraft.flight_cycles}</TableCell>
                                    <TableCell>
                                        {aircraft.next_due_date && aircraft.next_due_date !== "—" ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-xs text-slate-700">
                                                    {aircraft.next_due_task}
                                                </span>
                                                <span className="font-medium text-xs">
                                                    {aircraft.next_due_date}
                                                </span>
                                            </div>
                                        ) : (
                                            "—"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${aircraft.status === "Active"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {statusDisplayLabel(aircraft.status)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => navigate(`/aircraft/${aircraft.id}`)}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => navigate(`/aircraft/${aircraft.id}/activity`)}
                                                >
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Settings
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
