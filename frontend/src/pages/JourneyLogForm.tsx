import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Upload, Download } from "lucide-react";
import { cn } from "@/lib/utils";
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
  next_due_maintenance: string;
  due_at_date: string;
  due_at_hours: string;
  total_flight_hrs: string;
  total_flight_cyc: string;
  daily_inspection: string;
  type_of_maintenance: string;
  apu_hrs: string;
  apu_cyc: string;
  oil_uplift_eng1: string;
  oil_uplift_eng2: string;
  oil_uplift_apu: string;
  daily_inspection_sign: string;
  sign_stamp: string;
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
  "Type of Maintenance": "type_of_maintenance", "APU Hrs": "apu_hrs", "APU Cyc": "apu_cyc",
  "Oil Uplift Eng1": "oil_uplift_eng1", "Oil Uplift Eng2": "oil_uplift_eng2",
  "Oil Uplift APU": "oil_uplift_apu",
  "Daily Inspection Sign": "daily_inspection_sign", "Sign Stamp": "sign_stamp",
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
  "Total Flight Hrs", "Total Flight Cyc", "Daily Inspection", "Type of Maintenance",
  "APU Hrs", "APU Cyc", "Oil Uplift Eng1", "Oil Uplift Eng2", "Oil Uplift APU",
  "Daily Inspection Sign", "Sign Stamp",
  "S1 Flight Num", "S1 Sector From", "S1 Sector To",
  "S1 On Chock Dep Date", "S1 On Chock Dep Time", "S1 On Chock Arr Date", "S1 On Chock Arr Time", "S1 On Chock Duration",
  "S1 Off Chock Dep Date", "S1 Off Chock Dep Time", "S1 Off Chock Arr Date", "S1 Off Chock Arr Time", "S1 Off Chock Duration",
  "S2 Flight Num", "S2 Sector From", "S2 Sector To",
  "S2 On Chock Dep Date", "S2 On Chock Dep Time", "S2 On Chock Arr Date", "S2 On Chock Arr Time", "S2 On Chock Duration",
  "S2 Off Chock Dep Date", "S2 Off Chock Dep Time", "S2 Off Chock Arr Date", "S2 Off Chock Arr Time", "S2 Off Chock Duration",
];

const TEMPLATE_SAMPLE_ROW = [
  "AeroTrend MRO Sdn Bhd", "2026-02-24", "9M-AAD", "B737-900", "9MAAD-001",
  "Capt. Ahmad Fadzil", "ATPL-MY-00142", "Yes", "Yes",
  "6800", "9200", "6800", "8500", "15300", "0", "18502", "4201",
  "6750", "2026-03-01", "2026-03-01", "18600",
  "1.25", "1", "2026-02-24", "Daily Check",
  "0.5", "2", "0.5", "0.5", "0", "Yes", "Yes",
  "AK101", "KUL", "SIN",
  "2026-02-24", "0800", "2026-02-24", "0915", "1:15",
  "2026-02-24", "0755", "2026-02-24", "0920", "1:25",
  "AK102", "SIN", "KUL",
  "2026-02-24", "1030", "2026-02-24", "1148", "1:18",
  "2026-02-24", "1025", "2026-02-24", "1153", "1:28",
];


