import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

const DMIPanel = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<DMIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.dmi.getForAircraft(id)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = items.filter((i) =>
    (i.dmi_number || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.part_number || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.defect?.defect_description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-xl bg-[#ffffff] px-6 py-5 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/aircraft/${id}/activity`)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-black hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#556ee6] font-bold mb-0.5">Aircraft Activity</p>
              <h1 className="text-lg font-bold text-gray-900 leading-none">DMI Panel (Deferred Maintenance Items)</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search DMI..."
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
                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Defect Description</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Part Info</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Deferral Reason</th>
                <th className="px-4 py-3 font-semibold text-gray-600">MEL Ref</th>
                <th className="px-4 py-3 font-semibold text-gray-600">MEL Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-4 text-center">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-4 text-center">No DMIs found</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.dmi_number || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status === 'SOURCING' ? 'outline' : 'secondary'} className={item.status === 'SOURCING' ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-blue-600 border-blue-200 bg-blue-50'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{item.defect?.defect_description || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div><span className="font-semibold text-gray-500">Req:</span> {item.defect?.part1_number_on || item.part_number || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.deferral_reason || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div><span className="font-semibold text-gray-500">Ref:</span> {item.mel_reference || item.defect?.mel_reference || "—"}</div>
                      <div><span className="font-semibold text-gray-500">Cat:</span> {item.mel_category || item.defect?.mel_repair_cat || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.mel_expiry_date ? new Date(item.mel_expiry_date).toLocaleDateString() : (item.defect?.mel_expiry_date || "—")}
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

export default DMIPanel;