import { useState, useEffect } from "react";
import { AircraftForm } from "@/components/config/AircraftForm";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Search, Pencil, Trash2, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
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
          <Button
            className="bg-[#556ee6] hover:bg-[#4a5fcc] text-white"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Create New
          </Button>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[40px]">
                  <input type="checkbox" className="translate-y-[2px]" />
                </TableHead>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>Aircraft Model</TableHead>
                <TableHead>MSN</TableHead>
                <TableHead>National Reg ID</TableHead>
                <TableHead>No of Engines</TableHead>
                <TableHead>Aircraft Received Status</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
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
                    <TableCell>
                      <input type="checkbox" className="translate-y-[2px]" />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.model}</TableCell>
                    <TableCell>{item.msn}</TableCell>
                    <TableCell>{item.registration_number}</TableCell>
                    <TableCell>{item.engines_count}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.aircraft_received_status === "Received"
                        ? "bg-blue-100 text-blue-800"
                        : item.aircraft_received_status === "Not Received"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-600"
                        }`}>
                        {item.aircraft_received_status || "Pending"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === "Active" ? "bg-green-100 text-green-800" :
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
