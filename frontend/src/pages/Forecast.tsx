import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Pencil,
  ChevronDown,
  ChevronRight,
  Download,
  TrendingUp,
  Info,
  Check,
  X,
  Printer,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Aircraft {
  id: string;
  model: string;
  msn: string;
  registration_number: string;
  flight_hours: number;
  flight_cycles: number;
}

interface Service {
  id: string;
  aircraft_model: string;
  task_name: string;
  mpd_id: string | null;
  amm_id: string | null;
  task_card_ref: string | null;
  description: string | null;
  assigned_component_id: string | null;
  zones: string[] | null;
  estimated_price: number | null;
  interval_threshold: number | null;
  repeat_interval: number | null;
  interval_unit: string; // "Hours" | "Cycles"
}

interface ForecastRecord {
  id?: string;
  aircraft_id: string;
  service_id: string;
  interval_unit: string;
  last_date: string | null;
  last_hours: number | null;
  last_cycles: number | null;
  next_date: string | null;
  next_hours: number | null;
  next_cycles: number | null;
  remaining_hours: number | null;
  remaining_cycles: number | null;
  avg_hours: number | null;
  avg_cycles: number | null;
  status: string;
}

/** A merged row shown in the table */
interface ForecastRow {
  serviceId: string;
  serviceName: string;
  mpdId: string | null;
  ammId: string | null;
  taskCardRef: string | null;
  description: string | null;
  zones: string[];
  estimatedPrice: number | null;
  intervalThreshold: number | null;
  repeatInterval: number | null;
  intervalUnit: string;
  // calculated / from forecast record
  lastDate: Date | null;
  lastHours: number | null;
  lastCycles: number | null;
  nextDate: Date | null;
  nextHours: number | null;
  nextCycles: number | null;
  remainingHours: number | null;
  remainingCycles: number | null;
  hasForecast: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtDate = (d?: Date | string | null) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd MMM yyyy");
  } catch {
    return "—";
  }
};

const fmtFH = (h: number | null | undefined) => {
  if (h === null || h === undefined) return "—";
  const hrs = Math.floor(Math.abs(h));
  const min = Math.round((Math.abs(h) - hrs) * 60);
  const sign = h < 0 ? "-" : "";
  return `${sign}${hrs}:${String(min).padStart(2, "0")} FH`;
};

const fmtFC = (c: number | null | undefined) => {
  if (c === null || c === undefined) return "—";
  return `${Math.round(c)} FC`;
};

const remainingBadgeClass = (val: number | null) => {
  if (val === null) return "bg-gray-100 text-gray-400";
  if (val <= 0) return "bg-red-100 text-red-600 font-semibold";
  if (val <= 50) return "bg-amber-100 text-amber-700 font-semibold";
  return "bg-emerald-100 text-emerald-700";
};


function buildRows(
  aircraft: Aircraft,
  services: Service[],
  forecasts: ForecastRecord[],
  avgHours: number,
  avgCycles: number
): ForecastRow[] {
  return services
    .filter((s) => s.aircraft_model === aircraft.model)
    .map((service) => {
      const fc = forecasts.find((f) => f.service_id === service.id) ?? null;
      const unit = fc?.interval_unit ?? service.interval_unit ?? "Hours";
      const repeat = service.repeat_interval ?? 0;

      let lastDate: Date | null = fc?.last_date ? new Date(fc.last_date) : null;
      let nextDate: Date | null = null;
      let nextHours: number | null = null;
      let nextCycles: number | null = null;
      let remainingHours: number | null = null;
      let remainingCycles: number | null = null;

      if (fc) {
        if (unit === "Hours") {
          nextHours = (fc.last_hours ?? 0) + repeat;
          remainingHours = nextHours - aircraft.flight_hours;
          const numDays = remainingHours > 0 ? Math.floor(remainingHours / avgHours) : 0;
          nextDate = addDays(new Date(), numDays);
        } else {
          nextCycles = (fc.last_cycles ?? 0) + repeat;
          remainingCycles = nextCycles - aircraft.flight_cycles;
          const numDays = remainingCycles > 0 ? Math.floor(remainingCycles / avgCycles) : 0;
          nextDate = addDays(new Date(), numDays);
        }
      }

      return {
        serviceId: service.id,
        serviceName: service.task_name,
        mpdId: service.mpd_id,
        ammId: service.amm_id,
        taskCardRef: service.task_card_ref,
        description: service.description,
        zones: service.zones ?? [],
        estimatedPrice: service.estimated_price,
        intervalThreshold: service.interval_threshold,
        repeatInterval: service.repeat_interval,
        intervalUnit: unit,
        lastDate,
        lastHours: fc?.last_hours ?? null,
        lastCycles: fc?.last_cycles ?? null,
        nextDate,
        nextHours,
        nextCycles,
        remainingHours,
        remainingCycles,
        hasForecast: !!fc,
      };
    });
}