export const JOURNEY_MOCK: Record<string, {
  form: Partial<JourneyFormData>;
  sectors: [Sector, Sector];
  defects: DefectRow[];
}> = {
  JL001: {
    form: {
      company_name: "AeroTrend MRO Sdn Bhd", date: "2026-02-01",
      registration: "9M-XXA", aircraft_type: "Boeing 737-800", log_sl_no: "9MXXA-001",
      pic_name: "Capt. Ahmad Fadzil", pic_license_no: "ATPL-MY-00142",
      pic_sign: "Yes", commander_sign: "Yes",
      fuel_arrival: "6800", fuel_departure: "9200", remaining_fuel_onboard: "6800",
      fuel_uplift: "8500", calculate_total_fuel: "15300", fuel_discrepancy: "0",
      aircraft_total_hrs: "18502", aircraft_total_cyc: "4201",
      fuel_flight_deck_gauge: "6750",
      next_due_maintenance: "2026-03-01", due_at_date: "2026-03-01", due_at_hours: "18600",
      total_flight_hrs: "1.25", total_flight_cyc: "1",
      daily_inspection: "2026-02-01", type_of_maintenance: "Daily Check",
      apu_hrs: "0.5", apu_cyc: "2",
      oil_uplift_eng1: "0.5", oil_uplift_eng2: "0.5", oil_uplift_apu: "0",
      daily_inspection_sign: "Yes", sign_stamp: "Yes",
    },
    sectors: [
      { flight_num: "AK101", sector_from: "KUL", sector_to: "SIN", on_chock_dep_date: "2026-02-01", on_chock_dep_time: "0800", on_chock_arr_date: "2026-02-01", on_chock_arr_time: "0915", on_chock_duration: "1:15", off_chock_dep_date: "2026-02-01", off_chock_dep_time: "0755", off_chock_arr_date: "2026-02-01", off_chock_arr_time: "0920", off_chock_duration: "1:25" },
      { flight_num: "", sector_from: "", sector_to: "", on_chock_dep_date: "", on_chock_dep_time: "", on_chock_arr_date: "", on_chock_arr_time: "", on_chock_duration: "", off_chock_dep_date: "", off_chock_dep_time: "", off_chock_arr_date: "", off_chock_arr_time: "", off_chock_duration: "" },
    ],
    defects: [],
  },
  JL002: {
    form: {
      company_name: "AeroTrend MRO Sdn Bhd", date: "2026-02-01",
      registration: "9M-XXA", aircraft_type: "Boeing 737-800", log_sl_no: "9MXXA-002",
      pic_name: "Capt. Ahmad Fadzil", pic_license_no: "ATPL-MY-00142",
      pic_sign: "Yes", commander_sign: "Yes",
      fuel_arrival: "6700", fuel_departure: "9000", remaining_fuel_onboard: "6700",
      fuel_uplift: "9000", calculate_total_fuel: "15700", fuel_discrepancy: "0",
      aircraft_total_hrs: "18503", aircraft_total_cyc: "4202",
      fuel_flight_deck_gauge: "6680",
      next_due_maintenance: "2026-03-01", due_at_date: "2026-03-01", due_at_hours: "18600",
      total_flight_hrs: "1.3", total_flight_cyc: "1",
      daily_inspection: "2026-02-01", type_of_maintenance: "Daily Check",
      apu_hrs: "0.7", apu_cyc: "2",
      oil_uplift_eng1: "0", oil_uplift_eng2: "0.5", oil_uplift_apu: "0",
      daily_inspection_sign: "Yes", sign_stamp: "Yes",
    },
    sectors: [
      { flight_num: "AK102", sector_from: "SIN", sector_to: "KUL", on_chock_dep_date: "2026-02-01", on_chock_dep_time: "1030", on_chock_arr_date: "2026-02-01", on_chock_arr_time: "1148", on_chock_duration: "1:18", off_chock_dep_date: "2026-02-01", off_chock_dep_time: "1025", off_chock_arr_date: "2026-02-01", off_chock_arr_time: "1153", off_chock_duration: "1:28" },
      { flight_num: "", sector_from: "", sector_to: "", on_chock_dep_date: "", on_chock_dep_time: "", on_chock_arr_date: "", on_chock_arr_time: "", on_chock_duration: "", off_chock_dep_date: "", off_chock_dep_time: "", off_chock_arr_date: "", off_chock_arr_time: "", off_chock_duration: "" },
    ],
    defects: [
      { id: 1, category: "PIREP", defect_description: "Seat 12A recline inoperative", action_taken: "Seat locked upright per MEL", mel_expiry_date: "2026-03-01", mel_reference: "MEL-25-001", mel_repair_cat: "B", lic_no: "AME-MY-00321", part1_description: "Seat Recline Mechanism", part1_number_on: "", part1_number_off: "737-25-001A", part1_serial_on: "", part1_serial_off: "SN-2204", part1_cert_num: "", part2_description: "", part2_number_on: "", part2_number_off: "", part2_serial_on: "", part2_serial_off: "", part2_cert_num: "" },
    ],
  },
  JL003: {
    form: {
      company_name: "AeroTrend MRO Sdn Bhd", date: "2026-02-03",
      registration: "9M-XXA", aircraft_type: "Boeing 737-800", log_sl_no: "9MXXA-003",
      pic_name: "Capt. Zulkifli", pic_license_no: "ATPL-MY-00199",
      pic_sign: "Yes", commander_sign: "Yes",
      fuel_arrival: "8200", fuel_departure: "12500", remaining_fuel_onboard: "8200",
      fuel_uplift: "12000", calculate_total_fuel: "20200", fuel_discrepancy: "0",
      aircraft_total_hrs: "18505", aircraft_total_cyc: "4203",
      fuel_flight_deck_gauge: "8150",
      next_due_maintenance: "2026-03-01", due_at_date: "2026-03-01", due_at_hours: "18600",
      total_flight_hrs: "2.1", total_flight_cyc: "1",
      daily_inspection: "2026-02-03", type_of_maintenance: "Daily Check",
      apu_hrs: "0.8", apu_cyc: "2",
      oil_uplift_eng1: "0", oil_uplift_eng2: "0", oil_uplift_apu: "0",
      daily_inspection_sign: "Yes", sign_stamp: "Yes",
    },
    sectors: [
      { flight_num: "AK201", sector_from: "KUL", sector_to: "BKK", on_chock_dep_date: "2026-02-03", on_chock_dep_time: "0900", on_chock_arr_date: "2026-02-03", on_chock_arr_time: "1106", on_chock_duration: "2:06", off_chock_dep_date: "2026-02-03", off_chock_dep_time: "0855", off_chock_arr_date: "2026-02-03", off_chock_arr_time: "1112", off_chock_duration: "2:17" },
      { flight_num: "", sector_from: "", sector_to: "", on_chock_dep_date: "", on_chock_dep_time: "", on_chock_arr_date: "", on_chock_arr_time: "", on_chock_duration: "", off_chock_dep_date: "", off_chock_dep_time: "", off_chock_arr_date: "", off_chock_arr_time: "", off_chock_duration: "" },
    ],
    defects: [],
  },
};

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
  company_name: "", date: "", registration: "", aircraft_type: "", log_sl_no: "",
  pic_name: "", pic_license_no: "", pic_sign: "No", commander_sign: "No",
  fuel_arrival: "", fuel_departure: "", remaining_fuel_onboard: "", fuel_uplift: "",
  calculate_total_fuel: "", fuel_discrepancy: "", aircraft_total_hrs: "", aircraft_total_cyc: "",
  fuel_flight_deck_gauge: "",
  next_due_maintenance: "", due_at_date: "", due_at_hours: "",
  total_flight_hrs: "", total_flight_cyc: "",
  daily_inspection: "", type_of_maintenance: "", apu_hrs: "", apu_cyc: "",
  oil_uplift_eng1: "", oil_uplift_eng2: "", oil_uplift_apu: "",
  daily_inspection_sign: "No", sign_stamp: "No",
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
  INFO:  "bg-blue-100 text-blue-700 border-blue-300",
  CABIN: "bg-purple-100 text-purple-700 border-purple-300",
};


