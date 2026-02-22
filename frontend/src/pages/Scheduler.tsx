import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Search,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";


interface Aircraft {
  id: string;
  model: string;
  msn: string;
  registration_number: string;
  flight_hours: number;
  flight_cycles: number;
}

interface SchedulerEntry {
  id: string;
  aircraft_id: string;
  flight_date: string;
  flight_hours: number;
  flight_cycles: number;
}


const fmtDate = (d?: string | Date | null) => {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy"); } catch { return "—"; }
};

const ACCEPTED = ".xlsx,.xls,.csv";

/** Map common Excel column names to our field names */
const normaliseKey = (key: string): string => {
  const k = key.toLowerCase().replace(/[\s_-]/g, "");
  if (["date", "flightdate", "aircraftdate", "flightdt"].includes(k)) return "flight_date";
  if (["hours", "flighthours", "aircrafthours", "flighthr", "fh"].includes(k)) return "flight_hours";
  if (["cycles", "flightcycles", "aircraftcycles", "fc"].includes(k)) return "flight_cycles";
  return k;
};

/** Parse raw Excel rows into typed entries */
const normaliseRows = (raw: any[]): Array<{ flight_date: string; flight_hours: number; flight_cycles: number }> =>
  raw
    .map((row) => {
      const n: Record<string, any> = {};
      Object.entries(row).forEach(([k, v]) => {
        n[normaliseKey(k)] = v;
      });

      // Excel dates can come as serial numbers
      let dateVal: string;
      const rawDate = n["flight_date"];
      if (typeof rawDate === "number") {
        // Excel serial date → JS Date
        const d = XLSX.SSF.parse_date_code(rawDate);
        dateVal = new Date(d.y, d.m - 1, d.d).toISOString();
      } else if (rawDate) {
        dateVal = new Date(rawDate).toISOString();
      } else {
        return null; // skip rows with no date
      }

      return {
        flight_date: dateVal,
        flight_hours: parseFloat(String(n["flight_hours"] ?? 0)) || 0,
        flight_cycles: parseFloat(String(n["flight_cycles"] ?? 0)) || 0,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);


const StatPill = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col gap-0.5 min-w-[80px]">
    <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">{label}</span>
    <span className="text-sm font-semibold text-white leading-none">{value ?? "—"}</span>
  </div>
);

const PER_PAGE = 10;

const Scheduler = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [entries, setEntries] = useState<SchedulerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // File upload
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Table controls
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);


  const loadEntries = useCallback(async () => {
    if (!id) return;
    try {
      const list = await (api as any).scheduler.getForAircraft(id);
      setEntries(list);
    } catch {
      toast.error("Failed to load scheduler entries.");
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      try {
        const [ac, list] = await Promise.all([
          api.aircrafts.get(id),
          (api as any).scheduler.getForAircraft(id),
        ]);
        setAircraft(ac);
        setEntries(list);
      } catch {
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleUpload = () => {
    if (!file) return;
    const reader = new FileReader();
    const usesBinary = !!reader.readAsBinaryString;

    reader.onload = async (e) => {
      try {
        setUploading(true);
        const bstr = e.target?.result;
        const wb = XLSX.read(bstr, { type: usesBinary ? "binary" : "array", bookVBA: true });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { raw: false });

        if (rawData.length === 0) {
          toast.error("The spreadsheet appears to be empty.");
          return;
        }

        const rows = normaliseRows(rawData);
        if (rows.length === 0) {
          toast.error("Could not find date/hours/cycles columns. Expected: Date, Hours, Cycles.");
          return;
        }

        const updated = await (api as any).scheduler.upload(id, rows);
        setEntries(updated);
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        toast.success(`${rows.length} schedule entries uploaded successfully.`);
      } catch (err) {
        console.error(err);
        toast.error("Upload failed. Please check the file format.");
      } finally {
        setUploading(false);
      }
    };

    if (usesBinary) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDelete = async (entry: SchedulerEntry) => {
    if (!confirm(`Delete flight entry for ${fmtDate(entry.flight_date)}?`)) return;
    setDeletingId(entry.id);
    try {
      await (api as any).scheduler.deleteEntry(entry.id);
      await loadEntries();
      toast.success("Entry deleted.");
    } catch {
      toast.error("Failed to delete entry.");
    } finally {
      setDeletingId(null);
    }
  };


  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    return (
      fmtDate(e.flight_date).toLowerCase().includes(q) ||
      String(e.flight_hours).includes(q) ||
      String(e.flight_cycles).includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-6 pb-12">


      {/* ──── Upload card ──── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">

        <div className="px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                Select spreadsheet (.xlsx / .xls / .csv)
              </label>
              <input
                ref={fileRef}
                id="scheduler-file"
                type="file"
                accept={ACCEPTED}
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-50"
              />
            </div>
            {file && (
              <Button
                size="sm"
                className="bg-[#556ee6] hover:bg-[#4560d5] gap-1.5 shrink-0"
                disabled={uploading}
                onClick={handleUpload}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Uploading…" : "Submit"}
              </Button>
            )}
          </div>

          {file && (
            <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              {file.name} selected
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search date, hours ..."
                className="pl-8 h-8 text-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{entries.length} total entries</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                {["#", "Flight Date", "Flight Hours", "Flight Cycles", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded bg-gray-100 animate-pulse" style={{ width: "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-8 w-8 opacity-30" />
                      <p className="text-sm font-medium">
                        {entries.length === 0
                          ? "No schedule entries yet. Upload an Excel file to get started."
                          : "No entries match your search."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((entry, idx) => {
                  const rowNum = (page - 1) * PER_PAGE + idx + 1;
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* # */}
                      <td className="px-4 py-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#556ee6]/10 text-[#556ee6] text-[11px] font-bold">
                          {rowNum}
                        </div>
                      </td>

                      {/* Flight Date */}
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-sm font-medium">
                        {fmtDate(entry.flight_date)}
                      </td>

                      {/* Flight Hours */}
                      <td className="px-4 py-3 tabular-nums text-gray-700">
                        {entry.flight_hours.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} FH
                      </td>

                      {/* Flight Cycles */}
                      <td className="px-4 py-3 tabular-nums text-gray-700">
                        {entry.flight_cycles} FC
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          disabled={deletingId === entry.id}
                          onClick={() => handleDelete(entry)}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                            deletingId === entry.id
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-red-500 hover:bg-red-50"
                          )}
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div className="flex items-center justify-between px-5 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={page === i + 1 ? "default" : "outline"}
                  className={cn("h-7 w-7 p-0 text-xs", page === i + 1 && "bg-[#556ee6] hover:bg-[#4560d5]")}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Scheduler;
