import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { ArrowLeft, Eye, Search } from "lucide-react";
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
  defect?: {
    id?: string;
    sl_no?: number;
    category?: string;
    defect_description?: string;
    action_taken?: string;
    mel_expiry_date?: string;
    mel_reference?: string;
    mel_repair_cat?: string;
    lic_no?: string;
    part1_description?: string;
    part1_number_on?: string;
    part1_number_off?: string;
    part1_serial_on?: string;
    part1_serial_off?: string;
    part1_cert_num?: string;
    part2_description?: string;
    part2_number_on?: string;
    part2_number_off?: string;
    part2_serial_on?: string;
    part2_serial_off?: string;
    part2_cert_num?: string;
    part_required?: string;
    part_availability?: string;
    journey_log?: {
      id?: string;
      company_name?: string;
      date?: string;
      registration?: string;
      aircraft_type?: string;
      log_sl_no?: string;
      pic_name?: string;
      pic_license_no?: string;
      pic_sign?: string;
      commander_sign?: string;
      fuel_arrival?: number | null;
      fuel_departure?: number | null;
      remaining_fuel_onboard?: number | null;
      fuel_uplift?: number | null;
      calculate_total_fuel?: number | null;
      fuel_discrepancy?: number | null;
      aircraft_total_hrs?: number | null;
      aircraft_total_cyc?: number | null;
      fuel_flight_deck_gauge?: number | null;
      fuel_density?: number | null;
      next_due_maintenance?: number | null;
      due_at_date?: string | null;
      due_at_hours?: number | null;
      due_at_cycles?: number | null;
      total_flight_hrs?: number | null;
      total_flight_cyc?: number | null;
      daily_inspection?: string | null;
      transit_inspection?: string | null;
      type_of_maintenance?: string | null;
      apu_hrs?: number | null;
      apu_cyc?: number | null;
      oil_uplift_eng1?: number | null;
      oil_uplift_eng2?: number | null;
      oil_uplift_apu?: number | null;
      hyd_fluid?: number | null;
      daily_inspection_sign?: string;
      sign_stamp?: string;
      amo_name?: string;
      amo_approval?: string;
      lae_name?: string;
      lae_license?: string;
      crs_signature?: string;
      digital_stamp?: string;
      sectors?: Array<{
        id?: string;
        sl_no?: number;
        flight_num?: string;
        sector_from?: string;
        sector_to?: string;
        on_chock_dep_date?: string;
        on_chock_dep_time?: string;
        on_chock_arr_date?: string;
        on_chock_arr_time?: string;
        on_chock_duration?: string;
        off_chock_dep_date?: string;
        off_chock_dep_time?: string;
        off_chock_arr_date?: string;
        off_chock_arr_time?: string;
        off_chock_duration?: string;
      }>;
      defects?: Array<{
        id?: string;
        sl_no?: number;
        category?: string;
        defect_description?: string;
        action_taken?: string;
        mel_expiry_date?: string;
        mel_reference?: string;
        mel_repair_cat?: string;
        lic_no?: string;
        part1_description?: string;
        part1_number_on?: string;
        part1_number_off?: string;
        part1_serial_on?: string;
        part1_serial_off?: string;
        part1_cert_num?: string;
        part2_description?: string;
        part2_number_on?: string;
        part2_number_off?: string;
        part2_serial_on?: string;
        part2_serial_off?: string;
        part2_cert_num?: string;
        part_required?: string;
        part_availability?: string;
      }>;
    };
  };
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

