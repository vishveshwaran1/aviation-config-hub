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
  AlertTriangle,
  Eye,
  FileUp,
  FileText,
  X,
  History,
  Plus,
  Calendar,
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
  component_name?: string;
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
  certificate_url?: string;
}

const fmtDate = (d?: string | null) =>
  d ? format(new Date(d), "dd MMM yyyy") : "";

const fmtNum = (n?: number | null) =>
  n !== undefined && n !== null ? n.toLocaleString() : "";

const OccmPanel = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

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

  // View dialog
  const [viewTarget, setViewTarget] = useState<AircraftComponent | null>(null);

  // OCCM History Dialog
  const [historyTarget, setHistoryTarget] = useState<AircraftComponent | null>(null);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);

  const [newEvent, setNewEvent] = useState({
    event_date: new Date().toISOString().split('T')[0],
    action_type: "Inspection",
    ac_reg_facility: "",
    airframe_total_time: "",
    component_tsn_csn: "",
    component_tso_cso: "",
    doc_ref_details: ""
  });

  const handleOpenHistory = async (comp: AircraftComponent) => {
    setHistoryTarget(comp);
    setLoadingHistory(true);
    setShowAddForm(false);
    
    // Pre-populate some fields in newEvent based on component
    setNewEvent({
      event_date: new Date().toISOString().split('T')[0],
      action_type: "Inspection",
      ac_reg_facility: aircraft?.registration_number || "",
      airframe_total_time: aircraft ? `${fmtNum(aircraft.flight_hours)} FH / ${fmtNum(aircraft.flight_cycles)} FC` : "",
      component_tsn_csn: `${fmtNum(comp.hours_since_new)} FH / ${fmtNum(comp.cycles_since_new)} FC`,
      component_tso_cso: comp.tsi !== undefined && comp.csi !== undefined ? `${fmtNum(comp.tsi)} FH / ${fmtNum(comp.csi)} FC` : "",
      doc_ref_details: ""
    });

    try {
      if (comp.part_number && comp.serial_number) {
        const data = await api.occmHistory.getHistory(comp.part_number, comp.serial_number);
        setHistoryEvents(data);
        if (data.length === 0) {
          setShowAddForm(true);
        }
      } else {
        setHistoryEvents([]);
      }
    } catch (error) {
      console.error("Failed to load OCCM history:", error);
      toast.error("Failed to load OCCM history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddHistoryEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyTarget || !historyTarget.part_number || !historyTarget.serial_number) return;
    
    setAddingEvent(true);
    try {
      const payload = {
        part_number: historyTarget.part_number,
        serial_number: historyTarget.serial_number,
        component_name: historyTarget.component_name,
        manufacturer: historyTarget.manufacturer,
        date_of_manufacture: historyTarget.manufacture_date,
        ...newEvent
      };

      const created = await api.occmHistory.createEvent(payload);
      setHistoryEvents((prev) => [created, ...prev]);
      toast.success("History event added successfully.");
      setShowAddForm(false);
      
      // Reset fields
      setNewEvent({
        event_date: new Date().toISOString().split('T')[0],
        action_type: "Inspection",
        ac_reg_facility: aircraft?.registration_number || "",
        airframe_total_time: aircraft ? `${fmtNum(aircraft.flight_hours)} FH / ${fmtNum(aircraft.flight_cycles)} FC` : "",
        component_tsn_csn: `${fmtNum(historyTarget.hours_since_new)} FH / ${fmtNum(historyTarget.cycles_since_new)} FC`,
        component_tso_cso: historyTarget.tsi !== undefined && historyTarget.csi !== undefined ? `${fmtNum(historyTarget.tsi)} FH / ${fmtNum(historyTarget.csi)} FC` : "",
        doc_ref_details: ""
      });
    } catch (error) {
      console.error("Failed to add OCCM history event:", error);
      toast.error("Failed to add history event.");
    } finally {
      setAddingEvent(false);
    }
  };

  const handleDeleteHistoryEvent = async (eventId: string) => {
    try {
      await api.occmHistory.deleteEvent(eventId);
      setHistoryEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      toast.success("History event deleted.");
    } catch (error) {
      console.error("Failed to delete OCCM history event:", error);
      toast.error("Failed to delete history event.");
    }
  };

  // Certificate upload
  const [certUploadTarget, setCertUploadTarget] = useState<string | null>(null);
  const [uploadingCert, setUploadingCert] = useState(false);

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

  /*  Delete */
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

  /* Certificate upload */
  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !certUploadTarget) return;
    setUploadingCert(true);
    try {
      const updated = await api.aircraftComponents.uploadCertificate(certUploadTarget, file);
      setComponents((prev) =>
        prev.map((c) => (c.id === certUploadTarget ? { ...c, certificate_url: updated.certificate_url } : c))
      );
      // Also update viewTarget if viewing
      if (viewTarget?.id === certUploadTarget) {
        setViewTarget((prev) => prev ? { ...prev, certificate_url: updated.certificate_url } : prev);
      }
      toast.success("Certificate uploaded successfully.");
    } catch {
      toast.error("Failed to upload certificate.");
    } finally {
      setUploadingCert(false);
      setCertUploadTarget(null);
      e.target.value = "";
    }
  };

  const handleDeleteCertificate = async (componentId: string) => {
    try {
      await api.aircraftComponents.deleteCertificate(componentId);
      setComponents((prev) =>
        prev.map((c) => (c.id === componentId ? { ...c, certificate_url: undefined } : c))
      );
      if (viewTarget?.id === componentId) {
        setViewTarget((prev) => prev ? { ...prev, certificate_url: undefined } : prev);
      }
      toast.success("Certificate removed.");
    } catch {
      toast.error("Failed to remove certificate.");
    }
  };

  /* Excel import */
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
          ata:               r["ATA"]          ?? r["SYSTEM"]        ?? r["ata"]               ?? "",
          component_name:    r["COMPONENT"]    ?? r["component_name"] ?? r["Component"]        ?? "",
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
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (!id || importRows.length === 0) return;
    setImporting(true);
    try {
      const payload = importRows.map(({ id: _omit, ...r }) => ({ ...r, aircraft_id: id }));
      await api.aircraftComponents.create(payload);
      toast.success(`${importRows.length} component(s) imported successfully.`);
      setShowImportModal(false);
      setImportRows([]);
      loadComponents();
    } catch(error) {
      toast.error("Import failed. Please try again.");
      console.log(error);
    } finally {
      setImporting(false);
    }
  };

  /* ── Update a single cell in the import preview ── */
  const updateImportCell = (rowIndex: number, field: keyof AircraftComponent, value: string) => {
    setImportRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r;
        if (["hours_since_new", "cycles_since_new", "tsi", "csi"].includes(field)) {
          return { ...r, [field]: value === "" ? 0 : parseFloat(value) || 0 };
        }
        return { ...r, [field]: value };
      })
    );
  };

  const removeImportRow = (rowIndex: number) => {
    setImportRows((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  /* Derived */
  const filtered = components.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.ata?.toLowerCase().includes(q) ||
      c.component_name?.toLowerCase().includes(q) ||
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

  /* ── Helper: Get the base API URL for certificate links ── */
  const apiBase = (import.meta.env.VITE_USE_PROD_API === 'True'
    ? import.meta.env.VITE_API_URL_LIVE
    : (import.meta.env.VITE_API_URL_LOCAL || "http://localhost:3000")) as string;
  // certificate_url is like /api/uploads/certificates/xyz.pdf → strip the /api prefix since apiBase already includes the base
  const getCertUrl = (certUrl: string) => {
    // certUrl = "/api/uploads/certificates/file.pdf"
    // apiBase = "http://localhost:3000/api" or "http://localhost:3000"
    if (apiBase.endsWith('/api')) {
      return apiBase.replace(/\/api$/, '') + certUrl;
    }
    return apiBase + certUrl;
  };

  /*  Render  */
  return (
    <div className="space-y-6 pb-12">

      {/*  Aircraft header  */}
      <div className="rounded-xl  px-6 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/aircraft/${id}/activity`)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-black hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-5 w-8" />
            </button>
            <div>
              <p className="text-[15px] uppercase tracking-widest text-black font-medium mb-0.5">
                OCCM Panel
              </p>
            </div>
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
                placeholder="Search ATA, part, serial, component..."
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

        {/* Hidden certificate file input */}
        <input
          ref={certInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          className="hidden"
          onChange={handleCertificateUpload}
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                {["#", "System/ATA", "Component", "Part No.", "Serial No.", "Description", "POS", "INST Date","TSN", "CSN", "TSI","CSI", "Certificate", "Actions"].map((h) => (
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
                    {Array.from({ length: 14 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded bg-gray-100 animate-pulse" style={{ width: "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-16 text-center">
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
                      {/* System/ATA */}
                      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                        {comp.ata || "—"}
                      </td>
                      {/* Component */}
                      <td className="px-4 py-3 text-xs font-medium whitespace-nowrap max-w-[140px] truncate" title={(comp.component_name || comp.model || "Component")}>
                        <button
                          onClick={() => handleOpenHistory(comp)}
                          className="text-left font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer focus:outline-none"
                        >
                          {comp.component_name || comp.model || "Component"}
                        </button>
                      </td>
                      {/* Part No. */}
                      <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                        {comp.part_number ? (
                          <button
                            onClick={() => handleOpenHistory(comp)}
                            className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer focus:outline-none text-left"
                          >
                            {comp.part_number}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      {/* Serial No. */}
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                        {comp.serial_number ? (
                          <button
                            onClick={() => handleOpenHistory(comp)}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer focus:outline-none text-left"
                          >
                            {comp.serial_number}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      {/* Description */}
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-[180px] truncate animate-none" title={comp.model ?? ""}>
                        {comp.model ? (
                          <button
                            onClick={() => handleOpenHistory(comp)}
                            className="text-left text-gray-700 hover:text-indigo-600 hover:underline cursor-pointer focus:outline-none"
                          >
                            {comp.model}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      {/* POS */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {comp.section || "—"}
                      </td>
                      {/* INST Date */}
                      <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">
                        {fmtDate(comp.last_shop_visit_date) || "—"}
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
                      {/* Certificate */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {comp.certificate_url ? (
                            <>
                              <a
                                href={getCertUrl(comp.certificate_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-7 w-7 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="View Certificate"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </a>
                              <button
                                onClick={() => handleDeleteCertificate(comp.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-rose-400 hover:bg-rose-50 transition-colors"
                                title="Remove Certificate"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setCertUploadTarget(comp.id);
                                certInputRef.current?.click();
                              }}
                              disabled={uploadingCert}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Upload Certificate"
                            >
                              <FileUp className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenHistory(comp)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="OCCM History"
                          >
                            <History className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setViewTarget(comp)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
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

      {/*  View Component Dialog  */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#556ee6]">
              <Eye className="h-5 w-5" /> Component Details
            </DialogTitle>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[140px_1fr] gap-y-2.5 gap-x-4">
                {([
                  ["System / ATA", viewTarget.ata],
                  ["Component", viewTarget.component_name],
                  ["Part No.", viewTarget.part_number],
                  ["Serial No.", viewTarget.serial_number],
                  ["Description", viewTarget.model],
                  ["POS", viewTarget.section],
                  ["Manufacturer", viewTarget.manufacturer],
                  ["INST Date", fmtDate(viewTarget.last_shop_visit_date)],
                  ["TSN", fmtNum(viewTarget.hours_since_new)],
                  ["CSN", fmtNum(viewTarget.cycles_since_new)],
                  ["TSI", fmtNum(viewTarget.tsi)],
                  ["CSI", fmtNum(viewTarget.csi)],
                ] as [string, string | undefined][]).map(([label, value]) => (
                  <div key={label} className="contents">
                    <span className="text-muted-foreground font-medium text-xs uppercase tracking-wide">{label}</span>
                    <span className="text-gray-800 font-medium">{value || "—"}</span>
                  </div>
                ))}
              </div>

              {/* Certificate section */}
              <div className="border-t pt-3 mt-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Certificate</p>
                {viewTarget.certificate_url ? (
                  <div className="flex items-center gap-3">
                    <a
                      href={getCertUrl(viewTarget.certificate_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-[#556ee6] hover:underline font-medium"
                    >
                      <FileText className="h-4 w-4" /> View / Download Certificate
                    </a>
                    <button
                      onClick={() => handleDeleteCertificate(viewTarget.id)}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">No certificate uploaded.</span>
                    <button
                      onClick={() => {
                        setCertUploadTarget(viewTarget.id);
                        certInputRef.current?.click();
                      }}
                      className="text-xs text-[#556ee6] hover:underline font-medium"
                    >
                      Upload now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewTarget(null)}>
              Close
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-[#556ee6] hover:bg-[#4560d5]"
              onClick={() => {
                if (viewTarget) navigate(`/aircraft/${id}/occm/${viewTarget.id}/edit`);
                setViewTarget(null);
              }}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/*  Excel Import Preview Dialog — Editable  */}
      <Dialog open={showImportModal} onOpenChange={(o) => !o && setShowImportModal(false)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#556ee6]">
              <Upload className="h-5 w-5" /> Review & Edit Import
            </DialogTitle>
            <DialogDescription>
              <strong>{importRows.length}</strong> component row(s) detected. You can <strong>click any cell</strong> to correct values before importing.
            </DialogDescription>
          </DialogHeader>

          {/* Warning banner when there are empty required fields */}
          {importRows.some((r) => !r.part_number || !r.serial_number) && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Some rows have <strong>empty Part No. or Serial No.</strong> fields highlighted below. Please fill them before importing.</span>
            </div>
          )}

          <div className="overflow-x-auto max-h-[400px] border rounded-lg text-xs">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-8">#</th>
                  {["ATA", "Component", "Part No.", "Serial No.", "Description", "POS", "INST Date", "TSN", "CSN", "TSI", "CSI"].map((h) => (
                    <th key={h} className="px-2 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {importRows.map((r, i) => {
                  const missingPart = !r.part_number;
                  const missingSerial = !r.serial_number;
                  const emptyCellClass = "bg-amber-50 ring-1 ring-inset ring-amber-300";
                  return (
                    <tr key={i} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-2 py-1 text-center text-muted-foreground tabular-nums">{i + 1}</td>
                      {/* ATA */}
                      <td className="px-1 py-0.5">
                        <input
                          className="w-full bg-transparent border-0 outline-none px-1.5 py-1 rounded text-xs focus:bg-white focus:ring-1 focus:ring-[#556ee6]/40 transition-all"
                          value={r.ata ?? ""}
                          placeholder="—"
                          onChange={(e) => updateImportCell(i, "ata", e.target.value)}
                        />
                      </td>
                      {/* Component */}
                      <td className="px-1 py-0.5">
                        <input
                          className="w-full bg-transparent border-0 outline-none px-1.5 py-1 rounded text-xs focus:bg-white focus:ring-1 focus:ring-[#556ee6]/40 transition-all"
                          value={r.component_name ?? ""}
                          placeholder="—"
                          onChange={(e) => updateImportCell(i, "component_name", e.target.value)}
                        />
                      </td>
                      {/* Part No. */}
                      <td className={cn("px-1 py-0.5", missingPart && emptyCellClass)}>
                        <input
                          className="w-full bg-transparent border-0 outline-none px-1.5 py-1 rounded font-mono text-xs focus:bg-white focus:ring-1 focus:ring-[#556ee6]/40 transition-all"
                          value={r.part_number ?? ""}
                          placeholder="Required"
                          onChange={(e) => updateImportCell(i, "part_number", e.target.value)}
                        />
                      </td>
                      {/* Serial No. */}
                      <td className={cn("px-1 py-0.5", missingSerial && emptyCellClass)}>
                        <input
                          className="w-full bg-transparent border-0 outline-none px-1.5 py-1 rounded font-mono text-xs focus:bg-white focus:ring-1 focus:ring-[#556ee6]/40 transition-all"
                          value={r.serial_number ?? ""}
                          placeholder="Required"
                          onChange={(e) => updateImportCell(i, "serial_number", e.target.value)}
                        />
                      </td>
                      {/* Description */}
                      <td className={cn("px-1 py-0.5", !r.model && "bg-gray-50")}>
                        <input
                          className="w-full bg-transparent border-0 outline-none px-1.5 py-1 rounded text-xs focus:bg-white focus:ring-1 focus:ring-[#556ee6]/40 transition-all"
                          value={r.model ?? ""}
                          placeholder="—"
                          onChange={(e) => updateImportCell(i, "model", e.target.value)}
                        />
                      </td>
                      {/* POS */}
                      <td className={cn("px-1 py-0.5", !r.section && "bg-gray-50")}>
                        <input
                          className="w-full bg-transparent border-0 outline-none px-1.5 py-1 rounded text-xs focus:bg-white focus:ring-1 focus:ring-[#556ee6]/40 transition-all"
                          value={r.section ?? ""}
                          placeholder="—"
                          onChange={(e) => updateImportCell(i, "section", e.target.value)}
                        />
                      </td>
                      {/* INST Date */}
                      <td className={cn("px-1 py-0.5", !r.last_shop_visit_date && "bg-gray-50")}>
                        <input
                          type="date"
                          className="w-full bg-transparent border-0 outline-none px-1.5 py-1 rounded text-xs focus:bg-white focus:ring-1 focus:ring-[#556ee6]/40 transition-all"
                          value={r.last_shop_visit_date ?? ""}
                          onChange={(e) => updateImportCell(i, "last_shop_visit_date", e.target.value)}
                        />
                      </td>
                      {/* TSN */}
                      <td className="px-1 py-0.5">
                        <input
                          type="number"
                          className="w-16 bg-transparent border-0 outline-none px-1.5 py-1 rounded text-xs tabular-nums text-right focus:bg-white focus:ring-1 focus:ring-[#556ee6]/40 transition-all"
                          value={r.hours_since_new ?? 0}
                          min={0}
                          step="0.1"
                          onChange={(e) => updateImportCell(i, "hours_since_new", e.target.value)}
                        />
                      </td>
                      {/* CSN */}
                      <td className="px-1 py-0.5">
                        <input
                          type="number"
                          className="w-16 bg-transparent border-0 outline-none px-1.5 py-1 rounded text-xs tabular-nums text-right focus:bg-white focus:ring-1 focus:ring-[#556ee6]/40 transition-all"
                          value={r.cycles_since_new ?? 0}
                          min={0}
                          step="1"
                          onChange={(e) => updateImportCell(i, "cycles_since_new", e.target.value)}
                        />
                      </td>
                      {/* TSI */}
                      <td className="px-1 py-0.5">
                        <input
                          type="number"
                          className="w-16 bg-transparent border-0 outline-none px-1.5 py-1 rounded text-xs tabular-nums text-right focus:bg-white focus:ring-1 focus:ring-[#556ee6]/40 transition-all"
                          value={r.tsi ?? 0}
                          min={0}
                          step="0.1"
                          onChange={(e) => updateImportCell(i, "tsi", e.target.value)}
                        />
                      </td>
                      {/* CSI */}
                      <td className="px-1 py-0.5">
                        <input
                          type="number"
                          className="w-16 bg-transparent border-0 outline-none px-1.5 py-1 rounded text-xs tabular-nums text-right focus:bg-white focus:ring-1 focus:ring-[#556ee6]/40 transition-all"
                          value={r.csi ?? 0}
                          min={0}
                          step="1"
                          onChange={(e) => updateImportCell(i, "csi", e.target.value)}
                        />
                      </td>
                      {/* Remove row */}
                      <td className="px-1 py-0.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeImportRow(i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-600 p-0.5 rounded"
                          title="Remove row"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
              disabled={importing || importRows.length === 0}
              onClick={handleConfirmImport}
            >
              <CheckCircle className="h-4 w-4" />
              {importing ? "Importing..." : `Approve & Import ${importRows.length} rows`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OCCM History Dialog */}
      <Dialog open={!!historyTarget} onOpenChange={(o) => !o && setHistoryTarget(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600 text-lg font-semibold">
              <History className="h-5 w-5" /> OCCM Lifecycle History
            </DialogTitle>
            <DialogDescription>
              Track and log the installation, removal, overhaul, and shop history of the component.
            </DialogDescription>
          </DialogHeader>

          {historyTarget && (
            <div className="space-y-6">
              {/* Warning Alert if Part No or Serial No is missing */}
              {(!historyTarget.part_number || !historyTarget.serial_number) && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Missing Component Identifiers</span>
                    This component does not have a Part Number and/or Serial Number configured. Please edit the component first to add these identifiers before logging or viewing history.
                  </div>
                </div>
              )}

              {/* Component Info Card */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
                <div>
                  <p className="text-gray-400 font-medium uppercase tracking-wider mb-1">Component</p>
                  <p className="text-gray-900 font-semibold truncate" title={historyTarget.component_name ?? ""}>
                    {historyTarget.component_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium uppercase tracking-wider mb-1">Part Number</p>
                  <p className="text-gray-900 font-mono font-semibold">{historyTarget.part_number || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium uppercase tracking-wider mb-1">Serial Number</p>
                  <p className="text-gray-900 font-mono font-semibold">{historyTarget.serial_number || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium uppercase tracking-wider mb-1">Manufacturer</p>
                  <p className="text-gray-900 font-semibold">{historyTarget.manufacturer || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium uppercase tracking-wider mb-1">DOM</p>
                  <p className="text-gray-900 font-semibold">{fmtDate(historyTarget.manufacture_date as any) || "—"}</p>
                </div>
              </div>

              {/* Add Event Button and Form */}
              <div className="border rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-500" /> Lifecycle Events
                  </h3>
                  {historyTarget.part_number && historyTarget.serial_number && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => setShowAddForm(!showAddForm)}
                    >
                      {showAddForm ? (
                        <>
                          <X className="h-3.5 w-3.5" /> Close Form
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Log Event
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {showAddForm && historyTarget.part_number && historyTarget.serial_number && (
                  <form onSubmit={handleAddHistoryEvent} className="bg-gray-50/50 p-4 rounded-lg border border-dashed space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs font-normal">
                      <div className="space-y-1">
                        <label className="font-medium text-gray-600 block">Event Date <span className="text-red-500">*</span></label>
                        <Input
                          type="date"
                          required
                          className="h-8 text-xs bg-white"
                          value={newEvent.event_date}
                          onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-gray-600 block">Action Type <span className="text-red-500">*</span></label>
                        <select
                          required
                          className="w-full rounded-md border border-input bg-white px-3 py-1 text-xs shadow-sm h-8 focus:ring-1 focus:ring-ring outline-none"
                          value={newEvent.action_type}
                          onChange={(e) => setNewEvent({ ...newEvent, action_type: e.target.value })}
                        >
                          {["Installation", "Removal", "Shop Visit", "Overhaul", "Inspection", "Manufactured"].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-gray-600 block">AC Reg / Facility</label>
                        <Input
                          placeholder="e.g. LN-ABC / AeroShop"
                          className="h-8 text-xs bg-white"
                          value={newEvent.ac_reg_facility}
                          onChange={(e) => setNewEvent({ ...newEvent, ac_reg_facility: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-gray-600 block">Airframe Total Time</label>
                        <Input
                          placeholder="e.g. 1,200 FH / 450 FC"
                          className="h-8 text-xs bg-white"
                          value={newEvent.airframe_total_time}
                          onChange={(e) => setNewEvent({ ...newEvent, airframe_total_time: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-gray-600 block">Component TSN/CSN</label>
                        <Input
                          placeholder="e.g. 500 FH / 200 FC"
                          className="h-8 text-xs bg-white"
                          value={newEvent.component_tsn_csn}
                          onChange={(e) => setNewEvent({ ...newEvent, component_tsn_csn: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-gray-600 block">Component TSO/CSO</label>
                        <Input
                          placeholder="e.g. 100 FH / 40 FC"
                          className="h-8 text-xs bg-white"
                          value={newEvent.component_tso_cso}
                          onChange={(e) => setNewEvent({ ...newEvent, component_tso_cso: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="font-medium text-gray-600 block">Associated Doc Ref / Details</label>
                        <Input
                          placeholder="e.g. Form 1, Release Cert #12345"
                          className="h-8 text-xs bg-white"
                          value={newEvent.doc_ref_details}
                          onChange={(e) => setNewEvent({ ...newEvent, doc_ref_details: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                        disabled={addingEvent}
                      >
                        {addingEvent ? "Adding..." : "Log Event"}
                      </Button>
                    </div>
                  </form>
                )}

                {/* History Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="px-4 py-2.5">Event Date</th>
                        <th className="px-4 py-2.5">Action Type</th>
                        <th className="px-4 py-2.5">AC Reg / Facility</th>
                        <th className="px-4 py-2.5">Airframe Time</th>
                        <th className="px-4 py-2.5">TSN/CSN</th>
                        <th className="px-4 py-2.5">TSO/CSO</th>
                        <th className="px-4 py-2.5">Associated Document / Details</th>
                        <th className="px-4 py-2.5 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingHistory ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                            Loading history logs...
                          </td>
                        </tr>
                      ) : historyEvents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                            No lifecycle history logs recorded yet. Use the Log Event form above to create logs.
                          </td>
                        </tr>
                      ) : (
                        historyEvents.map((ev) => {
                          let badgeClass = "bg-gray-100 text-gray-700";
                          const act = ev.action_type.toLowerCase();
                          if (act === "manufactured") badgeClass = "bg-purple-50 text-purple-700 border border-purple-100";
                          else if (act === "installation") badgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                          else if (act === "removal") badgeClass = "bg-rose-50 text-rose-700 border border-rose-100";
                          else if (act === "shop visit" || act === "overhaul") badgeClass = "bg-amber-50 text-amber-700 border border-amber-100";
                          else if (act === "inspection") badgeClass = "bg-sky-50 text-sky-700 border border-sky-100";

                          return (
                            <tr key={ev.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 font-medium whitespace-nowrap">
                                {ev.event_date ? format(new Date(ev.event_date), "dd MMM yyyy") : "—"}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${badgeClass}`}>
                                  {ev.action_type}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-700">{ev.ac_reg_facility || "—"}</td>
                              <td className="px-4 py-3 font-mono text-gray-600">{ev.airframe_total_time || "—"}</td>
                              <td className="px-4 py-3 font-mono text-gray-600">{ev.component_tsn_csn || "—"}</td>
                              <td className="px-4 py-3 font-mono text-gray-600">{ev.component_tso_cso || "—"}</td>
                              <td className="px-4 py-3 text-gray-600 italic">{ev.doc_ref_details || "—"}</td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteHistoryEvent(ev.id)}
                                  className="text-rose-400 hover:text-rose-600 p-1 rounded transition-colors"
                                  title="Delete event log"
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
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setHistoryTarget(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default OccmPanel;
