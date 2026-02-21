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

interface Aircraft {
    id: string;
    model: string;
    msn: string;
    registration_number: string;
    engines_count: number;
    flight_hours: number;
    flight_cycles: number;
    status: string;
}

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
            setData(data || []);
        } catch (error) {
            console.error("Error fetching aircraft:", error);
            toast.error("Failed to fetch aircraft data");
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
                            <TableHead className="w-[50px]">
                                <Checkbox />
                            </TableHead>
                            <TableHead>Manufacturer & Model</TableHead>
                            <TableHead>MSN</TableHead>
                            <TableHead>Registration ID</TableHead>
                            <TableHead>Engines</TableHead>
                            <TableHead>Flight Hours</TableHead>
                            <TableHead>Flight Cycles</TableHead>
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
                            currentData.map((aircraft) => (
                                <TableRow key={aircraft.id}>
                                    <TableCell>
                                        <Checkbox />
                                    </TableCell>
                                    <TableCell className="font-medium">{aircraft.model}</TableCell>
                                    <TableCell>{aircraft.msn}</TableCell>
                                    <TableCell>{aircraft.registration_number}</TableCell>
                                    <TableCell>{aircraft.engines_count}</TableCell>
                                    <TableCell>{aircraft.flight_hours}</TableCell>
                                    <TableCell>{aircraft.flight_cycles}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${aircraft.status === "Active"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {aircraft.status}
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
