import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Upload } from "lucide-react";
import { cn , decimalToHoursMinutes} from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import * as XLSX from "xlsx";


interface Sector {
  flight_num: string;
  sector_from: string;
  sector_to: string;
  on_chock_dep_date: string;
  on_chock_dep_time: string;
  on_chock_arr_date: string;
  on_chock_arr_time: string;
  on_chock_duration: string;
  off_chock_dep_date: string;
  off_chock_dep_time: string;
  off_chock_arr_date: string;
  off_chock_arr_time: string;
  off_chock_duration: string;
}

interface DefectRow {
  id: number;
  category: "PIREP" | "MAREP" | "INFO" | "CABIN";
  action_taken: string;
  defect_description: string;
  mel_expiry_date: string;
  mel_reference: string;
  mel_repair_cat: string;
  lic_no: string;
  part1_description: string;
  part1_number_on: string;
  part1_number_off: string;
  part1_serial_on: string;
  part1_serial_off: string;
  part1_cert_num: string;
  part2_description: string;
  part2_number_on: string;
  part2_number_off: string;
  part2_serial_on: string;
  part2_serial_off: string;
  part2_cert_num: string;
}

interface JourneyFormData {
  company_name: string;
  date: string;
  registration: string;
  aircraft_type: string;
  msn: string;
  log_sl_no: string;
  pic_name: string;
  pic_license_no: string;
  pic_sign: string;
  commander_sign: string;
  fuel_arrival: string;
  fuel_departure: string;
  remaining_fuel_onboard: string;
  fuel_uplift: string;
  calculate_total_fuel: string;
  fuel_discrepancy: string;
  aircraft_total_hrs: string;
  aircraft_total_cyc: string;
  fuel_flight_deck_gauge: string;
  fuel_density: string;
  next_due_maintenance: string;
  due_at_date: string;
  due_at_hours: string;
  total_flight_hrs: string;
  total_flight_cyc: string;
  daily_inspection: string;
  transit_inspection: string;
  type_of_maintenance: string;
  apu_hrs: string;
  apu_cyc: string;
  oil_uplift_eng1: string;
  oil_uplift_eng2: string;
  oil_uplift_apu: string;
  hyd_fluid: string;
  daily_inspection_sign: string;
  sign_stamp: string;
  amo_name: string;
  amo_approval: string;
  lae_name: string;
  lae_license: string;
  crs_signature: string;
  digital_stamp: string;
}


const COL_MAP: Record<string, string> = {
  "Company Name": "company_name", "Date": "date", "Registration": "registration",
  "Aircraft Type": "aircraft_type", "Log Serial No": "log_sl_no",
  "PIC Name": "pic_name", "PIC License No": "pic_license_no",
  "PIC Sign": "pic_sign", "Commander Sign": "commander_sign",
  "Fuel Arrival": "fuel_arrival", "Fuel Departure": "fuel_departure",
  "Remaining Fuel Onboard": "remaining_fuel_onboard", "Fuel Uplift": "fuel_uplift",
  "Calculate Total Fuel": "calculate_total_fuel", "Fuel Discrepancy": "fuel_discrepancy",
  "Aircraft Total Hrs": "aircraft_total_hrs", "Aircraft Total Cyc": "aircraft_total_cyc",
  "Fuel Flight Deck Gauge": "fuel_flight_deck_gauge",
  "Next Due Maintenance": "next_due_maintenance", "Due At Date": "due_at_date",
  "Due At Hours": "due_at_hours", "Total Flight Hrs": "total_flight_hrs",
  "Total Flight Cyc": "total_flight_cyc", "Daily Inspection": "daily_inspection",
  "Transit Inspection": "transit_inspection",
  "Type of Maintenance": "type_of_maintenance", "APU Hrs": "apu_hrs", "APU Cyc": "apu_cyc",
  "Oil Uplift Eng1": "oil_uplift_eng1", "Oil Uplift Eng2": "oil_uplift_eng2",
  "Oil Uplift APU": "oil_uplift_apu", "Hyd Fluid": "hyd_fluid",
  "Daily Inspection Sign": "daily_inspection_sign", "Sign Stamp": "sign_stamp",
  "AMO Name": "amo_name", "AMO Approval": "amo_approval",
  "LAE Name": "lae_name", "LAE License": "lae_license",
  "CRS Signature": "crs_signature", "Digital Stamp": "digital_stamp",
};

const SECTOR_COL_MAP: Record<string, string> = {
  "Flight Num": "flight_num", "Sector From": "sector_from", "Sector To": "sector_to",
  "On Chock Dep Date": "on_chock_dep_date", "On Chock Dep Time": "on_chock_dep_time",
  "On Chock Arr Date": "on_chock_arr_date", "On Chock Arr Time": "on_chock_arr_time",
  "On Chock Duration": "on_chock_duration",
  "Off Chock Dep Date": "off_chock_dep_date", "Off Chock Dep Time": "off_chock_dep_time",
  "Off Chock Arr Date": "off_chock_arr_date", "Off Chock Arr Time": "off_chock_arr_time",
  "Off Chock Duration": "off_chock_duration",
};

const TEMPLATE_HEADERS = [
  "Company Name", "Date", "Registration", "Aircraft Type", "Log Serial No",
  "PIC Name", "PIC License No", "PIC Sign", "Commander Sign",
  "Fuel Arrival", "Fuel Departure", "Remaining Fuel Onboard", "Fuel Uplift",
  "Calculate Total Fuel", "Fuel Discrepancy", "Aircraft Total Hrs", "Aircraft Total Cyc",
  "Fuel Flight Deck Gauge", "Next Due Maintenance", "Due At Date", "Due At Hours",
  "Total Flight Hrs", "Total Flight Cyc", "Daily Inspection", "Transit Inspection", "Type of Maintenance",
  "APU Hrs", "APU Cyc", "Oil Uplift Eng1", "Oil Uplift Eng2", "Oil Uplift APU", "Hyd Fluid",
  "Daily Inspection Sign", "Sign Stamp", "AMO Name", "AMO Approval", "LAE Name", "LAE License", "CRS Signature", "Digital Stamp",
  "S1 Flight Num", "S1 Sector From", "S1 Sector To",
  "S1 On Chock Dep Date", "S1 On Chock Dep Time", "S1 On Chock Arr Date", "S1 On Chock Arr Time", "S1 On Chock Duration",
  "S1 Off Chock Dep Date", "S1 Off Chock Dep Time", "S1 Off Chock Arr Date", "S1 Off Chock Arr Time", "S1 Off Chock Duration",
];