const SectorCard = ({ index, sector, onChange }: {
  index: number;
  sector: Sector;
  onChange: (f: keyof Sector, v: string) => void;
}) => (
  <div className="rounded-xl border border-dashed border-[#556ee6]/30 bg-blue-50/30 p-4 space-y-4">
    <span className="text-[11px] font-bold uppercase tracking-widest text-[#556ee6]">Sl.No: {index + 1}</span>
    <Grid cols={3}>
      <F label="Flight Number"><Input className={inp} placeholder="e.g. AK101" value={sector.flight_num} onChange={(e) => onChange("flight_num", e.target.value)} /></F>
      <F label="Sector From"><Input className={cn(inp, "uppercase")} placeholder="KUL" maxLength={4} value={sector.sector_from} onChange={(e) => onChange("sector_from", e.target.value.toUpperCase())} /></F>
      <F label="Sector To"><Input className={cn(inp, "uppercase")} placeholder="SIN" maxLength={4} value={sector.sector_to} onChange={(e) => onChange("sector_to", e.target.value.toUpperCase())} /></F>
    </Grid>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* On-Chock */}
      <div className="rounded-lg border bg-white p-3 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">On-Chock</span>
        <Grid cols={2}>
          <F label="Departure Date"><Input className={inp} type="date" value={sector.on_chock_dep_date} onChange={(e) => onChange("on_chock_dep_date", e.target.value)} /></F>
          <F label="Departure Time"><Input className={inp} placeholder="HHMM" maxLength={5} value={sector.on_chock_dep_time} onChange={(e) => onChange("on_chock_dep_time", e.target.value)} /></F>
          <F label="Arrival Date"><Input className={inp} type="date" value={sector.on_chock_arr_date} onChange={(e) => onChange("on_chock_arr_date", e.target.value)} /></F>
          <F label="Arrival Time"><Input className={inp} placeholder="HHMM" maxLength={5} value={sector.on_chock_arr_time} onChange={(e) => onChange("on_chock_arr_time", e.target.value)} /></F>
        </Grid>
        <F label="Sector Duration"><Input className={inp} placeholder="H:MM" value={sector.on_chock_duration} onChange={(e) => onChange("on_chock_duration", e.target.value)} /></F>
      </div>
      {/* Off-Chock */}
      <div className="rounded-lg border bg-white p-3 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Off-Chock</span>
        <Grid cols={2}>
          <F label="Departure Date"><Input className={inp} type="date" value={sector.off_chock_dep_date} onChange={(e) => onChange("off_chock_dep_date", e.target.value)} /></F>
          <F label="Departure Time"><Input className={inp} placeholder="HHMM" maxLength={5} value={sector.off_chock_dep_time} onChange={(e) => onChange("off_chock_dep_time", e.target.value)} /></F>
          <F label="Arrival Date"><Input className={inp} type="date" value={sector.off_chock_arr_date} onChange={(e) => onChange("off_chock_arr_date", e.target.value)} /></F>
          <F label="Arrival Time"><Input className={inp} placeholder="HHMM" maxLength={5} value={sector.off_chock_arr_time} onChange={(e) => onChange("off_chock_arr_time", e.target.value)} /></F>
        </Grid>
        <F label="Sector Duration"><Input className={inp} placeholder="H:MM" value={sector.off_chock_duration} onChange={(e) => onChange("off_chock_duration", e.target.value)} /></F>
      </div>
    </div>
  </div>
);


