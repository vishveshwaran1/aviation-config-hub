import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Search, Trash2, Upload, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as xlsx from "xlsx";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface InventoryItem {
  id: string;
  part_number: string;
  description?: string;
  ata?: string;
  effectivity?: string;
  interchangeable?: string;
  sn_or_batch?: string;
  condition?: string;
  cert_type?: string;
  cure_date?: string;
  on_hand: number;
  reserved: number;
  available: number;
  min_stock: number;
  lead_time_days: number;
}

const InventoryPanel = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState<Partial<InventoryItem>>({
    part_number: "", description: "", ata: "", effectivity: "", interchangeable: "",
    sn_or_batch: "", condition: "", cert_type: "", cure_date: "", on_hand: 0,
    reserved: 0, available: 0, min_stock: 0, lead_time_days: 0
  });

  const [importRows, setImportRows] = useState<Partial<InventoryItem>[]>([]);
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadItems = () => {
    setLoading(true);
    api.inventory.getAll()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const bstr = ev.target?.result;
        const workbook = xlsx.read(bstr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rows = xlsx.utils.sheet_to_json(worksheet, { raw: false }) as Record<string, string>[];
        
        const parseNumber = (val: any): number => {
          if (val === undefined || val === null || val === '') return 0;
          const cleaned = String(val).replace(/,/g, '').trim();
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? 0 : parsed;
        };

        const newItems: Partial<InventoryItem>[] = rows.map((r) => {
          // Normalize keys to lowercase and remove spaces/special characters
          const normR: Record<string, string> = {};
          for (const key in r) {
            const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            normR[normalizedKey] = r[key];
          }

          return {
            part_number:       normR["partno"] ?? normR["partnumber"] ?? normR["partnumberpn"] ?? normR["pn"] ?? "",
            description:       normR["description"] ?? normR["desc"] ?? "",
            ata:               normR["ata"] ?? "",
            effectivity:       normR["effectivity"] ?? "",
            interchangeable:   normR["interchangeable"] ?? normR["ic"] ?? "",
            sn_or_batch:       normR["snorbatch"] ?? normR["serialno"] ?? normR["sn"] ?? normR["serialnumber"] ?? normR["batch"] ?? "",
            condition:         normR["condition"] ?? normR["cond"] ?? "",
            cert_type:         normR["certtype"] ?? normR["cert"] ?? "",
            cure_date:         normR["curedate"] ?? undefined,
            on_hand:           parseNumber(normR["onhand"]),
            reserved:          parseNumber(normR["reserved"]),
            available:         parseNumber(normR["available"]),
            min_stock:         parseNumber(normR["minstock"] ?? normR["min"]),
            lead_time_days:    parseNumber(normR["leadtimedays"] ?? normR["leadtime"])
          };
        }).filter(i => i.part_number);

        if (newItems.length === 0) {
          toast({ title: "No valid data found", description: "Make sure the file contains a Part No. column", variant: "destructive" });
          return;
        }

        setImportRows(newItems);
        setShowImportModal(true);
      } catch (error) {
        console.error(error);
        toast({ title: "Upload Failed", description: "Failed to process the Excel file.", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
    
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmImport = async () => {
    if (importRows.length === 0) return;
    setImporting(true);
    try {
      // Loop through sequentially to ensure API success per item
      for (const item of importRows) {
        await api.inventory.create(item);
      }
      toast({ title: "Import Success", description: `Added ${importRows.length} items from Excel` });
      setShowImportModal(false);
      setImportRows([]);
      loadItems();
    } catch (error) {
      console.error(error);
      toast({ title: "Import Failed", description: "An error occurred during import.", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handleManualSave = async () => {
    if (!manualEntry.part_number) {
      toast({ title: "Validation Error", description: "Part Number is required", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        ...manualEntry,
        on_hand: Number(manualEntry.on_hand),
        reserved: Number(manualEntry.reserved),
        available: Number(manualEntry.available),
        min_stock: Number(manualEntry.min_stock),
        lead_time_days: Number(manualEntry.lead_time_days)
      };

      if (isEditMode && editingId) {
        await api.inventory.update(editingId, payload);
        toast({ title: "Success", description: "Inventory item updated" });
      } else {
        await api.inventory.create(payload);
        toast({ title: "Success", description: "Inventory item added manually" });
      }
      setIsManualEntryOpen(false);
      loadItems();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: `Could not ${isEditMode ? "update" : "add"} inventory item`, variant: "destructive" });
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setManualEntry({ ...item, cure_date: item.cure_date ? new Date(item.cure_date).toISOString().split('T')[0] : "" });
    setEditingId(item.id);
    setIsEditMode(true);
    setIsManualEntryOpen(true);
  };

  const openAddModal = () => {
    setManualEntry({
      part_number: "", description: "", ata: "", effectivity: "", interchangeable: "",
      sn_or_batch: "", condition: "", cert_type: "", cure_date: "", on_hand: 0,
      reserved: 0, available: 0, min_stock: 0, lead_time_days: 0
    });
    setIsEditMode(false);
    setEditingId(null);
    setIsManualEntryOpen(true);
  };

  const filtered = items.filter((i) =>
    i.part_number.toLowerCase().includes(search.toLowerCase()) ||
    (i.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-xl bg-[#ffffff] px-6 py-5 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {id && (
              <button
                onClick={() => navigate(`/aircraft/${id}/activity`)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-black hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-[#556ee6] font-bold mb-0.5">{id ? "Aircraft Activity" : "Supply Chain (S1)"}</p>
              <h1 className="text-lg font-bold text-gray-900 leading-none">Inventory & Stock Check</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                className="h-8 pl-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button
              className="h-8 text-xs font-semibold px-4 bg-[#556ee6] hover:bg-[#556ee6]/90 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              Upload Excel
            </Button>
            
            <Button className="h-8 text-xs font-semibold px-4 bg-[#556ee6] hover:bg-[#556ee6]/90 transition-colors" onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Manually
            </Button>
            <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Edit Inventory Item" : "Add Inventory Item"}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Part Number *</Label>
                    <Input
                      value={manualEntry.part_number || ""}
                      onChange={(e) => setManualEntry({ ...manualEntry, part_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={manualEntry.description || ""}
                      onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ATA</Label>
                    <Input
                      value={manualEntry.ata || ""}
                      onChange={(e) => setManualEntry({ ...manualEntry, ata: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Effectivity</Label>
                    <Input
                      value={manualEntry.effectivity || ""}
                      onChange={(e) => setManualEntry({ ...manualEntry, effectivity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Interchangeable</Label>
                    <Input
                      value={manualEntry.interchangeable || ""}
                      onChange={(e) => setManualEntry({ ...manualEntry, interchangeable: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>S/N or Batch</Label>
                    <Input
                      value={manualEntry.sn_or_batch || ""}
                      onChange={(e) => setManualEntry({ ...manualEntry, sn_or_batch: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Input
                      value={manualEntry.condition || ""}
                      onChange={(e) => setManualEntry({ ...manualEntry, condition: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cert Type</Label>
                    <Input
                      value={manualEntry.cert_type || ""}
                      onChange={(e) => setManualEntry({ ...manualEntry, cert_type: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cure Date</Label>
                    <Input
                      type="date"
                      value={manualEntry.cure_date || ""}
                      onChange={(e) => setManualEntry({ ...manualEntry, cure_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>On-Hand</Label>
                    <Input
                      type="number"
                      value={manualEntry.on_hand || 0}
                      onChange={(e) => setManualEntry({ ...manualEntry, on_hand: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reserved</Label>
                    <Input
                      type="number"
                      value={manualEntry.reserved || 0}
                      onChange={(e) => setManualEntry({ ...manualEntry, reserved: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Available</Label>
                    <Input
                      type="number"
                      value={manualEntry.available || 0}
                      onChange={(e) => setManualEntry({ ...manualEntry, available: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Stock</Label>
                    <Input
                      type="number"
                      value={manualEntry.min_stock || 0}
                      onChange={(e) => setManualEntry({ ...manualEntry, min_stock: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lead Time Days</Label>
                    <Input
                      type="number"
                      value={manualEntry.lead_time_days || 0}
                      onChange={(e) => setManualEntry({ ...manualEntry, lead_time_days: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsManualEntryOpen(false)}>Cancel</Button>
                  <Button onClick={handleManualSave} className="bg-[#556ee6] hover:bg-[#556ee6]/90">Save Item</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/*  Excel Import Preview Dialog  */}
            <Dialog open={showImportModal} onOpenChange={(open) => !open && setShowImportModal(false)}>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-[#556ee6]">
                    <Upload className="h-5 w-5" /> Confirm Import
                  </DialogTitle>
                  <DialogDescription>
                    <strong>{importRows.length}</strong> inventory row(s) detected. Review a preview below, then approve to import.
                  </DialogDescription>
                </DialogHeader>

                <div className="overflow-x-auto max-h-64 border rounded-lg text-xs">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {["Part No.", "Description", "ATA", "S/N or Batch", "Cond", "On-Hand", "Reserved", "Available", "Min", "Lead Time"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {importRows.slice(0, 20).map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 font-mono">{r.part_number || "NA"}</td>
                          <td className="px-3 py-1.5 max-w-[140px] truncate">{r.description || "NA"}</td>
                          <td className="px-3 py-1.5">{r.ata || "NA"}</td>
                          <td className="px-3 py-1.5 font-mono">{r.sn_or_batch || "NA"}</td>
                          <td className="px-3 py-1.5">{r.condition || "NA"}</td>
                          <td className="px-3 py-1.5 tabular-nums">{r.on_hand ?? 0}</td>
                          <td className="px-3 py-1.5 tabular-nums">{r.reserved ?? 0}</td>
                          <td className="px-3 py-1.5 tabular-nums text-green-600 font-semibold">{r.available ?? 0}</td>
                          <td className="px-3 py-1.5 tabular-nums">{r.min_stock ?? 0}</td>
                          <td className="px-3 py-1.5 tabular-nums">{r.lead_time_days ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importRows.length > 20 && (
                    <p className="text-center text-muted-foreground py-2 text-[11px]">
                      …and {importRows.length - 20} more rows
                    </p>
                  )}
                </div>

                <DialogFooter className="gap-2 mt-4 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => { setShowImportModal(false); setImportRows([]); }}
                  >
                    <XCircle className="h-4 w-4" /> Decline
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-[#556ee6] hover:bg-[#4560d5]"
                    disabled={importing}
                    onClick={handleConfirmImport}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {importing ? "Importing..." : `Approve & Import ${importRows.length} rows`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f8f9fa] border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Description</th>
                <th className="px-4 py-3 font-semibold text-gray-600">ATA</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Part No / I/C</th>
                <th className="px-4 py-3 font-semibold text-gray-600">S/N or Batch</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Cond</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Available</th>
                <th className="px-4 py-3 font-semibold text-gray-600">On-Hand</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Reserved</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Min Stock</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-4 text-center">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-4 text-center">No items found</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.description || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{item.ata || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{item.part_number || item.interchangeable || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{item.sn_or_batch || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{item.condition || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{item.available}</td>
                    <td className="px-4 py-3 text-blue-600">{item.on_hand}</td>
                    <td className="px-4 py-3 text-orange-600">{item.reserved}</td>
                    <td className="px-4 py-3 text-gray-600">{item.min_stock}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(item)} className="h-8 px-2 text-xs">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryPanel;