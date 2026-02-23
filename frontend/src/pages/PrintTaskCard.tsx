/**
 * PrintTaskCard
 * Route: /aircraft/:id/forecast/print/:selectedIds
 *
 * Print-ready Task Card for selected forecast service items.
 * selectedIds – comma-separated service UUIDs passed in the route.
 */
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Aircraft {
  id: string;
  model: string;
  msn: string;
  registration_number: string;
  flight_hours: number;
  flight_cycles: number;
}

interface ServiceRow {
  id: string;
  task_name: string;
  mpd_amm_task_ids: string | null;
  task_card_ref: string | null;
  description: string | null;
  zones: string[];
  assigned_component_id: string | null;
  interval_threshold: number | null;
  repeat_interval: number | null;
  interval_unit: string;
  estimated_manhours: number | null;
}

interface ForecastRecord {
  service_id: string;
  interval_unit: string;
  last_date: string | null;
  last_hours: number | null;
  last_cycles: number | null;
  next_date: string | null;
  next_hours: number | null;
  remaining_hours: number | null;
  remaining_cycles: number | null;
}

interface SchedulerEntry {
  id: string;
  aircraft_id: string;
  flight_date: string;
  flight_hours: number;
  flight_cycles: number;
}

interface ComponentItem {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | Date | null) => {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy"); } catch { return "—"; }
};