const TEMPLATE_SAMPLE_ROW = [
  "AeroTrend MRO Sdn Bhd", "2026-02-24", "9M-AAD", "B737-900", "9MAAD-001",
  "Capt. Ahmad Fadzil", "ATPL-MY-00142", "Yes", "Yes",
  "6800", "9200", "6800", "8500", "15300", "0", "18502", "4201",
  "6750", "2026-03-01", "2026-03-01", "18600",
  "1.25", "1", "2026-02-24", "2026-02-24", "Daily Check",
  "0.5", "2", "0.5", "0.5", "0", "0.5", "Yes", "Yes",
  "MAS Engineering", "FAMTO-001", "Mohamad Firdaus", "CAAM-L-66-1234", "Yes", "Yes",
  "AK101", "KUL", "SIN",
  "2026-02-24", "0800", "2026-02-24", "0915", "1:15",
  "2026-02-24", "0755", "2026-02-24", "0920", "1:25",
];




const EMPTY_SECTOR: Sector = {
  flight_num: "", sector_from: "", sector_to: "",
  on_chock_dep_date: "", on_chock_dep_time: "", on_chock_arr_date: "", on_chock_arr_time: "", on_chock_duration: "",
  off_chock_dep_date: "", off_chock_dep_time: "", off_chock_arr_date: "", off_chock_arr_time: "", off_chock_duration: "",
};

const EMPTY_DEFECT: Omit<DefectRow, "id"> = {
  category: "PIREP", action_taken: "", defect_description: "",
  mel_expiry_date: "", mel_reference: "", mel_repair_cat: "", lic_no: "",
  part1_description: "", part1_number_on: "", part1_number_off: "", part1_serial_on: "", part1_serial_off: "", part1_cert_num: "",
  part2_description: "", part2_number_on: "", part2_number_off: "", part2_serial_on: "", part2_serial_off: "", part2_cert_num: "",
};

const EMPTY_FORM: JourneyFormData = {
  company_name: "",
  date: "", registration: "", aircraft_type: "", msn: "", log_sl_no: "",
  pic_name: "", pic_license_no: "", pic_sign: "No", commander_sign: "No",
  fuel_arrival: "", fuel_departure: "", remaining_fuel_onboard: "", fuel_uplift: "",
  calculate_total_fuel: "", fuel_discrepancy: "", aircraft_total_hrs: "", aircraft_total_cyc: "",
  fuel_flight_deck_gauge: "", fuel_density: "",
  next_due_maintenance: "", due_at_date: "", due_at_hours: "",
  total_flight_hrs: "", total_flight_cyc: "",
  daily_inspection: "", transit_inspection: "", type_of_maintenance: "", apu_hrs: "", apu_cyc: "",
  oil_uplift_eng1: "", oil_uplift_eng2: "", oil_uplift_apu: "", hyd_fluid: "",
  daily_inspection_sign: "No", sign_stamp: "No",
  amo_name: "", amo_approval: "", lae_name: "", lae_license: "", crs_signature: "No", digital_stamp: "No",
};


const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#556ee6] whitespace-nowrap">{title}</h3>
      <div className="flex-1 border-t border-gray-100" />
    </div>
    {children}
  </div>
);

const Grid = ({ cols = 3, children }: { cols?: 2 | 3 | 4 | 6; children: React.ReactNode }) => (
  <div className={cn(
    "grid grid-cols-1 gap-4",
    cols === 2 && "sm:grid-cols-2",
    cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
    cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
    cols === 6 && "sm:grid-cols-3 lg:grid-cols-6",
  )}>{children}</div>
);

const F = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-gray-700">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
    {children}
    {error && <p className="text-[11px] text-rose-500">{error}</p>}
  </div>
);

const inp = "h-8 text-sm";
const inpErr = "border-rose-400 focus-visible:ring-rose-400";

