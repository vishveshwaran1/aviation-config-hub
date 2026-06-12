import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DMIItem {
  id: string;
  dmi_number: string;
  defect_id: string;
  part_number: string;
  description: string;
  status: string;
  deferral_reason: string;
  mel_reference: string;
  mel_category: string;
  mel_expiry_date: string;
  defect?: any;
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const formatNumber = (value?: number | null) => {
  if (value === null || value === undefined || value === Number.NaN) return "—";
  return String(value);
};

const DetailRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="rounded-lg border bg-white px-3 py-2">
    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{label}</p>
    <p className="mt-1 text-sm font-medium text-gray-900 break-words">{value ?? "—"}</p>
  </div>
);

const RequisitionSourcingPanel = () => {
  const [items, setItems] = useState<DMIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<DMIItem | null>(null);

  useEffect(() => {
    setLoading(true);
    api.dmi.getAll()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((i) =>
    (i.dmi_number || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.part_number || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.defect?.defect_description || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedJourneyLog = selectedItem?.defect?.journey_log;
  const selectedDefect = selectedItem?.defect;

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-xl bg-[#ffffff] px-6 py-5 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#556ee6] font-bold mb-0.5">Supply Chain (S2)</p>
            <h1 className="text-lg font-bold text-gray-900 leading-none">Requisition & Sourcing (PR)</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search items required..."
                className="h-8 pl-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f8f9fa] border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">DMI Number</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Aircraft Reg</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Defect Description</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Required Part Info</th>
                <th className="px-4 py-3 font-semibold text-gray-600">MEL Ref</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-4 text-center">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-4 text-center">No missing parts / DMIs found</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.dmi_number || "—"}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.defect?.journey_log?.registration || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status === 'SOURCING' ? 'outline' : 'secondary'} className={item.status === 'SOURCING' ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-blue-600 border-blue-200 bg-blue-50'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{item.defect?.defect_description || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div><span className="font-semibold text-gray-500">Req PN:</span> {item.defect?.part1_number_on || item.part_number || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.mel_reference || item.defect?.mel_reference || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Requisition Need Details</DialogTitle>
            <DialogDescription>
              Full record of the requested part that is currently missing from inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">DMI & Part Requirement</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="DMI Number" value={selectedItem?.dmi_number} />
                <DetailRow label="Status" value={<Badge variant={selectedItem?.status === 'SOURCING' ? 'outline' : 'secondary'} className={selectedItem?.status === 'SOURCING' ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-blue-600 border-blue-200 bg-blue-50'}>{selectedItem?.status || '—'}</Badge>} />
                <DetailRow label="Part Number" value={selectedItem?.part_number || selectedDefect?.part_required} />
                <DetailRow label="Description" value={selectedItem?.description || selectedDefect?.defect_description} />
                <DetailRow label="Deferral Reason" value={selectedItem?.deferral_reason} />
                <DetailRow label="MEL Reference" value={selectedItem?.mel_reference || selectedDefect?.mel_reference} />
                <DetailRow label="MEL Category" value={selectedItem?.mel_category || selectedDefect?.mel_repair_cat} />
                <DetailRow label="MEL Expiry" value={formatDate(selectedItem?.mel_expiry_date || selectedDefect?.mel_expiry_date)} />
                <DetailRow label="Aircraft Reg" value={selectedJourneyLog?.registration} />
              </div>
            </section>
            
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Defect Details</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="Category" value={selectedDefect?.category} />
                <DetailRow label="Defect Description" value={selectedDefect?.defect_description} />
                <DetailRow label="Action Taken" value={selectedDefect?.action_taken} />
                <DetailRow label="Lic No" value={selectedDefect?.lic_no} />
                <DetailRow label="Part Required" value={selectedDefect?.part_required} />
                <DetailRow label="Part Availability" value={selectedDefect?.part_availability} />
                <DetailRow label="Part1 Description" value={selectedDefect?.part1_description} />
                <DetailRow label="Part1 Number On" value={selectedDefect?.part1_number_on} />
                <DetailRow label="Part1 Number Off" value={selectedDefect?.part1_number_off} />
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedItem(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequisitionSourcingPanel;
