import { useState, useEffect } from "react";
import { AircraftForm } from "@/components/config/AircraftForm";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Search, Pencil, Trash2, ThumbsUp, ThumbsDown, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Aircraft {
  id: string;
  model: string;
  msn: string;
  registration_number: string;
  engines_count: number;
  status?: string;
  aircraft_received_status?: string;
  [key: string]: any;
}

type StatusUnion = "Active" | "Inactive" | "Maintenance" | "Storage" | "Pending" | "Declined";

const AircraftSetup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null);
  const [data, setData] = useState<Aircraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; model: string } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await api.aircrafts.list();
      if (Array.isArray(result)) {
        setData(result);
      } else if (result?.data && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch aircrafts:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for editId in URL (e.g., from Dashboard)
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("editId");

    if (editId && !editingAircraft && !isCreating) {
      const fetchEdit = async () => {
        try {
          const result = await api.aircrafts.get(editId);
          if (result) setEditingAircraft(result);
          // Remove param after loading
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error("Failed to fetch aircraft for edit:", err);
        }
      };
      fetchEdit();
    } else if (!isCreating && !editingAircraft) {
      fetchData();
    }
  }, [isCreating, editingAircraft]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.aircrafts.update(id, { status: newStatus });
      setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      toast.success(`Aircraft ${newStatus === "Active" ? "approved" : "declined"}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string, model: string) => {
    setDeleteTarget({ id, model });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.aircrafts.delete(deleteTarget.id);
      setData(prev => prev.filter(item => item.id !== deleteTarget.id));
      toast.success("Aircraft deleted");
    } catch {
      toast.error("Failed to delete aircraft");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const exportToExcel = () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = data.map((item, index) => {
      const components = Array.isArray(item.components) ? item.components : [];
      const getComp = (section: string) => components.find((c: any) => c.section === section) || {};

      const mapped: any = {
        "#": index + 1,
        "Aircraft Model": item.model || "-",
        "MSN": item.msn || "-",
        "Registration Number": item.registration_number || "-",
        "No of Engines": item.engines_count || 0,
        "Aircraft Received Status": item.aircraft_received_status || "Pending",
        "Approval Status": item.status || "Pending",
        "Manufactured Date": item.manufacture_date ? new Date(item.manufacture_date).toLocaleDateString() : "-",
        "Date Received": item.delivery_date ? new Date(item.delivery_date).toLocaleDateString() : "-",
        "Flight Hours": item.flight_hours || 0,
        "Flight Cycles": item.flight_cycles || 0,
      };

      for (let i = 1; i <= Math.max(item.engines_count || 2, 2); i++) {
        const e = getComp(`Engine ${i}`);
        mapped[`Engine ${i} Manufacturer`] = e.manufacturer || "-";
        mapped[`Engine ${i} Model`] = e.model || "-";
        mapped[`Engine ${i} Serial`] = e.serial_number || "-";
        mapped[`Engine ${i} Part No`] = e.part_number || "-";
        mapped[`Engine ${i} Status`] = e.status || "-";
        mapped[`Engine ${i} Mfg Date`] = e.manufacture_date ? new Date(e.manufacture_date).toLocaleDateString() : "-";
        mapped[`Engine ${i} Total Hours`] = e.hours_since_new || 0;
        mapped[`Engine ${i} Total Cycles`] = e.cycles_since_new || 0;
        mapped[`Engine ${i} Last Shop Visit`] = e.last_shop_visit_date ? new Date(e.last_shop_visit_date).toLocaleDateString() : "-";
        mapped[`Engine ${i} Time Since Visit`] = e.time_since_visit || 0;
        mapped[`Engine ${i} Cycle Since Visit`] = e.cycle_since_visit || 0;
      }

      const apu = getComp("APU");
      mapped["APU Manufacturer"] = apu.manufacturer || "-";
      mapped["APU Model"] = apu.model || "-";
      mapped["APU Serial"] = apu.serial_number || "-";
      mapped["APU Part No"] = apu.part_number || "-";
      mapped["APU Status"] = apu.status || "-";
      mapped["APU Mfg Date"] = apu.manufacture_date ? new Date(apu.manufacture_date).toLocaleDateString() : "-";
      mapped["APU Total Hours"] = apu.hours_since_new || 0;
      mapped["APU Total Cycles"] = apu.cycles_since_new || 0;
      mapped["APU Last Shop Visit"] = apu.last_shop_visit_date ? new Date(apu.last_shop_visit_date).toLocaleDateString() : "-";
      mapped["APU Time Since Visit"] = apu.time_since_visit || 0;
      mapped["APU Cycle Since Visit"] = apu.cycle_since_visit || 0;

      const mlgL = getComp("Main Landing Gear Left");
      mapped["MLG Left Manufacturer"] = mlgL.manufacturer || "-";
      mapped["MLG Left Model"] = mlgL.model || "-";
      mapped["MLG Left Serial"] = mlgL.serial_number || "-";
      mapped["MLG Left Part No"] = mlgL.part_number || "-";
      mapped["MLG Left Status"] = mlgL.status || "-";
      mapped["MLG Left Mfg Date"] = mlgL.manufacture_date ? new Date(mlgL.manufacture_date).toLocaleDateString() : "-";
      mapped["MLG Left Total Hours"] = mlgL.hours_since_new || 0;
      mapped["MLG Left Total Cycles"] = mlgL.cycles_since_new || 0;
      mapped["MLG Left Last Shop Visit"] = mlgL.last_shop_visit_date ? new Date(mlgL.last_shop_visit_date).toLocaleDateString() : "-";
      mapped["MLG Left Time Since Visit"] = mlgL.time_since_visit || 0;
      mapped["MLG Left Cycle Since Visit"] = mlgL.cycle_since_visit || 0;

      const mlgR = getComp("Main Landing Gear Right");
      mapped["MLG Right Manufacturer"] = mlgR.manufacturer || "-";
      mapped["MLG Right Model"] = mlgR.model || "-";
      mapped["MLG Right Serial"] = mlgR.serial_number || "-";
      mapped["MLG Right Part No"] = mlgR.part_number || "-";
      mapped["MLG Right Status"] = mlgR.status || "-";
      mapped["MLG Right Mfg Date"] = mlgR.manufacture_date ? new Date(mlgR.manufacture_date).toLocaleDateString() : "-";
      mapped["MLG Right Total Hours"] = mlgR.hours_since_new || 0;
      mapped["MLG Right Total Cycles"] = mlgR.cycles_since_new || 0;
      mapped["MLG Right Last Shop Visit"] = mlgR.last_shop_visit_date ? new Date(mlgR.last_shop_visit_date).toLocaleDateString() : "-";
      mapped["MLG Right Time Since Visit"] = mlgR.time_since_visit || 0;
      mapped["MLG Right Cycle Since Visit"] = mlgR.cycle_since_visit || 0;

      const nlg = getComp("Nose Landing Gear");
      mapped["NLG Manufacturer"] = nlg.manufacturer || "-";
      mapped["NLG Model"] = nlg.model || "-";
      mapped["NLG Serial"] = nlg.serial_number || "-";
      mapped["NLG Part No"] = nlg.part_number || "-";
      mapped["NLG Status"] = nlg.status || "-";
      mapped["NLG Mfg Date"] = nlg.manufacture_date ? new Date(nlg.manufacture_date).toLocaleDateString() : "-";
      mapped["NLG Total Hours"] = nlg.hours_since_new || 0;
      mapped["NLG Total Cycles"] = nlg.cycles_since_new || 0;
      mapped["NLG Last Shop Visit"] = nlg.last_shop_visit_date ? new Date(nlg.last_shop_visit_date).toLocaleDateString() : "-";
      mapped["NLG Time Since Visit"] = nlg.time_since_visit || 0;
      mapped["NLG Cycle Since Visit"] = nlg.cycle_since_visit || 0;

      return mapped;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Aircrafts");
    XLSX.writeFile(workbook, "Aircraft_List.xlsx");
    toast.success("Excel sheet downloaded successfully");
  };

  /* ── Header row shared by both views ── */
  const PageHeader = ({ showBack = false }: { showBack?: boolean }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-bold tracking-tight uppercase text-[#343a40]">
        AIRCRAFT SETUP
      </h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Configuration / Aircraft Setup</span>
        {showBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setIsCreating(false); setEditingAircraft(null); }}
          >
            ← Back
          </Button>
        )}
      </div>
    </div>
  );

  /* ── Form view ── */
  if (isCreating || editingAircraft) {
    return (
      <div className="w-full pb-10">
        <PageHeader showBack />
        <div className="bg-white border rounded-lg p-8 shadow-sm max-w-7xl mx-auto">
          <AircraftForm
            defaultValues={
              editingAircraft
                ? {
                  ...editingAircraft,
                  status: (editingAircraft.status as StatusUnion) ?? "Pending",
                  aircraft_received_status: (editingAircraft.aircraft_received_status as "New" | "Used") ?? "New",
                }
                : undefined
            }
            onSuccess={() => { setIsCreating(false); setEditingAircraft(null); }}
          />
        </div>
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div className="w-full pb-10">
      <PageHeader />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Aircraft"
        description={`Are you sure you want to delete "${deleteTarget?.model}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {/* <Button variant="outline" onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button> */}
            <Button
              className="bg-[#556ee6] hover:bg-[#4a5fcc] text-white"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Create New
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>Aircraft Model</TableHead>
                <TableHead>MSN</TableHead>
                <TableHead>Aircraft Reg ID</TableHead>
                <TableHead>No of Engines</TableHead>   
                <TableHead>Approval Status</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id ?? index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.model}</TableCell>
                    <TableCell>{item.msn}</TableCell>
                    <TableCell>{item.registration_number}</TableCell>
                    <TableCell>{item.engines_count}</TableCell>
                    
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full ml-5 text-xs font-semibold ${item.status === "Active" ? "bg-green-100 text-green-800" :
                        item.status === "Declined" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                        {item.status || "Pending"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-green-600 hover:bg-green-50"
                          onClick={() => handleStatusUpdate(item.id, "Active")}
                          title="Approve"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-orange-500 hover:bg-orange-50"
                          onClick={() => handleStatusUpdate(item.id, "Declined")}
                          title="Decline"
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                          onClick={() => setEditingAircraft({ ...item })}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(item.id, item.model)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AircraftSetup;