const SignBtn = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-medium text-gray-700">{label}</span>
    <div className="flex gap-2">
      {["Yes", "No"].map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={cn("flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors",
            value === opt
              ? (opt === "Yes" ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-rose-50 border-rose-400 text-rose-600")
              : "bg-white border-gray-200 text-gray-400 hover:border-gray-300")}>
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const CATEGORIES = ["PIREP", "MAREP", "INFO", "CABIN"] as const;
const CAT_COLORS: Record<string, string> = {
  PIREP: "bg-rose-100 text-rose-700 border-rose-300",
  MAREP: "bg-amber-100 text-amber-700 border-amber-300",
  INFO: "bg-blue-100 text-blue-700 border-blue-300",
  CABIN: "bg-cyan-100 text-cyan-700 border-cyan-300",
};


const calcDuration = (
  depDate: string, depTime: string,
  arrDate: string, arrTime: string,
): { value: string; error: string | null } => {
  if (!depDate || !depTime || !arrDate || !arrTime) return { value: "", error: null };
  const norm = (t: string) => { const s = t.replace(":", "").padEnd(4, "0"); return `${s.slice(0, 2)}:${s.slice(2, 4)}`; };
  const dep = new Date(`${depDate}T${norm(depTime)}:00`);
  let arr = new Date(`${arrDate}T${norm(arrTime)}:00`);
  if (isNaN(dep.getTime()) || isNaN(arr.getTime())) return { value: "", error: null };
  
  // Handle 24-hour rollover, midnight la irundhu next day early mrg kum handle its
  if (arrDate === depDate && arr <= dep) {
    arr = new Date(arr.getTime() + 86400000);
  }
  if (arr <= dep) return { value: "", error: "Arrival before departure" };
  const diffMs = arr.getTime() - dep.getTime();
  if (diffMs > 86400000) return { value: "", error: ">24 hr" };
  const totalMins = Math.floor(diffMs / 60000);
  return { value: `${Math.floor(totalMins / 60)}:${String(totalMins % 60).padStart(2, "0")}`, error: null };
};

function SectorCard({ index, sector, onChange }: {
  index: number;
  sector: Sector;
  onChange: (f: keyof Sector, v: string) => void;
}) {
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  // Auto-calculate Block Hrs (Block Off → Block On)
  useEffect(() => {
    const { value } = calcDuration(
      sector.on_chock_dep_date, sector.on_chock_dep_time,
      sector.on_chock_arr_date, sector.on_chock_arr_time,
    );
    if (value !== sector.on_chock_duration) onChangeRef.current("on_chock_duration", value);
  }, [sector.on_chock_dep_date, sector.on_chock_dep_time, sector.on_chock_arr_date, sector.on_chock_arr_time]);

  // Auto-calculate Flight Hrs (Take Off → Landing), sharing the same dep/arr dates
  useEffect(() => {
    const { value } = calcDuration(
      sector.on_chock_dep_date, sector.off_chock_dep_time,
      sector.on_chock_arr_date, sector.off_chock_arr_time,
    );
    if (value !== sector.off_chock_duration) onChangeRef.current("off_chock_duration", value);
  }, [sector.on_chock_dep_date, sector.off_chock_dep_time, sector.on_chock_arr_date, sector.off_chock_arr_time]);

  const blockCalc = calcDuration(
    sector.on_chock_dep_date, sector.on_chock_dep_time,
    sector.on_chock_arr_date, sector.on_chock_arr_time,
  );
  const flightCalc = calcDuration(
    sector.on_chock_dep_date, sector.off_chock_dep_time,
    sector.on_chock_arr_date, sector.off_chock_arr_time,
  );

  return (
    <div className="rounded-xl border border-dashed border-[#556ee6]/30 bg-blue-50/30 p-4 space-y-4">
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#556ee6]">Sl.No: {index + 1}</span>

      {/* Top row: flight info + dates */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <F label="Flight Number"><Input className={inp} placeholder="e.g. AK101" value={sector.flight_num} onChange={(e) => onChange("flight_num", e.target.value)} /></F>
        <F label="Sector From"><Input className={cn(inp, "uppercase")} placeholder="KUL" maxLength={4} value={sector.sector_from} onChange={(e) => onChange("sector_from", e.target.value.toUpperCase())} /></F>
        <F label="Sector To"><Input className={cn(inp, "uppercase")} placeholder="SIN" maxLength={4} value={sector.sector_to} onChange={(e) => onChange("sector_to", e.target.value.toUpperCase())} /></F>
        <F label="Departure Date">
          <Input className={inp} type="date" value={sector.on_chock_dep_date}
            onChange={(e) => { onChange("on_chock_dep_date", e.target.value); onChange("off_chock_dep_date", e.target.value); }} />
        </F>
        <F label="Arrival Date">
          <Input className={inp} type="date" value={sector.on_chock_arr_date}
            onChange={(e) => { onChange("on_chock_arr_date", e.target.value); onChange("off_chock_arr_date", e.target.value); }} />
        </F>
      </div>

      {/* Time Log (UTC) */}
      <div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">Time Log (UTC)</p>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <colgroup>
              <col className="w-1/2" />
              <col className="w-1/2" />
            </colgroup>
            <tbody>
              {/* Row 1: Block Off | Take Off */}
              <tr className="border-b border-gray-200">
                <td className="border-r border-gray-200 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap w-16 shrink-0">Block Off</span>
                    <Input className={inp} placeholder="HHMM" maxLength={5} value={sector.on_chock_dep_time} onChange={(e) => onChange("on_chock_dep_time", e.target.value)} />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap w-16 shrink-0">Take Off</span>
                    <Input className={inp} placeholder="HHMM" maxLength={5} value={sector.off_chock_dep_time} onChange={(e) => onChange("off_chock_dep_time", e.target.value)} />
                  </div>
                </td>
              </tr>
              {/* Row 2: Block On | Landing */}
              <tr className="border-b border-gray-200">
                <td className="border-r border-gray-200 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap w-16 shrink-0">Block On</span>
                    <Input className={inp} placeholder="HHMM" maxLength={5} value={sector.on_chock_arr_time} onChange={(e) => onChange("on_chock_arr_time", e.target.value)} />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap w-16 shrink-0">Landing</span>
                    <Input className={inp} placeholder="HHMM" maxLength={5} value={sector.off_chock_arr_time} onChange={(e) => onChange("off_chock_arr_time", e.target.value)} />
                  </div>
                </td>
              </tr>
              {/* Row 3: Block Hrs | Flight Hrs | Total Cycles (colspan split) */}
              <tr className="bg-[#556ee6]/5">
                <td className="border-r border-gray-200 px-3 py-2" colSpan={1}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#556ee6] whitespace-nowrap shrink-0">Block Hrs</span>
                      {blockCalc.error
                        ? <span className="text-xs text-rose-500">{blockCalc.error}</span>
                        : <span className="text-sm font-semibold text-gray-800">{blockCalc.value || "—"}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#556ee6] whitespace-nowrap shrink-0">Flight Hrs</span>
                      {flightCalc.error
                        ? <span className="text-xs text-rose-500">{flightCalc.error}</span>
                        : <span className="text-sm font-semibold text-gray-800">{flightCalc.value || "—"}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 whitespace-nowrap shrink-0">Total Cycles</span>
                      <span className="text-sm font-semibold text-gray-800">1</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


const JourneyLogForm = () => {
  const { id, logId } = useParams<{ id: string; logId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!logId && logId !== "new";

  const prefill = !isEdit ? (location.state as { prefill?: { form?: Partial<JourneyFormData>; sectors?: Sector[]; defects?: DefectRow[] } } | null)?.prefill : undefined;

  const [form, setForm] = useState<JourneyFormData>(prefill?.form ? { ...EMPTY_FORM, ...prefill.form } : { ...EMPTY_FORM });
  const [sectors, setSectors] = useState<[Sector]>(
    prefill?.sectors && prefill.sectors.length >= 1
      ? [{ ...EMPTY_SECTOR, ...prefill.sectors[0] }]
      : [{ ...EMPTY_SECTOR }]
  );
  const [defects, setDefects] = useState<DefectRow[]>(prefill?.defects ?? []);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);
  const [errors, setErrors] = useState<Partial<Record<keyof JourneyFormData, string>>>({});
  const [showOrg, setShowOrg] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.aircrafts.get(id).then((aircraft: any) => {
      setForm((p) => ({
        ...p,
        registration: aircraft.registration_number ?? p.registration,
        aircraft_type: aircraft.model ?? p.aircraft_type,
        msn: aircraft.msn,
        aircraft_total_hrs: String(aircraft.flight_hours),
        aircraft_total_cyc: String(aircraft.flight_cycles ?? 0),
      }));
    }).catch(console.error);
  }, [id, isEdit]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState("No file chosen");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (isEdit) return;
    const t = setTimeout(() => setShowUploadModal(true), 500);
    return () => clearTimeout(t);
  }, [isEdit]);

  const fmtExcelDate = (val: unknown): string => {
    if (!val) return "";
    if (val instanceof Date) return val.toISOString().split("T")[0];
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.split("T")[0];
    return s;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadFile(file);
    setUploadFileName(file ? file.name : "No file chosen");
    setUploadError(null);
  };

  const handleExcelUpload = () => {
    if (!uploadFile) { setUploadError("Please choose a file first."); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
        if (rows.length === 0) { setUploadError("File is empty or has no data rows."); setUploading(false); return; }
        const r = rows[0];
        const str = (v: unknown) => v != null ? String(v).trim() : "";

        // Fill main form fields
        const parsed: Partial<JourneyFormData> = {};
        for (const [col, field] of Object.entries(COL_MAP)) {
          const val = r[col];
          const k = field as keyof JourneyFormData;
          if (field.endsWith("_date") || ["date", "next_due_maintenance", "due_at_date", "daily_inspection", "transit_inspection"].includes(field)) {
            (parsed as Record<string, string>)[k] = fmtExcelDate(val);
          } else if (["pic_sign", "commander_sign", "daily_inspection_sign", "sign_stamp", "crs_sign_stamp", "crs_signature", "digital_stamp"].includes(field)) {
            (parsed as Record<string, string>)[k] = str(val) || "No";
          } else {
            (parsed as Record<string, string>)[k] = str(val);
          }
        }
        
        setForm(prev => ({ 
          ...EMPTY_FORM, 
          ...parsed,
          // Preserve autofetched aircraft data
          registration: prev.registration,
          msn: prev.msn,
          aircraft_type: prev.aircraft_type,
          aircraft_total_hrs: prev.aircraft_total_hrs,
          aircraft_total_cyc: prev.aircraft_total_cyc,
        }));

        // Fill sectors
        const buildSector = (prefix: string): Sector => {
          const s: Partial<Sector> = {};
          for (const [col, field] of Object.entries(SECTOR_COL_MAP)) {
            const val = r[`${prefix} ${col}`];
            (s as Record<string, string>)[field] = field.endsWith("_date") ? fmtExcelDate(val) : str(val);
          }
          return { ...EMPTY_SECTOR, ...s };
        };
        setSectors([buildSector("S1")]);
        setDefects([]);

        setShowUploadModal(false);
        toast.success("Form pre-filled from Excel file.");
      } catch {
        setUploadError("Failed to parse file. Ensure it is a valid .xlsx or .csv.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsArrayBuffer(uploadFile);
  };

  // Load entry data when editing
  useEffect(() => {
    if (!isEdit || !logId) return;
    setLoadingEdit(true);
    api.journeyLogs.get(logId)
      .then((data: any) => {
        const fmt = (v: string | null | undefined) =>
          v ? new Date(v).toISOString().split("T")[0] : "";
        //Prevented from the race condtion bug do not change it
        setForm((prev) => ({
          ...prev,
          company_name: data.company_name ?? "",
          date: fmt(data.date),
          registration: data.registration ?? prev.registration,
          aircraft_type: data.aircraft_type ?? prev.aircraft_type,
          msn: data.msn ?? prev.msn,
          log_sl_no: data.log_sl_no ?? "",
          pic_name: data.pic_name ?? "",
          pic_license_no: data.pic_license_no ?? "",
          pic_sign: data.pic_sign ?? "No",
          commander_sign: data.commander_sign ?? "No",
          fuel_arrival: data.fuel_arrival?.toString() ?? "",
          fuel_departure: data.fuel_departure?.toString() ?? "",
          remaining_fuel_onboard: data.remaining_fuel_onboard?.toString() ?? "",
          fuel_uplift: data.fuel_uplift?.toString() ?? "",
          calculate_total_fuel: data.calculate_total_fuel?.toString() ?? "",
          fuel_discrepancy: data.fuel_discrepancy?.toString() ?? "",
          fuel_flight_deck_gauge: data.fuel_flight_deck_gauge?.toString() ?? "",
          fuel_density: data.fuel_density?.toString() ?? "",
          next_due_maintenance: fmt(data.next_due_maintenance),
          due_at_date: fmt(data.due_at_date),
          due_at_hours: data.due_at_hours?.toString() ?? "",
          total_flight_hrs: data.total_flight_hrs?.toString() ?? "",
          total_flight_cyc: data.total_flight_cyc?.toString() ?? "",
          daily_inspection: fmt(data.daily_inspection),
          transit_inspection: fmt(data.transit_inspection),
          type_of_maintenance: data.type_of_maintenance ?? "",
          apu_hrs: data.apu_hrs?.toString() ?? "",
          apu_cyc: data.apu_cyc?.toString() ?? "",
          oil_uplift_eng1: data.oil_uplift_eng1?.toString() ?? "",
          oil_uplift_eng2: data.oil_uplift_eng2?.toString() ?? "",
          oil_uplift_apu: data.oil_uplift_apu?.toString() ?? "",
          hyd_fluid: data.hyd_fluid?.toString() ?? "",
          daily_inspection_sign: data.daily_inspection_sign ?? "No",
          sign_stamp: data.sign_stamp ?? "No",
          amo_name: data.amo_name ?? "",
          amo_approval: data.amo_approval ?? "",
          lae_name: data.lae_name ?? "",
          lae_license: data.lae_license ?? "",
          crs_signature: data.crs_signature ?? "No",
          digital_stamp: data.digital_stamp ?? "No",
        }));
        if (data.amo_name || data.amo_approval) {
          setShowOrg(true);
        }
        const mappedSectors: Sector[] = (data.sectors ?? []).slice(0, 1).map((s: any) => ({
          flight_num: s.flight_num ?? "",
          sector_from: s.sector_from ?? "",
          sector_to: s.sector_to ?? "",
          on_chock_dep_date: s.on_chock_dep_date ?? "",
          on_chock_dep_time: s.on_chock_dep_time ?? "",
          on_chock_arr_date: s.on_chock_arr_date ?? "",
          on_chock_arr_time: s.on_chock_arr_time ?? "",
          on_chock_duration: s.on_chock_duration ?? "",
          off_chock_dep_date: s.off_chock_dep_date ?? "",
          off_chock_dep_time: s.off_chock_dep_time ?? "",
          off_chock_arr_date: s.off_chock_arr_date ?? "",
          off_chock_arr_time: s.off_chock_arr_time ?? "",
          off_chock_duration: s.off_chock_duration ?? "",
        }));
        while (mappedSectors.length < 1) mappedSectors.push({ ...EMPTY_SECTOR });
        setSectors(mappedSectors as [Sector]);
        setDefects((data.defects ?? []).map((d: any, idx: number) => ({
          id: idx + 1,
          category: d.category ?? "PIREP",
          defect_description: d.defect_description ?? "",
          action_taken: d.action_taken ?? "",
          mel_expiry_date: d.mel_expiry_date ?? "",
          mel_reference: d.mel_reference ?? "",
          mel_repair_cat: d.mel_repair_cat ?? "",
          lic_no: d.lic_no ?? "",
          part1_description: d.part1_description ?? "",
          part1_number_on: d.part1_number_on ?? "",
          part1_number_off: d.part1_number_off ?? "",
          part1_serial_on: d.part1_serial_on ?? "",
          part1_serial_off: d.part1_serial_off ?? "",
          part1_cert_num: d.part1_cert_num ?? "",
          part2_description: d.part2_description ?? "",
          part2_number_on: d.part2_number_on ?? "",
          part2_number_off: d.part2_number_off ?? "",
          part2_serial_on: d.part2_serial_on ?? "",
          part2_serial_off: d.part2_serial_off ?? "",
          part2_cert_num: d.part2_cert_num ?? "",
        })));
      })
      .catch(console.error)
      .finally(() => setLoadingEdit(false));
  }, [isEdit, logId]);

  const set = (key: keyof JourneyFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));
  const setSign = (key: keyof JourneyFormData) => (v: string) => setForm((p) => ({ ...p, [key]: v }));
  const ec = (key: keyof JourneyFormData) => cn(inp, errors[key] && inpErr);

  const updateSector = (i: 0, field: keyof Sector, val: string) =>
    setSectors((p) => { const s = [...p] as [Sector]; s[i] = { ...s[i], [field]: val }; return s; });

  // Take off time and landing time use panni total_flight_hrs auto calculate pannum
  // Idhu create and edit rendu case-layum work aagum
  // Running total store pannaadhu, indha sector-ku varra hours difference (delta) mattum save pannum
  useEffect(() => {
    const dur = sectors[0]?.off_chock_duration ?? "";
    if (dur) {
      const parts = dur.split(":");
      if (parts.length === 2) {
        const hrs = parseInt(parts[0], 10);
        const mins = parseInt(parts[1], 10);
        if (!isNaN(hrs) && !isNaN(mins)) {
          const sectorFlightHrs = hrs + mins / 60;
          setForm((p) => ({
            ...p,
            total_flight_hrs: sectorFlightHrs.toFixed(2),
            total_flight_cyc: "1",
          }));
          return;
        }
      }
    }
    if (!isEdit) {
      setForm((p) => ({ ...p, total_flight_hrs: "", total_flight_cyc: "0" }));
    }
  }, [sectors[0]?.off_chock_duration, isEdit]);

  const addDefect = () => setDefects((p) => [...p, { id: Date.now(), ...EMPTY_DEFECT }]);
  const updateDefect = (i: number, field: keyof Omit<DefectRow, "id">, val: string) =>
    setDefects((p) => p.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  const removeDefect = (did: number) => setDefects((p) => p.filter((d) => d.id !== did));

  const validate = (): boolean => {
    const e: Partial<Record<keyof JourneyFormData, string>> = {};
    if (!form.date) e.date = "Required";
    if (!form.registration) e.registration = "Required";
    if (!form.pic_name) e.pic_name = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const { msn: _msn, ...formPayload } = form;
      const payload = { ...formPayload, aircraft_id: id, sectors, defects };
      if (isEdit && logId) {
        await api.journeyLogs.update(logId, payload);
      } else {
        await api.journeyLogs.create(payload);
      }
      toast.success(isEdit ? "Journey log updated." : "Journey log entry created.");
      navigate(`/aircraft/${id}/journey`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save journey log.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Loading entry…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Dialog
        open={showUploadModal}
        onOpenChange={(o) => { if (!o) { setShowUploadModal(false); setUploadFile(null); setUploadFileName("No file chosen"); setUploadError(null); } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#556ee6]">
              <Upload className="h-5 w-5" /> Upload Journey Log
            </DialogTitle></DialogHeader>

          <div className="space-y-4 py-2">
            {uploading ? (
              <div className="space-y-3 text-center py-4">
                <p className="text-sm font-medium text-[#556ee6]">Processing…</p>
                <p className="text-xs text-muted-foreground">Please do not close this window.</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-full animate-pulse rounded-full bg-[#556ee6]" />
                </div>
              </div>
            ) : (
              <>
                <div
                  className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 cursor-pointer hover:border-[#556ee6] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 text-[#556ee6] shrink-0" />
                  <span className="flex-1 text-sm text-gray-500 truncate">{uploadFileName}</span>
                  <span className="rounded-md bg-[#556ee6]/10 px-2.5 py-1 text-xs font-medium text-[#556ee6]">
                    Choose File
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                {uploadError && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                    {uploadError}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex justify-center pt-2">
            <Button
              size="sm"
              disabled={!uploadFile || uploading}
              onClick={handleExcelUpload}
              className="bg-[#3b58e9] hover:bg-[#3d59d4] text-white px-8"
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Page Header */}
      <div className="rounded-xl bg-[#ffffff] px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(`/aircraft/${id}/journey`, { replace: true })}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-black hover:bg-white/20 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-black/55 font-medium mb-0.5">S2 — Journey Log Panel</p>
              <h1 className="text-lg font-bold text-black leading-none">
                {isEdit ? "Edit Journey Log Entry" : "New Journey Log Entry"}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm"
              className="h-8 border-white/30 bg-white/10 text-black hover:bg-red-50 hover:text-red-600 font-semibold text-xs"
              onClick={() => navigate(`/aircraft/${id}/journey`, { replace: true })}>Cancel</Button>
            <Button type="button" size="sm" disabled={saving}
              className="h-8 gap-1.5 bg-white text-[#556ee6] hover:bg-white/90 font-semibold text-xs"
              onClick={handleSubmit as React.MouseEventHandler}>
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Entry"}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="rounded-xl border bg-white shadow-sm divide-y">
          <div className="px-6 py-6 space-y-8">

            {/* SECTION 1: INFORMATION */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 shadow-sm">
              <Section title="SECTION 1: INFORMATION">
                <p className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">Journey Log Panel</p>
                <Grid cols={3}>
                  <F label="Date" required error={errors.date}>
                    <Input type="date" className={cn(ec("date"), "bg-white")} value={form.date} onChange={set("date")} />
                  </F>
                  <F label="Aircraft Registration" required error={errors.registration}>
                    <Input className={cn(ec("registration"), "uppercase bg-white")} placeholder="e.g. 9M-XXA" value={form.registration} readOnly />
                  </F>
                  <F label="Aircraft Model">
                    <Input className={cn(inp, "bg-white")} placeholder="e.g. B737-800" value={form.aircraft_type} readOnly />
                  </F>
                  <F label="MSN">
                    <Input className={cn(inp, "bg-white")} placeholder="Auto-fetched" value={form.msn} readOnly />
                  </F>
                  <F label="Log Serial No.">
                    <Input className={cn(inp, "bg-white")} placeholder="e.g. 9MXXA-001" value={form.log_sl_no} onChange={set("log_sl_no")} />
                  </F>
                  <div className="hidden lg:block"></div> {/* Helper to force next items to new row if needed, or just let Grid handle it */}
                  <F label="Total Flight Hours">
                    <Input className={cn(inp, "bg-white")} type="text" placeholder="00:00" value={decimalToHoursMinutes(Number(form.aircraft_total_hrs))} readOnly />
                  </F>
                  <F label="Total Flight Cycles">
                    <Input className={cn(inp, "bg-white")} type="number" min="0" placeholder="0" value={form.aircraft_total_cyc} readOnly />
                  </F>
                </Grid>
              </Section>
            </div>

            {/* SECTION 2: FLIGHT CREW OPERATIONAL PANEL */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 shadow-sm mt-8">
              <Section title="SECTION 2: FLIGHT CREW OPERATIONAL PANEL">
                <div className="space-y-8">
                  {/* 1. Sector Info & 2. Time Log */}
                  <div className="space-y-4">
                    <h4 className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">Sector Info & Time Log (UTC)</h4>
                    {([0] as const).map((i) => (
                      <SectorCard key={i} index={i} sector={sectors[i]}
                        onChange={(f, v) => updateSector(i, f, v)} />
                    ))}
                  </div>

                  {/* 3. Fuel Log */}
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <h4 className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">Fuel Log</h4>
                    <Grid cols={3}>
                      <F label="Fuel Arrival (kg)"><Input className={cn(inp, "bg-white")} type="number" min="0" placeholder="0" value={form.fuel_arrival} onChange={set("fuel_arrival")} /></F>
                      <F label="Fuel Departure (kg)"><Input className={cn(inp, "bg-white")} type="number" min="0" placeholder="0" value={form.fuel_departure} onChange={set("fuel_departure")} /></F>
                      <F label="Remaining Fuel Onboard (kg)"><Input className={cn(inp, "bg-white")} type="number" min="0" placeholder="0" value={form.remaining_fuel_onboard} onChange={set("remaining_fuel_onboard")} /></F>
                      <F label="Fuel Uplift (kg)"><Input className={cn(inp, "bg-white")} type="number" min="0" placeholder="0" value={form.fuel_uplift} onChange={set("fuel_uplift")} /></F>
                      <F label="Calculate Total Fuel (kg)"><Input className={cn(inp, "bg-white")} type="number" min="0" placeholder="0" value={form.calculate_total_fuel} onChange={set("calculate_total_fuel")} /></F>
                      <F label="Fuel Discrepancy (kg)"><Input className={cn(inp, "bg-white")} type="number" placeholder="0" value={form.fuel_discrepancy} onChange={set("fuel_discrepancy")} /></F>
                      <F label="Fuel Flight Deck Gauge (kg)"><Input className={cn(inp, "bg-white")} type="number" min="0" placeholder="0" value={form.fuel_flight_deck_gauge} onChange={set("fuel_flight_deck_gauge")} /></F>
                      <F label="Fuel Density (S.G)"><Input className={cn(inp, "bg-white")} type="number" step="0.001" placeholder="e.g. 0.8" value={form.fuel_density} onChange={set("fuel_density")} /></F>
                    </Grid>
                  </div>

                  {/* PIC Auth Panel */}
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <h4 className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">PIC Auth</h4>
                    <Grid cols={3}>
                      <F label="PIC Name" required error={errors.pic_name}>
                        <Input className={cn(ec("pic_name"), "bg-white")} placeholder="Capt. Name" value={form.pic_name} onChange={set("pic_name")} />
                      </F>
                      <F label="PIC Licence No.">
                        <Input className={cn(inp, "bg-white")} placeholder="ATPL-MY-XXXXX" value={form.pic_license_no} onChange={set("pic_license_no")} />
                      </F>
                    </Grid>
                    <Grid cols={2}>
                      <SignBtn label="Pre-Flight Inspection Check" value={form.commander_sign} onChange={setSign("commander_sign")} />
                      <SignBtn label="PIC Signature (Slot)" value={form.pic_sign} onChange={setSign("pic_sign")} />
                    </Grid>
                  </div>
                </div>
              </Section>
            </div>

            {/* SECTION 3: ACTION TAKEN / DEFECTS */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 shadow-sm mt-8">
              <Section title="SECTION 3: Maintenance & DEFECTS">
                <div className="space-y-4">
                  <p className = "text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">Action Takens</p>
                  {defects.length === 0 && <p className="text-xs text-muted-foreground italic">No entries. Use the button below to add.</p>}
                  {defects.map((d, i) => (
                    <div key={d.id} className="rounded-xl border p-4 space-y-4 border-gray-200 bg-white">
                      {/* Category tabs */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex gap-1.5">
                          {CATEGORIES.map((cat) => (
                            <button key={cat} type="button"
                              onClick={() => updateDefect(i, "category", cat)}
                              className={cn(
                                "rounded-md border px-3 py-1 text-[11px] font-bold uppercase transition-colors",
                                d.category === cat ? CAT_COLORS[cat] : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                              )}>
                              {cat}
                            </button>
                          ))}
                        </div>
                        <button type="button" onClick={() => removeDefect(d.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-rose-400 hover:bg-rose-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Grid cols={2}>
                        <F label="Defect Description">
                          <textarea rows={3} placeholder="Describe the defect..."
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={d.defect_description} onChange={(e) => updateDefect(i, "defect_description", e.target.value)} />
                        </F>
                        <F label="Action Taken">
                          <textarea rows={3} placeholder="Action taken..."
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={d.action_taken} onChange={(e) => updateDefect(i, "action_taken", e.target.value)} />
                        </F>
                      </Grid>
                      <Grid cols={4}>
                        <F label="MEL Expiry Date"><Input className={inp} type="date" value={d.mel_expiry_date} onChange={(e) => updateDefect(i, "mel_expiry_date", e.target.value)} /></F>
                        <F label="MEL Reference"><Input className={inp} placeholder="MEL-XX-XXX" value={d.mel_reference} onChange={(e) => updateDefect(i, "mel_reference", e.target.value)} /></F>
                        <F label="MEL Repair Cat"><Input className={inp} placeholder="A / B / C / D" value={d.mel_repair_cat} onChange={(e) => updateDefect(i, "mel_repair_cat", e.target.value)} /></F>
                        <F label="Lic No"><Input className={inp} placeholder="AME Licence No." value={d.lic_no} onChange={(e) => updateDefect(i, "lic_no", e.target.value)} /></F>
                      </Grid>
                      {/* Parts */}
                      {([1, 2] as const).map((pn) => {
                        const pre = `part${pn}_` as "part1_" | "part2_";
                        return (
                          <div key={pn} className="rounded-lg border bg-gray-50/50 p-3 space-y-3">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Part Description – {pn}</span>
                            <F label="Part Description">
                              <Input className={inp} placeholder={`Description of part ${pn}`}
                                value={d[`${pre}description` as keyof DefectRow] as string}
                                onChange={(e) => updateDefect(i, `${pre}description` as keyof Omit<DefectRow, "id">, e.target.value)} />
                            </F>
                            <Grid cols={2}>
                              <F label="Part Number On"><Input className={inp} placeholder="P/N On" value={d[`${pre}number_on` as keyof DefectRow] as string} onChange={(e) => updateDefect(i, `${pre}number_on` as keyof Omit<DefectRow, "id">, e.target.value)} /></F>
                              <F label="Part Number Off"><Input className={inp} placeholder="P/N Off" value={d[`${pre}number_off` as keyof DefectRow] as string} onChange={(e) => updateDefect(i, `${pre}number_off` as keyof Omit<DefectRow, "id">, e.target.value)} /></F>
                              <F label="Serial Number On"><Input className={inp} placeholder="S/N On" value={d[`${pre}serial_on` as keyof DefectRow] as string} onChange={(e) => updateDefect(i, `${pre}serial_on` as keyof Omit<DefectRow, "id">, e.target.value)} /></F>
                              <F label="Serial Number Off"><Input className={inp} placeholder="S/N Off" value={d[`${pre}serial_off` as keyof DefectRow] as string} onChange={(e) => updateDefect(i, `${pre}serial_off` as keyof Omit<DefectRow, "id">, e.target.value)} /></F>
                            </Grid>
                            <F label="Certificate Number"><Input className={inp} placeholder="Cert. No." value={d[`${pre}cert_num` as keyof DefectRow] as string} onChange={(e) => updateDefect(i, `${pre}cert_num` as keyof Omit<DefectRow, "id">, e.target.value)} /></F>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm"
                    className="h-8 gap-1.5 text-xs border-dashed border-rose-300 text-rose-600 hover:bg-rose-50"
                    onClick={addDefect}>
                    <Plus className="h-3.5 w-3.5" /> Add Entry
                  </Button>
                </div>
              </Section>
            </div>

            {/* SECTION 4: MAINTENANCE */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 shadow-sm mt-8">
              <Section title="SECTION 4: MAINTENANCE">
                <div className="space-y-8">
                  {/* Group 1: Airworthiness */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">Airworthiness</h4>
                    <Grid cols={3}>
                      <F label="A/C Total Hrs">
                        <Input className={cn(inp, "bg-white")} type="text" placeholder="00:00" value={decimalToHoursMinutes(Number(form.aircraft_total_hrs))} readOnly />
                      </F>
                      <F label="Total Cycles">
                        <Input className={cn(inp, "bg-white")} type="number" min="0" placeholder="0" value={form.aircraft_total_cyc} readOnly />
                      </F>
                      <F label="Next Due Maintenance"><Input className={inp} type="date" value={form.next_due_maintenance} onChange={set("next_due_maintenance")} /></F>
                      <F label="Due @ Date"><Input className={inp} type="date" value={form.due_at_date} onChange={set("due_at_date")} /></F>
                      <F label="Due @ Hours"><Input className={inp} type="number" step="0.1" min="0" placeholder="0" value={form.due_at_hours} onChange={set("due_at_hours")} /></F>
                    </Grid>
                  </div>

                  {/* Group 2: Inspections */}
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <h4 className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">Inspections</h4>
                    <Grid cols={3}>
                      <F label="Daily Inspection"><Input className={inp} type="date" value={form.daily_inspection} onChange={set("daily_inspection")} /></F>
                      <F label="Transit Inspection"><Input className={inp} type="date" value={form.transit_inspection} onChange={set("transit_inspection")} /></F>
                      <F label="Type of Maintenance"><Input className={inp} placeholder="e.g. Daily Check" value={form.type_of_maintenance} onChange={set("type_of_maintenance")} /></F>
                    </Grid>
                  </div>

                  {/* Group 3: Fluid Servicing */}
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <h4 className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">Fluid Servicing</h4>
                    <Grid cols={4}>
                      <F label="Oil Uplift Engine No.1 (L)"><Input className={inp} type="number" step="0.1" min="0" placeholder="0.0" value={form.oil_uplift_eng1} onChange={set("oil_uplift_eng1")} /></F>
                      <F label="Oil Uplift Engine No.2 (L)"><Input className={inp} type="number" step="0.1" min="0" placeholder="0.0" value={form.oil_uplift_eng2} onChange={set("oil_uplift_eng2")} /></F>
                      <F label="Oil Uplift APU (L)"><Input className={inp} type="number" step="0.1" min="0" placeholder="0.0" value={form.oil_uplift_apu} onChange={set("oil_uplift_apu")} /></F>
                      <F label="Hyd Fluid (L)"><Input className={inp} type="number" step="0.1" min="0" placeholder="0.0" value={form.hyd_fluid} onChange={set("hyd_fluid")} /></F>
                    </Grid>
                  </div>

                  {/* Group 4: APU Tracking */}
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <h4 className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">APU Tracking</h4>
                    <Grid cols={3}>
                      <F label="APU Hrs"><Input className={inp} type="number" step="0.01" min="0" placeholder="0" value={form.apu_hrs} onChange={set("apu_hrs")} /></F>
                      <F label="APU Cyc"><Input className={inp} type="number" min="0" placeholder="0" value={form.apu_cyc} onChange={set("apu_cyc")} /></F>
                    </Grid>
                  </div>

                  {/* Signatures */}
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <h4 className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">Signatures</h4>
                    <Grid cols={2}>
                      <SignBtn label="Daily Inspection Signature &amp; Stamp" value={form.daily_inspection_sign} onChange={setSign("daily_inspection_sign")} />
                      <SignBtn label="Signature and Stamp" value={form.sign_stamp} onChange={setSign("sign_stamp")} />
                    </Grid>
                  </div>
                </div>
              </Section>
            </div>

            {/* SECTION 5: CRS STATEMENT */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 shadow-sm mt-8">
              <Section title="SECTION 5: CRS STATEMENT">
                <div className="space-y-6">
                  <p className="text-sm text-gray-600 bg-white/50 p-4 rounded-lg border border-gray-100 italic">
                    "Certifies that the work specified, except as otherwise specified, was carried out in accordance with the Civil Aviation Act 1969 and the regulations made thereunder and in respect to that work, the aircraft/aircraft component is considered ready for release to service"
                  </p>
                  
                  {!showOrg && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowOrg(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Add Organisation
                    </Button>
                  )}

                  {showOrg && (
                    <div className="space-y-4">
                      <Grid cols={2}>
                        <F label="AMO Name">
                          <Input className={cn(inp, "bg-white")} placeholder="e.g., MAS Engineering" value={form.amo_name} onChange={set("amo_name")} />
                        </F>
                        <F label="AMO Approval">
                          <Input className={cn(inp, "bg-white")} placeholder="e.g., FAMTO-001" value={form.amo_approval} onChange={set("amo_approval")} />
                        </F>
                        <F label="LAE Name">
                          <Input className={cn(inp, "bg-white")} placeholder="e.g., Mohamad Firdaus" value={form.lae_name} onChange={set("lae_name")} />
                        </F>
                        <F label="LAE License">
                          <Input className={cn(inp, "bg-white")} placeholder="e.g., CAAM-L-66-1234" value={form.lae_license} onChange={set("lae_license")} />
                        </F>
                      </Grid>
                      
                      <div className="max-w-md pt-2 flex gap-4">
                         <SignBtn label="CRS Signature" value={form.crs_signature} onChange={setSign("crs_signature")} />
                         <SignBtn label="Digital Stamp" value={form.digital_stamp} onChange={setSign("digital_stamp")} />
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50/60">
            <p className="text-[11px] text-muted-foreground">Fields marked <span className="text-rose-500 font-bold">*</span> are required</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/aircraft/${id}/journey`, { replace: true })}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving} className="gap-1.5 bg-[#556ee6] hover:bg-[#4560d5]">
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Entry"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JourneyLogForm;
