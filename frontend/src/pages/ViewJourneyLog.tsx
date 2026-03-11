import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";


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

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

// Read-only input-look-alike — matches the h-8 Input styling
const RO = ({ value, mono }: { value?: string | number | null; mono?: boolean }) => (
  <div className={cn(
    "flex h-8 items-center rounded-md border border-input bg-gray-50 px-3 text-sm",
    mono && "font-mono",
    (value == null || value === "") ? "text-gray-400 italic" : "text-gray-800",
  )}>
    {value != null && value !== "" ? value : "—"}
  </div>
);

const SignDisplay = ({ label, value }: { label: string; value?: string }) => {
  const v = value ?? "No";
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-700">{label}</span>
      <div className="flex gap-2 pointer-events-none select-none">
        {["Yes", "No"].map((opt) => (
          <div key={opt} className={cn(
            "flex-1 rounded-lg border py-2 text-xs font-semibold text-center",
            v === opt
              ? (opt === "Yes" ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-rose-50 border-rose-400 text-rose-600")
              : "bg-white border-gray-200 text-gray-300",
          )}>
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
};

const CAT_COLORS: Record<string, string> = {
  PIREP: "bg-rose-100 text-rose-700 border-rose-300",
  MAREP: "bg-amber-100 text-amber-700 border-amber-300",
  INFO:  "bg-blue-100 text-blue-700 border-blue-300",
  CABIN: "bg-cyan-100 text-cyan-700 border-cyan-300",
};

const ViewJourneyLog = () => {
  const { id, logId } = useParams<{ id: string; logId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<{ form: any; sectors: any[]; defects: any[] } | null>(null);
  const [aircraftTotals, setAircraftTotals] = useState<{ hrs: string; cyc: string }>({ hrs: "", cyc: "" });

  useEffect(() => {
    if (!id) return;
    api.aircrafts.get(id).then((aircraft: any) => {
      setAircraftTotals({
        hrs: String(aircraft.flight_hours ?? 0),
        cyc: String(aircraft.flight_cycles ?? 0),
      });
    }).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!logId) return;
    setLoading(true);
    api.journeyLogs.get(logId)
      .then((data: any) => {
        const fmt = (v: string | null | undefined) =>
          v ? new Date(v).toISOString().split("T")[0] : "";
        setEntry({
          form: {
            date:                   fmt(data.date),
            registration:           data.registration,
            aircraft_type:          data.aircraft_type,
            log_sl_no:              data.log_sl_no,
            pic_name:               data.pic_name,
            pic_license_no:         data.pic_license_no,
            pic_sign:               data.pic_sign,
            commander_sign:         data.commander_sign,
            fuel_arrival:           data.fuel_arrival?.toString(),
            fuel_departure:         data.fuel_departure?.toString(),
            remaining_fuel_onboard: data.remaining_fuel_onboard?.toString(),
            fuel_uplift:            data.fuel_uplift?.toString(),
            calculate_total_fuel:   data.calculate_total_fuel?.toString(),
            fuel_discrepancy:       data.fuel_discrepancy?.toString(),
            aircraft_total_hrs:     data.aircraft_total_hrs?.toString(),
            aircraft_total_cyc:     data.aircraft_total_cyc?.toString(),
            fuel_flight_deck_gauge: data.fuel_flight_deck_gauge?.toString(),
            next_due_maintenance:   fmt(data.next_due_maintenance),
            due_at_date:            fmt(data.due_at_date),
            due_at_hours:           data.due_at_hours?.toString(),
            total_flight_hrs:       data.total_flight_hrs?.toString(),
            total_flight_cyc:       data.total_flight_cyc?.toString(),
            daily_inspection:       fmt(data.daily_inspection),
            type_of_maintenance:    data.type_of_maintenance,
            apu_hrs:                data.apu_hrs?.toString(),
            apu_cyc:                data.apu_cyc?.toString(),
            oil_uplift_eng1:        data.oil_uplift_eng1?.toString(),
            oil_uplift_eng2:        data.oil_uplift_eng2?.toString(),
            oil_uplift_apu:         data.oil_uplift_apu?.toString(),
            daily_inspection_sign:  data.daily_inspection_sign,
            sign_stamp:             data.sign_stamp,
          },
          sectors: data.sectors ?? [],
          defects: data.defects ?? [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [logId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <p className="text-sm text-muted-foreground">Journey log entry not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(`/aircraft/${id}/journey`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
        </Button>
      </div>
    );
  }

  const { form, sectors, defects } = entry;
  const s = sectors[0] ?? {};

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="rounded-xl bg-[#ffffff] px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(`/aircraft/${id}/journey`)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-black hover:bg-white/20 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-black/55 font-medium mb-0.5">S2 — Journey Log Panel</p>
              <h1 className="text-lg font-bold text-black leading-none">View Journey Log Entry</h1>
            </div>
          </div>
          <Button variant="outline" size="sm"
            className="h-8 gap-1.5 border-gray-200 text-[#556ee6] hover:bg-blue-50 font-semibold text-xs"
            onClick={() => navigate(`/aircraft/${id}/journey/${logId}/edit`)}>
            <Pencil className="h-3.5 w-3.5" /> Edit Entry
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm divide-y">
        <div className="px-6 py-6 space-y-8">

          {/* 1. Journey Log Panel*/}
          <Section title="Journey Log Panel">
            <Grid cols={3}>
              <F label="Date"><RO value={form.date} /></F>
              <F label="Aircraft Registration"><RO value={form.registration} mono /></F>
              <F label="Aircraft Model"><RO value={form.aircraft_type} /></F>
              <F label="Log Serial No."><RO value={form.log_sl_no} mono /></F>
              <F label="Total Flight Hrs"><RO value={aircraftTotals.hrs} mono /></F>
              <F label="Total Flight Cyc"><RO value={aircraftTotals.cyc} mono /></F>
            </Grid>
            <Grid cols={3}>
              <F label="PIC Name"><RO value={form.pic_name} /></F>
              <F label="PIC Licence No."><RO value={form.pic_license_no} mono /></F>
            </Grid>
            <Grid cols={2}>
              <SignDisplay label="PIC Signature" value={form.pic_sign} />
              <SignDisplay label="Commander Pre-Flight Inspection Signature" value={form.commander_sign} />
            </Grid>
          </Section>

          {/* 2. Flight Sectors*/}
          <Section title="Flight Sectors">
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-[#556ee6]/30 bg-blue-50/30 p-4 space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#556ee6]">Sl.No: 1</span>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  <F label="Flight Number"><RO value={s.flight_num} mono /></F>
                  <F label="Sector From"><RO value={s.sector_from} mono /></F>
                  <F label="Sector To"><RO value={s.sector_to} mono /></F>
                  <F label="Departure Date"><RO value={s.on_chock_dep_date} /></F>
                  <F label="Arrival Date"><RO value={s.on_chock_arr_date} /></F>
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
                              <div className="flex-1"><RO value={s.on_chock_dep_time} mono /></div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 whitespace-nowrap w-16 shrink-0">Take Off</span>
                              <div className="flex-1"><RO value={s.off_chock_dep_time} mono /></div>
                            </div>
                          </td>
                        </tr>
                        {/* Row 2: Block On | Landing */}
                        <tr className="border-b border-gray-200">
                          <td className="border-r border-gray-200 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 whitespace-nowrap w-16 shrink-0">Block On</span>
                              <div className="flex-1"><RO value={s.on_chock_arr_time} mono /></div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 whitespace-nowrap w-16 shrink-0">Landing</span>
                              <div className="flex-1"><RO value={s.off_chock_arr_time} mono /></div>
                            </div>
                          </td>
                        </tr>
                        {/* Row 3: Block Hrs | Flight Hrs | Total Cycles */}
                        <tr className="bg-[#556ee6]/5">
                          <td className="border-r border-gray-200 px-3 py-2">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-[#556ee6] whitespace-nowrap shrink-0">Block Hrs</span>
                                <span className="text-sm font-semibold text-gray-800">{s.on_chock_duration || "—"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-[#556ee6] whitespace-nowrap shrink-0">Flight Hrs</span>
                                <span className="text-sm font-semibold text-gray-800">{s.off_chock_duration || "—"}</span>
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
            </div>
          </Section>

          {/* 3. Fuel*/}
          <Section title="Fuel">
            <Grid cols={3}>
              <F label="Fuel Arrival (kg)"><RO value={form.fuel_arrival} mono /></F>
              <F label="Fuel Departure (kg)"><RO value={form.fuel_departure} mono /></F>
              <F label="Remaining Fuel Onboard (kg)"><RO value={form.remaining_fuel_onboard} mono /></F>
              <F label="Fuel Uplift (kg)"><RO value={form.fuel_uplift} mono /></F>
              <F label="Calculate Total Fuel (kg)"><RO value={form.calculate_total_fuel} mono /></F>
              <F label="Fuel Discrepancy (kg)"><RO value={form.fuel_discrepancy} mono /></F>
              <F label="Aircraft Total Hrs"><RO value={aircraftTotals.hrs} mono /></F>
              <F label="Aircraft Total Cyc"><RO value={aircraftTotals.cyc} mono /></F>
              <F label="Fuel Flight Deck Gauge (kg)"><RO value={form.fuel_flight_deck_gauge} mono /></F>
            </Grid>
          </Section>

          {/* 4. Maintenance */}
          <Section title="Maintenance">
            <Grid cols={3}>
              <F label="Next Due Maintenance"><RO value={form.next_due_maintenance} /></F>
              <F label="Due @ Date"><RO value={form.due_at_date} /></F>
              <F label="Due @ Hours"><RO value={form.due_at_hours} mono /></F>
              <F label="Daily Inspection"><RO value={form.daily_inspection} /></F>
              <F label="Type of Maintenance"><RO value={form.type_of_maintenance} /></F>
              <F label="APU Hrs"><RO value={form.apu_hrs} mono /></F>
              <F label="APU Cyc"><RO value={form.apu_cyc} mono /></F>
            </Grid>
          </Section>

          {/* 5. Oil Uplift */}
          <Section title="Oil Uplift">
            <Grid cols={3}>
              <F label="Oil Uplift Engine No.1 (L)"><RO value={form.oil_uplift_eng1} mono /></F>
              <F label="Oil Uplift Engine No.2 (L)"><RO value={form.oil_uplift_eng2} mono /></F>
              <F label="Oil Uplift APU (L)"><RO value={form.oil_uplift_apu} mono /></F>
            </Grid>
          </Section>

          {/* 6. Action Taken */}
          <Section title="Action Taken">
            {defects.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No entries recorded.</p>
            ) : (
              <div className="space-y-4">
                {defects.map((d: any, i: number) => (
                  <div key={d.id ?? i} className="rounded-xl border p-4 space-y-4">
                    {/* Category tabs*/}
                    <div className="flex items-center gap-1.5 pointer-events-none select-none flex-wrap">
                      {(["PIREP", "MAREP", "INFO", "CABIN"] as const).map((cat) => (
                        <div key={cat} className={cn(
                          "rounded-md border px-3 py-1 text-[11px] font-bold uppercase",
                          d.category === cat ? CAT_COLORS[cat] : "bg-white border-gray-200 text-gray-300",
                        )}>
                          {cat}
                        </div>
                      ))}
                      <span className="text-[11px] text-muted-foreground font-medium ml-1">Entry #{i + 1}</span>
                    </div>

                    <Grid cols={2}>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Defect Description</label>
                        <div className="min-h-[5rem] rounded-md border border-input bg-gray-50 px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                          {d.defect_description || <span className="text-gray-400 italic">—</span>}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Action Taken</label>
                        <div className="min-h-[5rem] rounded-md border border-input bg-gray-50 px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                          {d.action_taken || <span className="text-gray-400 italic">—</span>}
                        </div>
                      </div>
                    </Grid>

                    <Grid cols={4}>
                      <F label="MEL Expiry Date"><RO value={d.mel_expiry_date} /></F>
                      <F label="MEL Reference"><RO value={d.mel_reference} mono /></F>
                      <F label="MEL Repair Cat"><RO value={d.mel_repair_cat} mono /></F>
                      <F label="Lic No"><RO value={d.lic_no} mono /></F>
                    </Grid>

                    {([1, 2] as const).map((pn) => {
                      const pre = `part${pn}_`;
                      const desc = d[`${pre}description`] as string;
                      if (!desc) return null;
                      return (
                        <div key={pn} className="rounded-lg border bg-gray-50/50 p-3 space-y-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Part Description – {pn}</span>
                          <F label="Part Description"><RO value={desc} /></F>
                          <Grid cols={2}>
                            <F label="Part Number On"><RO value={d[`${pre}number_on`]} mono /></F>
                            <F label="Part Number Off"><RO value={d[`${pre}number_off`]} mono /></F>
                            <F label="Serial Number On"><RO value={d[`${pre}serial_on`]} mono /></F>
                            <F label="Serial Number Off"><RO value={d[`${pre}serial_off`]} mono /></F>
                          </Grid>
                          <F label="Certificate Number"><RO value={d[`${pre}cert_num`]} mono /></F>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* 7. Signatures*/}
          <Section title="Signatures">
            <Grid cols={2}>
              <SignDisplay label="Daily Inspection Signature &amp; Stamp" value={form.daily_inspection_sign} />
              <SignDisplay label="Signature and Stamp" value={form.sign_stamp} />
            </Grid>
          </Section>

        </div>
        
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/60">
          <Button variant="outline" size="sm" onClick={() => navigate(`/aircraft/${id}/journey`)}>
            <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to List
          </Button>
          <Button size="sm" className="gap-1.5 bg-[#556ee6] hover:bg-[#4560d5]"
            onClick={() => navigate(`/aircraft/${id}/journey/${logId}/edit`)}>
            <Pencil className="h-3.5 w-3.5" /> Edit Entry
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewJourneyLog;
