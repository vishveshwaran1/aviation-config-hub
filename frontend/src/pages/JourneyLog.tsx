import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Plus,
  Pencil,
  Trash2,
  Plane,
  Info,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface JourneyLogEntry {
  id: string;
  aircraft_type: string;
  registration: string;
  flight_num: string;
  sector_from: string;
  sector_to: string;
  total_flight_hrs: number;
  total_flight_cyc: number;
  date: string;
  pic_name: string;
  company_name?: string;
}


const MOCK_LOGS: JourneyLogEntry[] = [
  { id: "JL001", aircraft_type: "Boeing 737-800", registration: "9M-XXA", flight_num: "AK101", sector_from: "KUL", sector_to: "SIN", total_flight_hrs: 1.25, total_flight_cyc: 1, date: "2026-02-01", pic_name: "Capt. Ahmad", company_name: "AeroTech MRO" },
  { id: "JL002", aircraft_type: "Boeing 737-800", registration: "9M-XXA", flight_num: "AK102", sector_from: "SIN", sector_to: "KUL", total_flight_hrs: 1.30, total_flight_cyc: 1, date: "2026-02-01", pic_name: "Capt. Ahmad", company_name: "AeroTech MRO" },
  { id: "JL003", aircraft_type: "Boeing 737-800", registration: "9M-XXA", flight_num: "AK201", sector_from: "KUL", sector_to: "BKK", total_flight_hrs: 2.10, total_flight_cyc: 1, date: "2026-02-03", pic_name: "Capt. Zulkifli", company_name: "AeroTech MRO" },
  { id: "JL004", aircraft_type: "Boeing 737-800", registration: "9M-XXA", flight_num: "AK202", sector_from: "BKK", sector_to: "KUL", total_flight_hrs: 2.05, total_flight_cyc: 1, date: "2026-02-03", pic_name: "Capt. Zulkifli", company_name: "AeroTech MRO" },
  { id: "JL005", aircraft_type: "Boeing 737-800", registration: "9M-XXA", flight_num: "AK305", sector_from: "KUL", sector_to: "CGK", total_flight_hrs: 1.55, total_flight_cyc: 1, date: "2026-02-05", pic_name: "Capt. Ravi", company_name: "AeroTech MRO" },
  { id: "JL006", aircraft_type: "Boeing 737-800", registration: "9M-XXA", flight_num: "AK306", sector_from: "CGK", sector_to: "KUL", total_flight_hrs: 1.50, total_flight_cyc: 1, date: "2026-02-05", pic_name: "Capt. Ravi", company_name: "AeroTech MRO" },
  { id: "JL007", aircraft_type: "Boeing 737-800", registration: "9M-XXA", flight_num: "AK411", sector_from: "KUL", sector_to: "PEN", total_flight_hrs: 0.45, total_flight_cyc: 1, date: "2026-02-07", pic_name: "Capt. Nizam", company_name: "AeroTech MRO" },
  { id: "JL008", aircraft_type: "Boeing 737-800", registration: "9M-XXA", flight_num: "AK412", sector_from: "PEN", sector_to: "KUL", total_flight_hrs: 0.50, total_flight_cyc: 1, date: "2026-02-07", pic_name: "Capt. Nizam", company_name: "AeroTech MRO" },
];


const PER_PAGE = 10;

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};


const JourneyLog = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────
  const [logs, setLogs] = useState<JourneyLogEntry[]>(MOCK_LOGS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<JourneyLogEntry | null>(null);

  // ── Backend fetch placeholder (uncomment when backend is ready) ──
  // const [loading, setLoading] = useState(true);
  // useEffect(() => {
  //   if (!id) return;
  //   api.journeyLogs
  //     .getForAircraft(id)
  //     .then((d: JourneyLogEntry[]) => setLogs(Array.isArray(d) ? d : []))
  //     .catch(console.error)
  //     .finally(() => setLoading(false));
  // }, [id]);

  // ── Delete handler (static) ────────────────────────────
  const confirmDelete = () => {
    if (!deleteTarget) return;
    setLogs((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    toast.success("Journey log entry deleted.");
    setDeleteTarget(null);

    // Uncomment when backend is ready:
    // await api.journeyLogs.delete(deleteTarget.id);
  };


  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.flight_num.toLowerCase().includes(q) ||
      l.sector_from.toLowerCase().includes(q) ||
      l.sector_to.toLowerCase().includes(q) ||
      l.registration.toLowerCase().includes(q) ||
      l.aircraft_type.toLowerCase().includes(q) ||
      l.pic_name.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

 
  return (
    <div className="space-y-6 pb-12">

      <div className="rounded-xl bg-[#556ee6] px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/55 font-medium mb-0.5">
                S2 — Journey Log
              </p>
              <h1 className="text-lg font-bold text-white leading-none">
                Flight Journey Records
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {logs.length} entries
            </span>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-white text-[#556ee6] hover:bg-white/90 font-semibold text-xs"
              onClick={() => navigate(`/aircraft/${id}/journey/new`)}
            >
              <Plus className="h-3.5 w-3.5" />
              Create New
            </Button>
          </div>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Journey Log Entries</h2>
            <p className="text-xs text-muted-foreground">
              {filtered.length} of {logs.length} records
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search flight, sector, PIC name…"
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                {[
                  "#",
                  "Date",
                  "Flight No.",
                  "From",
                  "To",
                  "Aircraft Type",
                  "Registration",
                  "Flight Hrs",
                  "Cycles",
                  "PIC Name",
                  "Actions",
                ].map((h) => (
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Info className="h-8 w-8 opacity-30" />
                      <p className="text-sm font-medium">
                        {logs.length === 0
                          ? "No journey log entries yet."
                          : "No entries match your search."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((log, idx) => {
                  const rowNum = (page - 1) * PER_PAGE + idx + 1;
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                        {rowNum}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {fmtDate(log.date)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#556ee6] whitespace-nowrap">
                        {log.flight_num}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-gray-700">
                            {log.sector_from}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Plane className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                          <span className="inline-flex items-center justify-center rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-gray-700">
                            {log.sector_to}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                        {log.aircraft_type}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {log.registration}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-xs font-medium text-gray-700 whitespace-nowrap">
                        {log.total_flight_hrs.toFixed(2)} hrs
                      </td>
                      <td className="px-4 py-3 tabular-nums text-xs text-gray-700 whitespace-nowrap">
                        {log.total_flight_cyc}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        <span className="font-medium text-gray-700">{log.pic_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/aircraft/${id}/journey/${log.id}/view`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/aircraft/${id}/journey/${log.id}/edit`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(log)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
                  className="h-7 w-7 p-0 text-xs"
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

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" /> Delete Entry
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete flight{" "}
              <strong>{deleteTarget?.flight_num}</strong> (
              {deleteTarget?.sector_from} → {deleteTarget?.sector_to})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JourneyLog;