const JourneyLogForm = () => {
  const { id, logId } = useParams<{ id: string; logId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!logId && logId !== "new";

  const prefill = !isEdit ? (location.state as { prefill?: { form?: Partial<JourneyFormData>; sectors?: Sector[]; defects?: DefectRow[] } } | null)?.prefill : undefined;

  const [form, setForm] = useState<JourneyFormData>(prefill?.form ? { ...EMPTY_FORM, ...prefill.form } : { ...EMPTY_FORM });
  const [sectors, setSectors] = useState<[Sector, Sector]>(
    prefill?.sectors && prefill.sectors.length >= 2
      ? [{ ...EMPTY_SECTOR, ...prefill.sectors[0] }, { ...EMPTY_SECTOR, ...prefill.sectors[1] }]
      : [{ ...EMPTY_SECTOR }, { ...EMPTY_SECTOR }]
  );
  const [defects, setDefects] = useState<DefectRow[]>(prefill?.defects ?? []);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);
  const [errors, setErrors] = useState<Partial<Record<keyof JourneyFormData, string>>>({});

  // ── Upload modal state ─────────────────────────────────
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState("No file chosen");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-open upload modal 500 ms after mounting (new entry only, matching reference)
  useEffect(() => {
    if (isEdit) return;
    const t = setTimeout(() => setShowUploadModal(true), 500);
    return () => clearTimeout(t);
  }, [isEdit]);

  // ── Upload helpers ────────────────────────────────────
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

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_SAMPLE_ROW]);
    ws["!cols"] = TEMPLATE_HEADERS.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Journey Log");
    XLSX.writeFile(wb, "journey_log_template.xlsx");
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
          if (field.endsWith("_date") || ["date", "next_due_maintenance", "due_at_date", "daily_inspection"].includes(field)) {
            (parsed as Record<string, string>)[k] = fmtExcelDate(val);
          } else if (["pic_sign", "commander_sign", "daily_inspection_sign", "sign_stamp"].includes(field)) {
            (parsed as Record<string, string>)[k] = str(val) || "No";
          } else {
            (parsed as Record<string, string>)[k] = str(val);
          }
        }
        setForm({ ...EMPTY_FORM, ...parsed });

        // Fill sectors
        const buildSector = (prefix: string): Sector => {
          const s: Partial<Sector> = {};
          for (const [col, field] of Object.entries(SECTOR_COL_MAP)) {
            const val = r[`${prefix} ${col}`];
            (s as Record<string, string>)[field] = field.endsWith("_date") ? fmtExcelDate(val) : str(val);
          }
          return { ...EMPTY_SECTOR, ...s };
        };
        setSectors([buildSector("S1"), buildSector("S2")]);
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
        setForm({
          company_name: data.company_name ?? "",
          date: fmt(data.date),
          registration: data.registration ?? "",
          aircraft_type: data.aircraft_type ?? "",
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
          aircraft_total_hrs: data.aircraft_total_hrs?.toString() ?? "",
          aircraft_total_cyc: data.aircraft_total_cyc?.toString() ?? "",
          fuel_flight_deck_gauge: data.fuel_flight_deck_gauge?.toString() ?? "",
          next_due_maintenance: fmt(data.next_due_maintenance),
          due_at_date: fmt(data.due_at_date),
          due_at_hours: data.due_at_hours?.toString() ?? "",
          total_flight_hrs: data.total_flight_hrs?.toString() ?? "",
          total_flight_cyc: data.total_flight_cyc?.toString() ?? "",
          daily_inspection: fmt(data.daily_inspection),
          type_of_maintenance: data.type_of_maintenance ?? "",
          apu_hrs: data.apu_hrs?.toString() ?? "",
          apu_cyc: data.apu_cyc?.toString() ?? "",
          oil_uplift_eng1: data.oil_uplift_eng1?.toString() ?? "",
          oil_uplift_eng2: data.oil_uplift_eng2?.toString() ?? "",
          oil_uplift_apu: data.oil_uplift_apu?.toString() ?? "",
          daily_inspection_sign: data.daily_inspection_sign ?? "No",
          sign_stamp: data.sign_stamp ?? "No",
        });
        const mappedSectors: Sector[] = (data.sectors ?? []).slice(0, 2).map((s: any) => ({
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
        while (mappedSectors.length < 2) mappedSectors.push({ ...EMPTY_SECTOR });
        setSectors(mappedSectors as [Sector, Sector]);
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

  const updateSector = (i: 0 | 1, field: keyof Sector, val: string) =>
    setSectors((p) => { const s = [...p] as [Sector, Sector]; s[i] = { ...s[i], [field]: val }; return s; });

  const addDefect = () => setDefects((p) => [...p, { id: Date.now(), ...EMPTY_DEFECT }]);
  const updateDefect = (i: number, field: keyof Omit<DefectRow, "id">, val: string) =>
    setDefects((p) => p.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  const removeDefect = (did: number) => setDefects((p) => p.filter((d) => d.id !== did));

  const validate = (): boolean => {
    const e: Partial<Record<keyof JourneyFormData, string>> = {};
    if (!form.date)         e.date         = "Required";
    if (!form.registration) e.registration = "Required";
    if (!form.pic_name)     e.pic_name     = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, aircraft_id: id, sectors, defects };
      if (isEdit && logId) {
        await api.journeyLogs.update(logId, payload);
      } else {
        await api.journeyLogs.create(payload);
      }
      toast.success(isEdit ? "Journey log updated." : "Journey log entry created.");
      navigate(`/aircraft/${id}/journey`);
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
      {/* ── Upload Modal (auto-opens 500ms after navigating here for new entries) ── */}
      <Dialog
        open={showUploadModal}
        onOpenChange={(o) => { if (!o) { setShowUploadModal(false); setUploadFile(null); setUploadFileName("No file chosen"); setUploadError(null); } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#556ee6]">
              <Upload className="h-5 w-5" /> Upload Journey Log
            </DialogTitle>
          </DialogHeader>

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
            <button type="button" onClick={() => navigate(`/aircraft/${id}/journey`)}
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
              onClick={() => navigate(`/aircraft/${id}/journey`)}>Cancel</Button>
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

            {/* 1. Journey Log Header */}
            <Section title="Journey Log Panel">
              <Grid cols={3}>
                <F label="Company Name">
                  <Input className={inp} placeholder="Company Name" value={form.company_name} onChange={set("company_name")} />
                </F>
                <F label="Date" required error={errors.date}>
                  <Input type="date" className={ec("date")} value={form.date} onChange={set("date")} />
                </F>
                <F label="Aircraft Registration" required error={errors.registration}>
                  <Input className={cn(ec("registration"), "uppercase")} placeholder="e.g. 9M-XXA" value={form.registration} onChange={set("registration")} />
                </F>
                <F label="Aircraft Type">
                  <Input className={inp} placeholder="e.g. Boeing 737-800" value={form.aircraft_type} onChange={set("aircraft_type")} />
                </F>
                <F label="Log Serial No.">
                  <Input className={inp} placeholder="e.g. 9MXXA-001" value={form.log_sl_no} onChange={set("log_sl_no")} />
                </F>
              </Grid>
              <Grid cols={3}>
                <F label="PIC Name" required error={errors.pic_name}>
                  <Input className={ec("pic_name")} placeholder="Capt. Name" value={form.pic_name} onChange={set("pic_name")} />
                </F>
                <F label="PIC Licence No.">
                  <Input className={inp} placeholder="ATPL-MY-XXXXX" value={form.pic_license_no} onChange={set("pic_license_no")} />
                </F>
              </Grid>
              <Grid cols={2}>
                <SignBtn label="PIC Signature" value={form.pic_sign} onChange={setSign("pic_sign")} />
                <SignBtn label="Commander Pre-Flight Inspection Signature" value={form.commander_sign} onChange={setSign("commander_sign")} />
              </Grid>
            </Section>

            {/* 2. Sectors (fixed 2) */}
            <Section title="Flight Sectors">
              <div className="space-y-4">
                {([0, 1] as const).map((i) => (
                  <SectorCard key={i} index={i} sector={sectors[i]}
                    onChange={(f, v) => updateSector(i, f, v)} />
                ))}
              </div>
            </Section>

            {/* 3. Fuel */}
            <Section title="Fuel">
              <Grid cols={3}>
                <F label="Fuel Arrival (kg)"><Input className={inp} type="number" min="0" placeholder="0" value={form.fuel_arrival} onChange={set("fuel_arrival")} /></F>
                <F label="Fuel Departure (kg)"><Input className={inp} type="number" min="0" placeholder="0" value={form.fuel_departure} onChange={set("fuel_departure")} /></F>
                <F label="Remaining Fuel Onboard (kg)"><Input className={inp} type="number" min="0" placeholder="0" value={form.remaining_fuel_onboard} onChange={set("remaining_fuel_onboard")} /></F>
                <F label="Fuel Uplift (kg)"><Input className={inp} type="number" min="0" placeholder="0" value={form.fuel_uplift} onChange={set("fuel_uplift")} /></F>
                <F label="Calculate Total Fuel (kg)"><Input className={inp} type="number" min="0" placeholder="0" value={form.calculate_total_fuel} onChange={set("calculate_total_fuel")} /></F>
                <F label="Fuel Discrepancy (kg)"><Input className={inp} type="number" placeholder="0" value={form.fuel_discrepancy} onChange={set("fuel_discrepancy")} /></F>
                <F label="Aircraft Total Hrs"><Input className={inp} type="number" step="0.01" min="0" placeholder="0" value={form.aircraft_total_hrs} onChange={set("aircraft_total_hrs")} /></F>
                <F label="Aircraft Total Cyc"><Input className={inp} type="number" min="0" placeholder="0" value={form.aircraft_total_cyc} onChange={set("aircraft_total_cyc")} /></F>
                <F label="Fuel Flight Deck Gauge (kg)"><Input className={inp} type="number" min="0" placeholder="0" value={form.fuel_flight_deck_gauge} onChange={set("fuel_flight_deck_gauge")} /></F>
              </Grid>
            </Section>

            {/* 4. Maintenance */}
            <Section title="Maintenance">
              <Grid cols={3}>
                <F label="Next Due Maintenance"><Input className={inp} type="date" value={form.next_due_maintenance} onChange={set("next_due_maintenance")} /></F>
                <F label="Due @ Date"><Input className={inp} type="date" value={form.due_at_date} onChange={set("due_at_date")} /></F>
                <F label="Due @ Hours"><Input className={inp} type="number" step="0.1" min="0" placeholder="0" value={form.due_at_hours} onChange={set("due_at_hours")} /></F>
                <F label="Total Flight Hrs"><Input className={inp} type="number" step="0.01" min="0" placeholder="0" value={form.total_flight_hrs} onChange={set("total_flight_hrs")} /></F>
                <F label="Total Flight Cyc"><Input className={inp} type="number" min="0" placeholder="0" value={form.total_flight_cyc} onChange={set("total_flight_cyc")} /></F>
                <F label="Daily Inspection"><Input className={inp} type="date" value={form.daily_inspection} onChange={set("daily_inspection")} /></F>
                <F label="Type of Maintenance"><Input className={inp} placeholder="e.g. Daily Check" value={form.type_of_maintenance} onChange={set("type_of_maintenance")} /></F>
                <F label="APU Hrs"><Input className={inp} type="number" step="0.01" min="0" placeholder="0" value={form.apu_hrs} onChange={set("apu_hrs")} /></F>
                <F label="APU Cyc"><Input className={inp} type="number" min="0" placeholder="0" value={form.apu_cyc} onChange={set("apu_cyc")} /></F>
              </Grid>
            </Section>

            {/* 5. Oil */}
            <Section title="Oil Uplift">
              <Grid cols={3}>
                <F label="Oil Uplift Engine No.1 (L)"><Input className={inp} type="number" step="0.1" min="0" placeholder="0.0" value={form.oil_uplift_eng1} onChange={set("oil_uplift_eng1")} /></F>
                <F label="Oil Uplift Engine No.2 (L)"><Input className={inp} type="number" step="0.1" min="0" placeholder="0.0" value={form.oil_uplift_eng2} onChange={set("oil_uplift_eng2")} /></F>
                <F label="Oil Uplift APU (L)"><Input className={inp} type="number" step="0.1" min="0" placeholder="0.0" value={form.oil_uplift_apu} onChange={set("oil_uplift_apu")} /></F>
              </Grid>
            </Section>

            {/* 6. Action Taken / Defects */}
            <Section title="Action Taken">
              <div className="space-y-4">
                {defects.length === 0 && <p className="text-xs text-muted-foreground italic">No entries. Use the button below to add.</p>}
                {defects.map((d, i) => (
                  <div key={d.id} className="rounded-xl border p-4 space-y-4">
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

            {/* 7. Signatures */}
            <Section title="Signatures">
              <Grid cols={2}>
                <SignBtn label="Daily Inspection Signature &amp; Stamp" value={form.daily_inspection_sign} onChange={setSign("daily_inspection_sign")} />
                <SignBtn label="Signature and Stamp" value={form.sign_stamp} onChange={setSign("sign_stamp")} />
              </Grid>
            </Section>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50/60">
            <p className="text-[11px] text-muted-foreground">Fields marked <span className="text-rose-500 font-bold">*</span> are required</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/aircraft/${id}/journey`)}>Cancel</Button>
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