const DMIPanel = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<DMIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<DMIItem | null>(null);

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

  const selectedJourneyLog = selectedItem?.defect?.journey_log;
  const selectedDefect = selectedItem?.defect;

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
                <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-4 text-center">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-4 text-center">No DMIs found</td></tr>
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
            <DialogTitle className="text-lg font-bold text-gray-900">DMI Details</DialogTitle>
            <DialogDescription>
              Full saved record from the Journey Log form, including the linked defect, sector, and DMI data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">DMI</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="DMI Number" value={selectedItem?.dmi_number} />
                <DetailRow label="Status" value={<Badge variant={selectedItem?.status === 'SOURCING' ? 'outline' : 'secondary'} className={selectedItem?.status === 'SOURCING' ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-blue-600 border-blue-200 bg-blue-50'}>{selectedItem?.status || '—'}</Badge>} />
                <DetailRow label="Part Number" value={selectedItem?.part_number || selectedDefect?.part_required} />
                <DetailRow label="Description" value={selectedItem?.description || selectedDefect?.defect_description} />
                <DetailRow label="Deferral Reason" value={selectedItem?.deferral_reason} />
                <DetailRow label="MEL Reference" value={selectedItem?.mel_reference || selectedDefect?.mel_reference} />
                <DetailRow label="MEL Category" value={selectedItem?.mel_category || selectedDefect?.mel_repair_cat} />
                <DetailRow label="MEL Expiry" value={formatDate(selectedItem?.mel_expiry_date || selectedDefect?.mel_expiry_date)} />
                <DetailRow label="Defect ID" value={selectedItem?.defect_id} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Journey Log</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="Company Name" value={selectedJourneyLog?.company_name} />
                <DetailRow label="Date" value={formatDate(selectedJourneyLog?.date)} />
                <DetailRow label="Registration" value={selectedJourneyLog?.registration} />
                <DetailRow label="Aircraft Type" value={selectedJourneyLog?.aircraft_type} />
                <DetailRow label="Log Serial No" value={selectedJourneyLog?.log_sl_no} />
                <DetailRow label="PIC Name" value={selectedJourneyLog?.pic_name} />
                <DetailRow label="PIC License No" value={selectedJourneyLog?.pic_license_no} />
                <DetailRow label="PIC Sign" value={selectedJourneyLog?.pic_sign} />
                <DetailRow label="Commander Sign" value={selectedJourneyLog?.commander_sign} />
                <DetailRow label="Fuel Arrival" value={formatNumber(selectedJourneyLog?.fuel_arrival)} />
                <DetailRow label="Fuel Departure" value={formatNumber(selectedJourneyLog?.fuel_departure)} />
                <DetailRow label="Remaining Fuel Onboard" value={formatNumber(selectedJourneyLog?.remaining_fuel_onboard)} />
                <DetailRow label="Fuel Uplift" value={formatNumber(selectedJourneyLog?.fuel_uplift)} />
                <DetailRow label="Calculate Total Fuel" value={formatNumber(selectedJourneyLog?.calculate_total_fuel)} />
                <DetailRow label="Fuel Discrepancy" value={formatNumber(selectedJourneyLog?.fuel_discrepancy)} />
                <DetailRow label="Aircraft Total Hrs" value={formatNumber(selectedJourneyLog?.aircraft_total_hrs)} />
                <DetailRow label="Aircraft Total Cyc" value={formatNumber(selectedJourneyLog?.aircraft_total_cyc)} />
                <DetailRow label="Fuel Flight Deck Gauge" value={formatNumber(selectedJourneyLog?.fuel_flight_deck_gauge)} />
                <DetailRow label="Fuel Density" value={formatNumber(selectedJourneyLog?.fuel_density)} />
                <DetailRow label="Next Due Maintenance" value={formatNumber(selectedJourneyLog?.next_due_maintenance)} />
                <DetailRow label="Due At Date" value={formatDate(selectedJourneyLog?.due_at_date)} />
                <DetailRow label="Due At Hours" value={formatNumber(selectedJourneyLog?.due_at_hours)} />
                <DetailRow label="Due At Cycles" value={formatNumber(selectedJourneyLog?.due_at_cycles)} />
                <DetailRow label="Total Flight Hrs" value={formatNumber(selectedJourneyLog?.total_flight_hrs)} />
                <DetailRow label="Total Flight Cyc" value={formatNumber(selectedJourneyLog?.total_flight_cyc)} />
                <DetailRow label="Daily Inspection" value={formatDate(selectedJourneyLog?.daily_inspection)} />
                <DetailRow label="Transit Inspection" value={formatDate(selectedJourneyLog?.transit_inspection)} />
                <DetailRow label="Type Of Maintenance" value={selectedJourneyLog?.type_of_maintenance} />
                <DetailRow label="APU Hrs" value={formatNumber(selectedJourneyLog?.apu_hrs)} />
                <DetailRow label="APU Cyc" value={formatNumber(selectedJourneyLog?.apu_cyc)} />
                <DetailRow label="Oil Uplift Eng1" value={formatNumber(selectedJourneyLog?.oil_uplift_eng1)} />
                <DetailRow label="Oil Uplift Eng2" value={formatNumber(selectedJourneyLog?.oil_uplift_eng2)} />
                <DetailRow label="Oil Uplift APU" value={formatNumber(selectedJourneyLog?.oil_uplift_apu)} />
                <DetailRow label="Hyd Fluid" value={formatNumber(selectedJourneyLog?.hyd_fluid)} />
                <DetailRow label="Daily Inspection Sign" value={selectedJourneyLog?.daily_inspection_sign} />
                <DetailRow label="Sign Stamp" value={selectedJourneyLog?.sign_stamp} />
                <DetailRow label="AMO Name" value={selectedJourneyLog?.amo_name} />
                <DetailRow label="AMO Approval" value={selectedJourneyLog?.amo_approval} />
                <DetailRow label="LAE Name" value={selectedJourneyLog?.lae_name} />
                <DetailRow label="LAE License" value={selectedJourneyLog?.lae_license} />
                <DetailRow label="CRS Signature" value={selectedJourneyLog?.crs_signature} />
                <DetailRow label="Digital Stamp" value={selectedJourneyLog?.digital_stamp} />
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Sectors</h4>
                {(selectedJourneyLog?.sectors?.length ?? 0) === 0 ? (
                  <p className="text-sm text-gray-500">No sector rows saved.</p>
                ) : (
                  selectedJourneyLog?.sectors?.map((sector) => (
                    <div key={sector.id ?? sector.sl_no} className="rounded-xl border bg-gray-50 p-4 space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-widest text-[#556ee6]">Sector {sector.sl_no ?? "—"}</div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailRow label="Flight Num" value={sector.flight_num} />
                        <DetailRow label="Sector From" value={sector.sector_from} />
                        <DetailRow label="Sector To" value={sector.sector_to} />
                        <DetailRow label="On Chock Dep Date" value={sector.on_chock_dep_date} />
                        <DetailRow label="On Chock Dep Time" value={sector.on_chock_dep_time} />
                        <DetailRow label="On Chock Arr Date" value={sector.on_chock_arr_date} />
                        <DetailRow label="On Chock Arr Time" value={sector.on_chock_arr_time} />
                        <DetailRow label="On Chock Duration" value={sector.on_chock_duration} />
                        <DetailRow label="Off Chock Dep Date" value={sector.off_chock_dep_date} />
                        <DetailRow label="Off Chock Dep Time" value={sector.off_chock_dep_time} />
                        <DetailRow label="Off Chock Arr Date" value={sector.off_chock_arr_date} />
                        <DetailRow label="Off Chock Arr Time" value={sector.off_chock_arr_time} />
                        <DetailRow label="Off Chock Duration" value={sector.off_chock_duration} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Defect</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailRow label="Category" value={selectedDefect?.category} />
                  <DetailRow label="Defect Description" value={selectedDefect?.defect_description} />
                  <DetailRow label="Action Taken" value={selectedDefect?.action_taken} />
                  <DetailRow label="MEL Expiry Date" value={formatDate(selectedDefect?.mel_expiry_date)} />
                  <DetailRow label="MEL Reference" value={selectedDefect?.mel_reference} />
                  <DetailRow label="MEL Repair Cat" value={selectedDefect?.mel_repair_cat} />
                  <DetailRow label="Lic No" value={selectedDefect?.lic_no} />
                  <DetailRow label="Part Required" value={selectedDefect?.part_required} />
                  <DetailRow label="Part Availability" value={selectedDefect?.part_availability} />
                  <DetailRow label="Part1 Description" value={selectedDefect?.part1_description} />
                  <DetailRow label="Part1 Number On" value={selectedDefect?.part1_number_on} />
                  <DetailRow label="Part1 Number Off" value={selectedDefect?.part1_number_off} />
                  <DetailRow label="Part1 Serial On" value={selectedDefect?.part1_serial_on} />
                  <DetailRow label="Part1 Serial Off" value={selectedDefect?.part1_serial_off} />
                  <DetailRow label="Part1 Cert Num" value={selectedDefect?.part1_cert_num} />
                  <DetailRow label="Part2 Description" value={selectedDefect?.part2_description} />
                  <DetailRow label="Part2 Number On" value={selectedDefect?.part2_number_on} />
                  <DetailRow label="Part2 Number Off" value={selectedDefect?.part2_number_off} />
                  <DetailRow label="Part2 Serial On" value={selectedDefect?.part2_serial_on} />
                  <DetailRow label="Part2 Serial Off" value={selectedDefect?.part2_serial_off} />
                  <DetailRow label="Part2 Cert Num" value={selectedDefect?.part2_cert_num} />
                </div>
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

export default DMIPanel;