function InlineEdit({
  value,
  onSave,
  label,
}: {
  value: number;
  onSave: (v: number) => void;
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n) && n > 0) {
      onSave(n);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(String(value));
    setEditing(false);
  };

  if (editing)
    return (
      <div className="flex items-center gap-1">
        <Input
          autoFocus
          className="h-7 w-20 text-xs px-2"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
        />
        <button
          onClick={commit}
          className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={cancel}
          className="flex h-6 w-6 items-center justify-center rounded bg-red-100 text-red-500 hover:bg-red-200"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );

  return (
    <button
      className="text-sm font-semibold text-[#556ee6] hover:underline underline-offset-2"
      title={`Click to edit ${label}`}
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
    >
      {value}
    </button>
  );
}



const StatPill = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col gap-0.5 min-w-[80px]">
    <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">{label}</span>
    <span className="text-sm font-semibold text-white leading-none">{value ?? "—"}</span>
  </div>
);



function exportCSV(rows: ForecastRow[], aircraft: Aircraft) {
  const headers = [
    "MPD ID",
    "AMM ID",
    "Task Card Ref",
    "Task Name",
    "Interval Unit",
    "Interval Threshold",
    "Repeat Interval",
    "Last Carried Date",
    "Last Carried Hours",
    "Last Carried Cycles",
    "Next Due Date",
    "Next Due Hours",
    "Next Due Cycles",
    "Remaining Hours",
    "Remaining Cycles",
    "Est. Price",
    "Zones",
  ];

  const csvRows = rows.map((r) =>
    [
      r.mpdId ?? "",
      r.ammId ?? "",
      r.taskCardRef ?? "",
      r.serviceName,
      r.intervalUnit,
      r.intervalThreshold ?? "",
      r.repeatInterval ?? "",
      r.lastDate ? format(r.lastDate, "dd/MM/yyyy") : "",
      r.lastHours ?? "",
      r.lastCycles ?? "",
      r.nextDate ? format(r.nextDate, "dd/MM/yyyy") : "",
      r.nextHours ?? "",
      r.nextCycles ?? "",
      r.remainingHours !== null ? r.remainingHours.toFixed(2) : "",
      r.remainingCycles !== null ? r.remainingCycles.toFixed(0) : "",
      r.estimatedPrice ?? "",
      (r.zones ?? []).join("; "),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );

  const content = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Forecast_${aircraft.registration_number}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}


const PER_PAGE = 10;

const Forecast = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [rows, setRows] = useState<ForecastRow[]>([]);
  const [loadingAc, setLoadingAc] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);

  // avg per-day rates (globally applied to all tasks)
  const [avgHours, setAvgHours] = useState(10);
  const [avgCycles, setAvgCycles] = useState(2);

  // table controls
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // row selection for Print Task Card
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());

  // "Last Carried Out" edit modal
  const [editTarget, setEditTarget] = useState<ForecastRow | null>(null);
  const [editForm, setEditForm] = useState<{
    last_date: string;
    last_hours: string;
    last_cycles: string;
    interval_unit: string;
  }>({ last_date: "", last_hours: "", last_cycles: "", interval_unit: "Hours" });
  const [saving, setSaving] = useState(false);


  const loadAll = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingRows(true);
      const [ac, allServices, allForecasts] = await Promise.all([
        api.aircrafts.get(id),
        api.services.list(),
        api.forecast.getForAircraft(id),
      ]);
      setAircraft(ac);

      // pick global avg from last forecast that has one
      const withAvg = (allForecasts as ForecastRecord[]).filter((f) => f.avg_hours);
      const resolvedAvgH = withAvg.length > 0 ? (withAvg[withAvg.length - 1].avg_hours ?? 10) : 10;
      const resolvedAvgC = withAvg.length > 0 ? (withAvg[withAvg.length - 1].avg_cycles ?? 2) : 2;
      setAvgHours(resolvedAvgH);
      setAvgCycles(resolvedAvgC);

      setRows(buildRows(ac, allServices, allForecasts, resolvedAvgH, resolvedAvgC));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load forecast data.");
    } finally {
      setLoadingAc(false);
      setLoadingRows(false);
    }
  }, [id]); // eslint-disable-line

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Recompute rows in-place when avg values change (no network call until user commits)
  const recomputeRows = (newAvgH: number, newAvgC: number, currentRows: ForecastRow[]) => {
    if (!aircraft) return;
    return currentRows.map((r) => {
      if (!r.hasForecast) return r;
      const repeat = r.repeatInterval ?? 0;
      let nextDate: Date | null = null;
      let remainingHours = r.remainingHours;
      let remainingCycles = r.remainingCycles;

      if (r.intervalUnit === "Hours") {
        remainingHours = (r.lastHours ?? 0) + repeat - aircraft.flight_hours;
        const numDays = remainingHours > 0 ? Math.floor(remainingHours / newAvgH) : 0;
        nextDate = addDays(new Date(), numDays);
      } else {
        remainingCycles = (r.lastCycles ?? 0) + repeat - aircraft.flight_cycles;
        const numDays = remainingCycles > 0 ? Math.floor(remainingCycles / newAvgC) : 0;
        nextDate = addDays(new Date(), numDays);
      }

      return { ...r, nextDate, remainingHours, remainingCycles };
    });
  };


  const handleAvgHoursChange = async (value: number) => {
    setAvgHours(value);
    const updated = recomputeRows(value, avgCycles, rows) ?? rows;
    setRows(updated);

    if (!id) return;
    try {
      const updates = updated
        .filter((r) => r.hasForecast && r.intervalUnit === "Hours" && r.nextDate)
        .map((r) => ({
          service_id: r.serviceId,
          next_date: r.nextDate!.toISOString(),
        }));
      await api.forecast.updateAvg(id, { avg_hours: value, updates });
      toast.success("Avg FH updated and next due dates recalculated.");
    } catch {
      toast.error("Failed to save avg FH.");
    }
  };

  const handleAvgCyclesChange = async (value: number) => {
    setAvgCycles(value);
    const updated = recomputeRows(avgHours, value, rows) ?? rows;
    setRows(updated);

    if (!id) return;
    try {
      const updates = updated
        .filter((r) => r.hasForecast && r.intervalUnit === "Cycles" && r.nextDate)
        .map((r) => ({
          service_id: r.serviceId,
          next_date: r.nextDate!.toISOString(),
        }));
      await api.forecast.updateAvg(id, { avg_cycles: value, updates });
      toast.success("Avg FC updated and next due dates recalculated.");
    } catch {
      toast.error("Failed to save avg FC.");
    }
  };


  const openEdit = (row: ForecastRow) => {
    setEditTarget(row);
    setEditForm({
      last_date: row.lastDate ? format(row.lastDate, "yyyy-MM-dd") : "",
      last_hours: row.lastHours !== null ? String(row.lastHours) : "",
      last_cycles: row.lastCycles !== null ? String(row.lastCycles) : "",
      interval_unit: row.intervalUnit,
    });
  };


  const handleSave = async () => {
    if (!editTarget || !aircraft || !id) return;
    setSaving(true);
    try {
      const lastHours = editForm.last_hours ? parseFloat(editForm.last_hours) : null;
      const lastCycles = editForm.last_cycles ? parseFloat(editForm.last_cycles) : null;
      const unit = editForm.interval_unit;
      const repeat = editTarget.repeatInterval ?? 0;

      let nextHours: number | null = null;
      let nextCycles: number | null = null;
      let remainingHours: number | null = null;
      let remainingCycles: number | null = null;
      let nextDate: Date;

      if (unit === "Hours") {
        //  next_due_hours = last_hours + repeat_interval
        nextHours = (lastHours ?? 0) + repeat;
        //  remaining_hours = next_due_hours - current_aircraft_fh
        remainingHours = nextHours - aircraft.flight_hours;
        //  days_to_due = remaining_hours / avg_daily_fh
        const numDays = remainingHours > 0 ? Math.floor(remainingHours / avgHours) : 0;
        nextDate = addDays(new Date(), numDays);
      } else {
        //  next_due_cycles = last_cycles + repeat_interval
        nextCycles = (lastCycles ?? 0) + repeat;
        //  remaining_cycles = next_due_cycles - current_aircraft_fc
        remainingCycles = nextCycles - aircraft.flight_cycles;
        //  days_to_due = remaining_cycles / avg_daily_fc
        const numDays = remainingCycles > 0 ? Math.floor(remainingCycles / avgCycles) : 0;
        nextDate = addDays(new Date(), numDays);
      }

      const payload = {
        aircraft_id: id,
        service_id: editTarget.serviceId,
        interval_unit: unit,
        last_date: editForm.last_date ? new Date(editForm.last_date).toISOString() : null,
        last_hours: lastHours,
        last_cycles: lastCycles,
        next_date: nextDate.toISOString(),
        next_hours: nextHours,
        next_cycles: nextCycles,
        remaining_hours: remainingHours,
        remaining_cycles: remainingCycles,
        avg_hours: avgHours,
        avg_cycles: avgCycles,
        status: "active",
      };

      await api.forecast.save(payload);
      toast.success("Forecast saved successfully.");
      setEditTarget(null);
      await loadAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save forecast.");
    } finally {
      setSaving(false);
    }
  };

  // ── Derived table data ─────────────────────────────────────────────────────

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.serviceName.toLowerCase().includes(q) ||
      (r.mpdId ?? "").toLowerCase().includes(q) ||
      (r.ammId ?? "").toLowerCase().includes(q) ||
      (r.taskCardRef ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const loading = loadingAc || loadingRows;

  // ── Selection helpers ───────────────────────────────────────────────────────

  const toggleSelect = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const allOnPageSelected =
    paginated.length > 0 &&
    paginated.filter((r) => r.hasForecast).every((r) => selectedServiceIds.has(r.serviceId));

  const toggleSelectAll = () => {
    const selectableIds = paginated.filter((r) => r.hasForecast).map((r) => r.serviceId);
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Only rows that have forecast data can be printed
  const printableSelected = [...selectedServiceIds].filter((sid) =>
    rows.find((r) => r.serviceId === sid && r.hasForecast)
  );
  const printEnabled = printableSelected.length > 0;


  return (
    <div className="space-y-6 pb-12">

      {/* ───── Aircraft header bar ───── */}
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
                Forecast Panel — Predictive Maintenance Planning
              </p>
              <h1 className="text-lg font-bold text-white leading-none">
                {loadingAc ? "Loading..." : (aircraft?.model ?? "Aircraft")}
              </h1>
            </div>
          </div>
          {!loadingAc && aircraft && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <StatPill label="Registration" value={aircraft.registration_number} />
              <div className="hidden sm:block w-px h-7 bg-white/20" />
              <StatPill label="Total FH" value={`${aircraft.flight_hours.toLocaleString()} hrs`} />
              <div className="hidden sm:block w-px h-7 bg-white/20" />
              <StatPill label="Total FC" value={aircraft.flight_cycles.toLocaleString()} />
              <div className="hidden sm:block w-px h-7 bg-white/20" />
              <StatPill label="MSN" value={aircraft.msn} />
            </div>
          )}
        </div>
      </div>

      {/* ───── Aircraft info & avg rate card ───── */}
      {!loadingAc && aircraft && (
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="px-5 py-3 border-b flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#556ee6]" />
            <span className="text-sm font-semibold text-gray-700">Aircraft Summary &amp; Planning Rates</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-0 divide-x divide-gray-100">
            {/* Aircraft Model */}
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">Aircraft Model</p>
              <p className="text-sm font-semibold text-gray-800">{aircraft.model}</p>
            </div>
            {/* MSN */}
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">MSN</p>
              <p className="text-sm font-semibold text-gray-800">{aircraft.msn}</p>
            </div>
            {/* Total FH */}
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">Total FH</p>
              <p className="text-sm font-semibold text-gray-800">{aircraft.flight_hours.toLocaleString()} hrs</p>
            </div>
            {/* Total FC */}
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">Total FC</p>
              <p className="text-sm font-semibold text-gray-800">{aircraft.flight_cycles.toLocaleString()}</p>
            </div>
            {/* Avg FH — editable */}
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
                Avg FH / day
              </p>
              <InlineEdit value={avgHours} label="Avg FH/day" onSave={handleAvgHoursChange} />
            </div>
            {/* Avg FC — editable */}
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
                Avg FC / day
              </p>
              <InlineEdit value={avgCycles} label="Avg FC/day" onSave={handleAvgCyclesChange} />
            </div>
          </div>
        </div>
      )}

      {/* ───── Forecast table ───── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search task, MPD ID..."
                className="pl-8 h-8 text-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Print Task Card */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs whitespace-nowrap"
              disabled={!printEnabled}
              title={printEnabled ? `Print task card for ${printableSelected.length} selected row(s)` : "Select rows with forecast data to print"}
              onClick={() =>
                navigate(`/aircraft/${id}/forecast/print/${printableSelected.join(",")}`)
              }
            >
              <Printer className="h-3.5 w-3.5" />
              Print Task Card
              {printableSelected.length > 0 && (
                <span className="ml-0.5 rounded-full bg-[#556ee6] text-white text-[9px] px-1.5 py-px font-bold">
                  {printableSelected.length}
                </span>
              )}
            </Button>

            {/* Upload Scheduler */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs whitespace-nowrap"
              onClick={() => navigate(`/aircraft/${id}/scheduler`)}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Scheduler
            </Button>

            {/* PowerBI (placeholder — not yet built) */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs whitespace-nowrap text-gray-400"
              title="PowerBI dashboard – coming soon"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Dashboard
            </Button>

            {/* Export CSV */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs whitespace-nowrap"
              disabled={!aircraft || rows.length === 0}
              onClick={() => aircraft && exportCSV(rows, aircraft)}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                {/* Select-all checkbox */}
                <th className="w-8 px-3 py-3">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#556ee6] focus:ring-[#556ee6] h-3.5 w-3.5"
                    checked={allOnPageSelected && !loading}
                    onChange={toggleSelectAll}
                    title="Select all on this page"
                  />
                </th>
                <th className="w-8 px-3 py-3" />
                {["#", "MPD ID", "AMM ID", "Task Card Ref", "Task Name", "Unit", "Next Due", "Rem. Hours", "Rem. Cycles", "Update"].map((h) => (
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
                  <td colSpan={12} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Info className="h-8 w-8 opacity-30" />
                      <p className="text-sm font-medium">
                        {rows.length === 0
                          ? "No service tasks configured for this aircraft model."
                          : "No tasks match your search."}
                      </p>
                      {rows.length === 0 && (
                        <p className="text-xs">
                          Go to <strong>Config → Service List</strong> and add tasks for model{" "}
                          <strong>{aircraft?.model}</strong>.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((row, idx) => {
                  const rowNum = (page - 1) * PER_PAGE + idx + 1;
                  const isExpanded = expandedId === row.serviceId;

                  return (
                    <React.Fragment key={row.serviceId}>
                      {/* ── Main row ── */}
                      <tr
                        className={cn(
                          "hover:bg-gray-50/60 transition-colors",
                          isExpanded && "bg-blue-50/40",
                          selectedServiceIds.has(row.serviceId) && "bg-blue-50"
                        )}
                      >
                        {/* Row select checkbox */}
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-[#556ee6] focus:ring-[#556ee6] h-3.5 w-3.5"
                            checked={selectedServiceIds.has(row.serviceId)}
                            disabled={!row.hasForecast}
                            onChange={() => toggleSelect(row.serviceId)}
                            title={row.hasForecast ? "Select for printing" : "Enter 'Last Carried Out' data first"}
                          />
                        </td>
                        {/* Expand toggle */}
                        <td className="px-3 py-3">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : row.serviceId)}
                            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-gray-200 transition-colors"
                          >
                            {isExpanded
                              ? <ChevronDown className="h-3.5 w-3.5" />
                              : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                        {/* # */}
                        <td className="px-4 py-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#556ee6]/10 text-[#556ee6] text-[11px] font-bold">
                            {rowNum}
                          </div>
                        </td>
                        {/* MPD ID */}
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">
                          {row.mpdId || "—"}
                        </td>
                        {/* AMM ID */}
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">
                          {row.ammId || "—"}
                        </td>
                        {/* Task Card Ref */}
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                          {row.taskCardRef || "—"}
                        </td>
                        {/* Task Name */}
                        <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate whitespace-nowrap" title={row.serviceName}>
                          {row.serviceName}
                        </td>
                        {/* Unit */}
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            row.intervalUnit === "Hours"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-cyan-100 text-cyan-700"
                          )}>
                            {row.intervalUnit === "Hours" ? "FH" : "FC"}
                          </span>
                        </td>
                        {/* Next Due */}
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs">
                          {row.hasForecast ? fmtDate(row.nextDate) : (
                            <span className="text-muted-foreground text-[11px] italic">No data</span>
                          )}
                        </td>
                        {/* Rem. Hours */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.intervalUnit === "Hours" && row.remainingHours !== null ? (
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs",
                              remainingBadgeClass(row.remainingHours)
                            )}>
                              {fmtFH(row.remainingHours)}
                            </span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        {/* Rem. Cycles */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.intervalUnit === "Cycles" && row.remainingCycles !== null ? (
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs",
                              remainingBadgeClass(row.remainingCycles)
                            )}>
                              {fmtFC(row.remainingCycles)}
                            </span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        {/* Update */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openEdit(row)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[#556ee6] hover:bg-[#556ee6]/10 transition-colors"
                            title="Edit last carried out"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* ── Expanded detail row ── */}
                      {isExpanded && (
                        <tr key={`${row.serviceId}-exp`} className="bg-blue-50/30">
                          <td colSpan={12} className="px-6 py-4">
                            <div className="space-y-4">

                              {/* Last Carried / Next Due / Remaining */}
                              <div className="overflow-x-auto rounded-lg border border-blue-100">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-[#556ee6]/8 border-b border-blue-100">
                                      <th colSpan={3} className="px-4 py-2 text-center text-[11px] font-semibold text-[#556ee6] uppercase tracking-wider">
                                        Last Carried Out
                                      </th>
                                      <th colSpan={3} className="px-4 py-2 text-center text-[11px] font-semibold text-[#556ee6] uppercase tracking-wider border-l border-blue-100">
                                        Next Due
                                      </th>
                                      <th colSpan={2} className="px-4 py-2 text-center text-[11px] font-semibold text-[#556ee6] uppercase tracking-wider border-l border-blue-100">
                                        Remaining
                                      </th>
                                      <th colSpan={2} className="px-4 py-2 text-center text-[11px] font-semibold text-[#556ee6] uppercase tracking-wider border-l border-blue-100">
                                        Intervals
                                      </th>
                                    </tr>
                                    <tr className="bg-white border-b border-blue-100 text-muted-foreground">
                                      <th className="px-4 py-2 text-left font-medium">Date</th>
                                      <th className="px-4 py-2 text-left font-medium">Hours</th>
                                      <th className="px-4 py-2 text-left font-medium">Cycles</th>
                                      <th className="px-4 py-2 text-left font-medium border-l border-blue-100">Date</th>
                                      <th className="px-4 py-2 text-left font-medium">Hours</th>
                                      <th className="px-4 py-2 text-left font-medium">Cycles</th>
                                      <th className="px-4 py-2 text-left font-medium border-l border-blue-100">Rem. Hours</th>
                                      <th className="px-4 py-2 text-left font-medium">Rem. Cycles</th>
                                      <th className="px-4 py-2 text-left font-medium border-l border-blue-100">Threshold</th>
                                      <th className="px-4 py-2 text-left font-medium">Repeat</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="bg-white">
                                      <td className="px-4 py-2.5 text-gray-700">{fmtDate(row.lastDate)}</td>
                                      <td className="px-4 py-2.5 tabular-nums text-gray-700">
                                        {row.lastHours !== null ? `${row.lastHours} FH` : "—"}
                                      </td>
                                      <td className="px-4 py-2.5 tabular-nums text-gray-700">
                                        {row.lastCycles !== null ? `${row.lastCycles} FC` : "—"}
                                      </td>
                                      <td className="px-4 py-2.5 text-gray-700 border-l border-blue-100">{fmtDate(row.nextDate)}</td>
                                      <td className="px-4 py-2.5 tabular-nums text-gray-700">
                                        {row.nextHours !== null ? `${row.nextHours} FH` : "—"}
                                      </td>
                                      <td className="px-4 py-2.5 tabular-nums text-gray-700">
                                        {row.nextCycles !== null ? `${row.nextCycles} FC` : "—"}
                                      </td>
                                      <td className="px-4 py-2.5 border-l border-blue-100">
                                        {row.intervalUnit === "Hours" && row.remainingHours !== null ? (
                                          <span className={cn(
                                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                            remainingBadgeClass(row.remainingHours)
                                          )}>
                                            {fmtFH(row.remainingHours)}
                                          </span>
                                        ) : "—"}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        {row.intervalUnit === "Cycles" && row.remainingCycles !== null ? (
                                          <span className={cn(
                                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                            remainingBadgeClass(row.remainingCycles)
                                          )}>
                                            {fmtFC(row.remainingCycles)}
                                          </span>
                                        ) : "—"}
                                      </td>
                                      <td className="px-4 py-2.5 border-l border-blue-100 tabular-nums text-gray-700">
                                        {row.intervalThreshold !== null
                                          ? `${row.intervalThreshold} ${row.intervalUnit === "Hours" ? "FH" : "FC"}`
                                          : "—"}
                                      </td>
                                      <td className="px-4 py-2.5 tabular-nums text-gray-700">
                                        {row.repeatInterval !== null
                                          ? `${row.repeatInterval} ${row.intervalUnit === "Hours" ? "FH" : "FC"}`
                                          : "—"}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Description + Zones */}
                              {(row.description || row.zones.length > 0) && (
                                <div className="overflow-x-auto rounded-lg border border-blue-100">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="bg-white border-b border-blue-100 text-muted-foreground">
                                        <th className="px-4 py-2 text-left font-semibold">Description</th>
                                        <th className="px-4 py-2 text-left font-semibold w-48">Zones</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td className="px-4 py-3 text-gray-700 whitespace-pre-wrap">
                                          {row.description || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                          {row.zones.length > 0 ? row.zones.join(", ") : "—"}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ───── Edit "Last Carried Out" modal ───── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#556ee6]">
              <Pencil className="h-4 w-4" />
              Last Carried Out
            </DialogTitle>
            {editTarget && (
              <p className="text-xs text-muted-foreground mt-1">
                Task: <strong>{editTarget.serviceName}</strong>
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Interval Unit */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Interval Type
              </label>
              <div className="flex gap-2">
                {(["Hours", "Cycles"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setEditForm((f) => ({ ...f, interval_unit: u }))}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors",
                      editForm.interval_unit === u
                        ? "bg-[#556ee6] text-white border-[#556ee6]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#556ee6]/50"
                    )}
                  >
                    {u === "Hours" ? "Flight Hours (FH)" : "Flight Cycles (FC)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Date of Last Maintenance
              </label>
              <Input
                type="date"
                className="h-9 text-sm"
                value={editForm.last_date}
                onChange={(e) => setEditForm((f) => ({ ...f, last_date: e.target.value }))}
              />
            </div>

            {/* Hours */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Aircraft FH at Last Maintenance
                <span className="ml-1 text-muted-foreground font-normal">(decimal hours)</span>
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                className="h-9 text-sm"
                placeholder="e.g. 12500.5"
                value={editForm.last_hours}
                onChange={(e) => setEditForm((f) => ({ ...f, last_hours: e.target.value }))}
              />
            </div>

            {/* Cycles */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Aircraft FC at Last Maintenance
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                className="h-9 text-sm"
                placeholder="e.g. 8200"
                value={editForm.last_cycles}
                onChange={(e) => setEditForm((f) => ({ ...f, last_cycles: e.target.value }))}
              />
            </div>

            {/* Calculation preview */}
            {editTarget && (editForm.last_hours || editForm.last_cycles) && aircraft && (
              <div className="rounded-lg bg-[#556ee6]/5 border border-[#556ee6]/20 p-3 space-y-1.5">
                <p className="text-[11px] font-semibold text-[#556ee6] uppercase tracking-wider mb-2">
                  Calculation Preview
                </p>
                {editForm.interval_unit === "Hours" && editForm.last_hours && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Next Due (FH)</span>
                      <span className="font-medium tabular-nums">
                        {(parseFloat(editForm.last_hours) + (editTarget.repeatInterval ?? 0)).toFixed(1)} FH
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Remaining (FH)</span>
                      <span className={cn(
                        "font-semibold tabular-nums",
                        (parseFloat(editForm.last_hours) + (editTarget.repeatInterval ?? 0) - aircraft.flight_hours) <= 0
                          ? "text-red-600" : "text-emerald-600"
                      )}>
                        {(parseFloat(editForm.last_hours) + (editTarget.repeatInterval ?? 0) - aircraft.flight_hours).toFixed(1)} FH
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Est. Days to Due</span>
                      <span className="font-medium tabular-nums">
                        {Math.max(0, Math.floor(
                          (parseFloat(editForm.last_hours) + (editTarget.repeatInterval ?? 0) - aircraft.flight_hours) / avgHours
                        ))} days
                      </span>
                    </div>
                  </>
                )}
                {editForm.interval_unit === "Cycles" && editForm.last_cycles && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Next Due (FC)</span>
                      <span className="font-medium tabular-nums">
                        {parseFloat(editForm.last_cycles) + (editTarget.repeatInterval ?? 0)} FC
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Remaining (FC)</span>
                      <span className={cn(
                        "font-semibold tabular-nums",
                        (parseFloat(editForm.last_cycles) + (editTarget.repeatInterval ?? 0) - aircraft.flight_cycles) <= 0
                          ? "text-red-600" : "text-emerald-600"
                      )}>
                        {(parseFloat(editForm.last_cycles) + (editTarget.repeatInterval ?? 0) - aircraft.flight_cycles).toFixed(0)} FC
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Est. Days to Due</span>
                      <span className="font-medium tabular-nums">
                        {Math.max(0, Math.floor(
                          (parseFloat(editForm.last_cycles) + (editTarget.repeatInterval ?? 0) - aircraft.flight_cycles) / avgCycles
                        ))} days
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#556ee6] hover:bg-[#4560d5] gap-1.5"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Forecast;
