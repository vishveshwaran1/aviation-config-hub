import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Info,
  Pencil,
  Trash2,
  Upload,
  CheckCircle,
  XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { api } from "@/lib/api";
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
import { format } from "date-fns";

interface Aircraft {
  id: string;
  model: string;
  registration_number: string;
  flight_hours: number;
  flight_cycles: number;
  msn: string;
}

interface AircraftComponent {
  id: string;
  aircraft_id?: string;
  ata?: string;
  section: string;           // POS
  manufacturer?: string;
  model?: string;            // Description
  serial_number?: string;
  part_number?: string;
  last_shop_visit_date?: string; // INST Date
  hours_since_new?: number;      // TSN
  cycles_since_new?: number;     // CSN
  tsi?: number;                  // Time Since Installation
  csi?: number;                  // Cycles Since Installation
}

const fmtDate = (d?: string | null) =>
  d ? format(new Date(d), "dd MMM yyyy") : "";

const fmtNum = (n?: number | null) =>
  n !== undefined && n !== null ? n.toLocaleString() : "";

const StatPill = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col gap-0.5 min-w-[80px]">
    <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">{label}</span>
    <span className="text-sm font-semibold text-white leading-none">{value ?? "-"}</span>
  </div>
);

const OccmPanel = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aircraft, setAircraft]     = useState<Aircraft | null>(null);
  const [components, setComponents] = useState<AircraftComponent[]>([]);
  const [loadingAc, setLoadingAc]   = useState(true);
  const [loadingComp, setLoadingComp] = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const PER_PAGE = 10;

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<AircraftComponent | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // Excel import dialog
  const [importRows, setImportRows]   = useState<AircraftComponent[]>([]);
  const [importing, setImporting]     = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadComponents = () => {
    if (!id) return;
    setLoadingComp(true);
    api.aircraftComponents
      .getForAircraft(id)
      .then((d: AircraftComponent[]) => setComponents(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoadingComp(false));
  };

  useEffect(() => {
    if (!id) return;
    api.aircrafts
      .get(id)
      .then((d: Aircraft) => setAircraft(d))
      .catch(console.error)
      .finally(() => setLoadingAc(false));
    loadComponents();
  }, [id]);

  /*  Delete*/
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.aircraftComponents.delete(deleteTarget.id);
      setComponents((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Component deleted.");
    } catch {
      toast.error("Failed to delete component.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* Excel import*/
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const bstr = ev.target?.result;
        const wb   = XLSX.read(bstr, { type: "binary" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { raw: false }) as Record<string, string>[];

        const mapped: AircraftComponent[] = rows.map((r) => ({
          id: "",
          aircraft_id: id,
          ata:               r["ATA"]          ?? r["ata"]               ?? "",
          part_number:       r["PART_NO"]      ?? r["part_number"]       ?? "",
          serial_number:     r["SERIAL_NO"]    ?? r["serial_number"]     ?? "",
          model:             r["DESCRIPTION"]  ?? r["model"]             ?? "",
          section:           r["POS"]          ?? r["section"]           ?? "",
          manufacturer:      r["MANUFACTURER"] ?? r["manufacturer"]      ?? "",
          last_shop_visit_date: r["INST_DATE"] ?? r["last_shop_visit_date"] ?? "",
          hours_since_new:   parseFloat(r["TSN"] ?? r["hours_since_new"] ?? "0") || 0,
          cycles_since_new:  parseFloat(r["CSN"] ?? r["cycles_since_new"] ?? "0") || 0,
          tsi:               parseFloat(r["TSI"] ?? r["tsi"] ?? "0") || 0,
          csi:               parseFloat(r["CSI"] ?? r["csi"] ?? "0") || 0,
        }));

        setImportRows(mapped);
        setShowImportModal(true);
      } catch {
        toast.error("Failed to parse Excel file. Check column headers.");
      }
    };
    reader.readAsBinaryString(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (!id || importRows.length === 0) return;
    setImporting(true);
    try {
      // Strip the temporary `id: ""` field; only send data columns + aircraft_id
      const payload = importRows.map(({ id: _omit, ...r }) => ({ ...r, aircraft_id: id }));
      await api.aircraftComponents.create(payload);
      toast.success(`${importRows.length} component(s) imported successfully.`);
      setShowImportModal(false);
      setImportRows([]);
      loadComponents();
    } catch(error) {
      toast.error("Import failed. Please try again.");
      console.log(error)
    } finally {
      setImporting(false);
    }
  };

  /* Derived */
  const filtered = components.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.section?.toLowerCase().includes(q) ||
      c.manufacturer?.toLowerCase().includes(q) ||
      c.model?.toLowerCase().includes(q) ||
      c.serial_number?.toLowerCase().includes(q) ||
      c.part_number?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const loading = loadingAc || loadingComp;

  /*  Render  */
  return (
    <div className="space-y-6 pb-12">

      {/*  Aircraft header  */}
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
                OCCM Panel On-Condition Component Management
              </p>
              <h1 className="text-lg font-bold text-white leading-none">
                {loadingAc ? "Loading..." : (aircraft?.model ?? "Aircraft")}
              </h1>
            </div>
          </div>
          {!loadingAc && aircraft && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <StatPill label="Registration"  value={aircraft.registration_number} />
              <div className="hidden sm:block w-px h-7 bg-white/20" />
              <StatPill label="Flight Hours"  value={fmtNum(aircraft.flight_hours)} />
              <div className="hidden sm:block w-px h-7 bg-white/20" />
              <StatPill label="Flight Cycles" value={fmtNum(aircraft.flight_cycles)} />
              <div className="hidden sm:block w-px h-7 bg-white/20" />
              <StatPill label="MSN"           value={aircraft.msn} />
            </div>
          )}
        </div>
      </div>

      {/*  Component table  */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search part, serial etc..."
                className="pl-8 h-8 text-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            {/* Excel upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs whitespace-nowrap"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              Import Excel
            </Button>
          </div>
        </div>

        {/* Excel column hint */}
        <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 text-[11px] text-blue-600">
          Expected Excel columns: <span className="font-semibold">PART_NO, SERIAL_NO, DESCRIPTION, POS, MANUFACTURER, INST_DATE, TSN, CSN</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                {["#", "Part No.", "Serial No.", "Description", "POS", "INST Date","TSN", "CSN", "TSI","CSI", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded bg-gray-100 animate-pulse" style={{ width: "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Info className="h-8 w-8 opacity-30" />
                      <p className="text-sm font-medium">
                        {components.length === 0 ? "No components registered for this aircraft." : "No components match your search."}
                      </p>
                      {components.length === 0 && (
                        <p className="text-xs">Use the Import Excel button to bulk-add components.</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((comp, idx) => {
                  const rowNum = (page - 1) * PER_PAGE + idx + 1;
                  return (
                    <tr key={comp.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* # */}
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{rowNum}</td>
                      {/* Part No. */}
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">
                        {comp.part_number || "NA"}
                      </td>
                      {/* Serial No. */}
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {comp.serial_number || "NA"}
                      </td>
                      {/* Description */}
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-[180px] truncate" title={comp.model ?? ""}>
                        {comp.model || "NA"}
                      </td>
                      {/* POS */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {comp.section || "NA"}
                      </td>
                      {/* INST Date */}
                      <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">
                        {fmtDate(comp.last_shop_visit_date) || "NA"}
                      </td>
                      {/* TSN */}
                      <td className="px-4 py-3 tabular-nums text-gray-700 whitespace-nowrap">
                        {fmtNum(comp.hours_since_new)}
                      </td>
                      {/* CSN */}
                      <td className="px-4 py-3 tabular-nums text-gray-700 whitespace-nowrap">
                        {fmtNum(comp.cycles_since_new)}
                      </td>
                      {/* TSI */}
                      <td className="px-4 py-3 tabular-nums text-gray-700 whitespace-nowrap">
                        {fmtNum(comp.tsi)}
                      </td>
                      {/* CSI */}
                      <td className="px-4 py-3 tabular-nums text-gray-700 whitespace-nowrap">
                        {fmtNum(comp.csi)}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/aircraft/${id}/occm/${comp.id}/edit`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(comp)}
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
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                 Prev
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
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/*  Delete Confirmation Dialog  */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" /> Delete Component
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.part_number || deleteTarget?.model || "this component"}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" disabled={deleting} onClick={confirmDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*  Excel Import Preview Dialog  */}
      <Dialog open={showImportModal} onOpenChange={(o) => !o && setShowImportModal(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#556ee6]">
              <Upload className="h-5 w-5" /> Confirm Import
            </DialogTitle>
            <DialogDescription>
              <strong>{importRows.length}</strong> component row(s) detected. Review a preview below, then approve to import.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto max-h-64 border rounded-lg text-xs">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {["Part No.", "Serial No.", "Description", "POS", "INST Date", "TSN", "CSN", "TSI", "CSI"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {importRows.slice(0, 20).map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 font-mono">{r.part_number || "NA"}</td>
                    <td className="px-3 py-1.5 font-mono">{r.serial_number || "NA"}</td>
                    <td className="px-3 py-1.5 max-w-[140px] truncate">{r.model || "NA"}</td>
                    <td className="px-3 py-1.5">{r.section || "NA"}</td>
                    <td className="px-3 py-1.5 text-xs">{fmtDate(r.last_shop_visit_date) || "NA"}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.hours_since_new ?? 0}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.cycles_since_new ?? 0}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.tsi ?? 0}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.csi ?? 0}</td>
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

          <DialogFooter className="gap-2">
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
  );
};

export default OccmPanel;
