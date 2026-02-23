import { useState, useEffect } from "react";
import { ServiceForm } from "@/components/config/ServiceForm";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ServiceItem {
  id: string;
  task_name: string;
  aircraft_model: string;
  mpd_id?: string;
  amm_id?: string;
  task_card_ref?: string;
  [key: string]: any;
}

const ServiceListSetup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [data, setData] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await api.services.list();
      if (Array.isArray(result)) {
        setData(result);
      } else if (result.data && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCreating && !editingItem) {
      fetchData();
    }
  }, [isCreating, editingItem]);

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.services.delete(deleteTarget.id);
      setData(prev => prev.filter(item => item.id !== deleteTarget.id));
      toast.success("Service deleted");
    } catch {
      toast.error("Failed to delete service");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredData = data.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (isCreating || editingItem) {
    return (
      <div className="w-full pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {editingItem ? "Edit Service" : "SERVICE LIST SETUP"}
            </h2>
            {/* <p className="text-muted-foreground text-sm mt-1">Define maintenance tasks and services.</p> */}
          </div>
          <Button variant="outline" onClick={() => { setIsCreating(false); setEditingItem(null); }}>
            ← Back to List
          </Button>
        </div>
        <div className="border rounded-lg p-8 bg-white shadow-sm max-w-7xl mx-auto">
          <ServiceForm
            defaultValues={editingItem ?? undefined}
            onSuccess={() => { setIsCreating(false); setEditingItem(null); fetchData(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold tracking-tight uppercase text-[#343a40]">SERVICE LIST SETUP</h2>
        <div className="text-sm text-muted-foreground">Configuration / Service List Setup</div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Service"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
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
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="bg-[#556ee6] hover:bg-[#4a5fcc] text-white" onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create New
          </Button>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Aircraft Model</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>MPD ID</TableHead>
                <TableHead>AMM ID</TableHead>
                <TableHead>Task Card Ref</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Comp Price</TableHead>
                <TableHead>Service Price</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">No results found.</TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.aircraft_model}</TableCell>
                    <TableCell className="font-medium">{item.task_name}</TableCell>
                    <TableCell>{item.mpd_id || '-'}</TableCell>
                    <TableCell>{item.amm_id || '-'}</TableCell>
                    <TableCell>{item.task_card_ref || '-'}</TableCell>
                    <TableCell>{Array.isArray(item.zones) ? item.zones.join(', ') : (item.zones || '-')}</TableCell>
                    <TableCell>{item.estimated_price != null ? item.estimated_price : '-'}</TableCell>
                    <TableCell>{item.quotation_price != null ? item.quotation_price : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                          onClick={() => setEditingItem(item)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(item.id, item.task_name)}
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

export default ServiceListSetup;