/** Generate work-order number: YYYYMMDDHHmmss */
const workOrderNo = () => {
  const t = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}${pad(t.getMonth()+1)}${pad(t.getDate())}${pad(t.getHours())}${pad(t.getMinutes())}${pad(t.getSeconds())}`;
};

/**
 * Compute schedule date from scheduler entries.
 * When cumulative hours/cycles from entries after last_date
 * first exceeds the remaining threshold, the *previous* entry's
 * date is the scheduled maintenance date.
 */
function computeScheduleDate(
  schedulerEntries: SchedulerEntry[],
  lastDate: string | null,
  remainingHours: number | null,
  remainingCycles: number | null,
  intervalUnit: string
): Date | null {
  if (!lastDate) return null;
  const cutoff = new Date(lastDate).setHours(0, 0, 0, 0);
  const future = schedulerEntries
    .filter((e) => new Date(e.flight_date).setHours(0, 0, 0, 0) > cutoff)
    .sort((a, b) => new Date(a.flight_date).valueOf() - new Date(b.flight_date).valueOf());

  if (future.length === 0) return null;

  let cumulative = 0;
  let lastFalseDate: Date | null = null;

  for (const entry of future) {
    const value = intervalUnit === "Hours" ? entry.flight_hours : entry.flight_cycles;
    cumulative += value;
    const threshold = intervalUnit === "Hours" ? (remainingHours ?? 0) : (remainingCycles ?? 0);
    if (cumulative < threshold) {
      lastFalseDate = new Date(entry.flight_date);
    } else {
      // Cumulative just exceeded threshold; schedule_date = last entry before this
      return lastFalseDate;
    }
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

const WO = workOrderNo(); // stable for the lifetime of the page visit

const PrintTaskCard = () => {
  const { id, selectedIds } = useParams<{ id: string; selectedIds: string }>();
  const navigate = useNavigate();

  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [componentMap, setComponentMap] = useState<Record<string, string>>({});
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const printRef = useRef<HTMLDivElement>(null);

  const ids = (selectedIds ?? "").split(",").filter(Boolean);

  useEffect(() => {
    if (!id || ids.length === 0) return;

    const load = async () => {
      try {
        const [ac, allServices, allForecasts, schedulerEntries, allComponents] = await Promise.all([
          api.aircrafts.get(id),
          api.services.list(),
          api.forecast.getForAircraft(id),
          (api as any).scheduler.getForAircraft(id),
          api.components.list(),
        ]);

        setAircraft(ac);

        // Filter to selected service IDs
        const filteredServices: ServiceRow[] = (allServices as ServiceRow[]).filter((s) =>
          ids.includes(s.id)
        );
        setServices(filteredServices);

        // Build component name lookup
        const cMap: Record<string, string> = {};
        (allComponents as ComponentItem[]).forEach((c) => {
          cMap[c.id] = c.name;
        });
        setComponentMap(cMap);

        // Compute schedule date
        // Use the first forecast record for selected services
        const firstFc = (allForecasts as ForecastRecord[]).find((f) =>
          ids.includes(f.service_id)
        );

        if (firstFc) {
          const computed = computeScheduleDate(
            schedulerEntries as SchedulerEntry[],
            firstFc.last_date,
            firstFc.remaining_hours,
            firstFc.remaining_cycles,
            firstFc.interval_unit
          );
          // If scheduler data computed a date, use it; otherwise fall back to next_date
          setScheduleDate(
            computed ?? (firstFc.next_date ? new Date(firstFc.next_date) : null)
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load task card data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, selectedIds]); // eslint-disable-line

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading task card…
      </div>
    );
  }

  if (!aircraft || services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground text-sm">No task card data found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* ── Screen-only toolbar (hidden on print) ── */}
      <div className="print:hidden flex items-center justify-between px-6 py-3 border-b bg-white sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Forecast
        </button>
        <Button
          size="sm"
          className="bg-[#556ee6] hover:bg-[#4560d5] gap-1.5"
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      {/* ── Printable area ── */}
      <div
        id="printable-area"
        ref={printRef}
        className="max-w-[1100px] mx-auto p-6 bg-white print:p-4"
      >
        {/* Title */}
        <h2 className="text-center text-xl font-bold uppercase tracking-widest mb-3">
          Task Card
        </h2>
        <hr className="mb-4 border-gray-400" />

        {/* Header info */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          {/* Left */}
          <div className="space-y-1">
            <div>
              <strong>A/C TYPE: </strong>
              <span>{aircraft.model}</span>
            </div>
            <div>
              <strong>A/C REGN: </strong>
              <span>{aircraft.registration_number}</span>
            </div>
            <div>
              <strong>A/C MSN: </strong>
              <span>{aircraft.msn}</span>
            </div>
          </div>

          {/* Middle */}
          <div className="space-y-1">
            <div>
              <strong>A/C FH: </strong>
              <span>{aircraft.flight_hours.toLocaleString()} hrs</span>
            </div>
            <div>
              <strong>A/C FC: </strong>
              <span>{aircraft.flight_cycles.toLocaleString()}</span>
            </div>
            <div>
              <strong>DATE: </strong>
              <span>{fmtDate(new Date())}</span>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-1 text-right">
            <div>
              <strong>WORK ORDER NO: </strong>
              <span>{WO}</span>
            </div>
            <div>
              <strong>CHECK TYPE: </strong>
              <span>Scheduled Maintenance</span>
            </div>
            <div>
              <strong>SCHEDULE DATE: </strong>
              <span>{fmtDate(scheduleDate)}</span>
            </div>
          </div>
        </div>

        {/* Task Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-400 text-[11px] print:text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-2 py-1.5 text-left w-10">NO.</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left">TASKCARD REF</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left">MPD TASK</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left w-52">DESCRIPTION</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left w-16">ZONE</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left w-24">COMP REQ</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left w-20">INTERVAL</th>
                <th colSpan={2} className="border border-gray-400 px-2 py-1.5 text-center w-28">MANHOURS</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center w-24">COMPLETED DATE</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center w-14">SIGN</th>
              </tr>
              <tr className="bg-gray-50">
                <th className="border border-gray-400 px-2 py-1" />
                <th className="border border-gray-400 px-2 py-1" />
                <th className="border border-gray-400 px-2 py-1" />
                <th className="border border-gray-400 px-2 py-1" />
                <th className="border border-gray-400 px-2 py-1" />
                <th className="border border-gray-400 px-2 py-1" />
                <th className="border border-gray-400 px-2 py-1" />
                <th className="border border-gray-400 px-2 py-1 text-center font-semibold">EST</th>
                <th className="border border-gray-400 px-2 py-1 text-center font-semibold">ACTUAL</th>
                <th className="border border-gray-400 px-2 py-1 text-center text-[9px] font-semibold">DD/MM/YY</th>
                <th className="border border-gray-400 px-2 py-1" />
              </tr>
            </thead>
            <tbody>
              {services.map((item, idx) => (
                <tr key={item.id} className="align-top">
                  {/* NO. */}
                  <td className="border border-gray-400 px-2 py-1.5 text-center">{idx + 1}</td>

                  {/* TASKCARD REF */}
                  <td className="border border-gray-400 px-2 py-1.5 font-mono text-[10px]">
                    {item.task_card_ref || "—"}
                  </td>

                  {/* MPD TASK */}
                  <td className="border border-gray-400 px-2 py-1.5 font-mono text-[10px]">
                    {item.mpd_amm_task_ids || "—"}
                  </td>

                  {/* DESCRIPTION */}
                  <td className="border border-gray-400 px-2 py-1.5">
                    <div
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        maxHeight: "9em",
                        overflow: "hidden",
                      }}
                    >
                      {item.description || item.task_name}
                    </div>
                  </td>

                  {/* ZONE */}
                  <td className="border border-gray-400 px-2 py-1.5">
                    {item.zones?.join(", ") || "—"}
                  </td>

                  {/* COMP REQ */}
                  <td className="border border-gray-400 px-2 py-1.5">
                    {item.assigned_component_id
                      ? (componentMap[item.assigned_component_id] ?? item.assigned_component_id.slice(0, 8) + "…")
                      : "—"}
                  </td>

                  {/* INTERVAL */}
                  <td className="border border-gray-400 px-2 py-1.5">
                    {item.interval_threshold != null
                      ? `${item.interval_threshold} ${item.interval_unit === "Hours" ? "FH" : "FC"}`
                      : "—"}
                  </td>

                  {/* EST MANHOURS */}
                  <td className="border border-gray-400 px-2 py-1.5 text-center">
                    {item.estimated_manhours ?? "—"}
                  </td>

                  {/* ACTUAL MANHOURS — blank for technician to fill */}
                  <td className="border border-gray-400 px-2 py-1.5" style={{ minWidth: "6rem" }}>
                    {/* Signature boxes mimicking old code */}
                    <div className="flex items-center border border-gray-400 h-8">
                      <div className="flex-1 border-r border-gray-400 h-full" />
                      <div className="px-0.5 border-r border-gray-400 text-gray-400 text-[10px] self-center">/</div>
                      <div className="flex-1 border-r border-gray-400 h-full" />
                      <div className="px-0.5 border-r border-gray-400 text-gray-400 text-[10px] self-center">/</div>
                      <div className="flex-1 h-full" />
                    </div>
                  </td>

                  {/* COMPLETED DATE — blank for technician */}
                  <td className="border border-gray-400 px-2 py-1.5" />

                  {/* SIGN — blank */}
                  <td className="border border-gray-400 px-2 py-1.5" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-[10px] text-gray-400 print:text-gray-400">
          Generated: {fmtDate(new Date())} — AeroTrend Aviation Config Hub
        </p>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default PrintTaskCard;
