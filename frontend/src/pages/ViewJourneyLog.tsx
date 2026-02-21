import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JOURNEY_MOCK } from "@/pages/JourneyLogForm";
import { cn } from "@/lib/utils";

/*  UI HELPERS  */
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
    "grid grid-cols-1 gap-x-6 gap-y-4",
    cols === 2 && "sm:grid-cols-2",
    cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
    cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
    cols === 6 && "sm:grid-cols-3 lg:grid-cols-6",
  )}>{children}</div>
);

const FV = ({ label, value, mono }: { label: string; value?: string | number; mono?: boolean }) => (
  <div className="space-y-1">
    <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
    <p className={cn("text-sm text-gray-800 min-h-[1.5rem]", mono && "font-mono", !value && "text-gray-300 italic")}>
      {value ?? "—"}
    </p>
  </div>
);

const SignBadge = ({ value }: { value?: string }) => (
  <span className={cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
    value === "Yes" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
  )}>
    {value ?? "No"}
  </span>
);

const CAT_COLORS: Record<string, string> = {
  PIREP: "bg-rose-100 text-rose-700",
  MAREP: "bg-amber-100 text-amber-700",
  INFO:  "bg-blue-100 text-blue-700",
  CABIN: "bg-purple-100 text-purple-700",
};

/*  MAIN  */
const ViewJourneyLog = () => {
  const { id, logId } = useParams<{ id: string; logId: string }>();
  const navigate = useNavigate();

  //  Uncomment when backend is ready 
  // const { data, isLoading } = useQuery(["journeyLog", logId], () => api.journeyLogs.get(logId!));
  // if (isLoading) return <LoadingSpinner />;
  // const { form, sectors, defects } = data;

  const entry = logId ? JOURNEY_MOCK[logId] : null;

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

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="rounded-xl bg-[#556ee6] px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(`/aircraft/${id}/journey`)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/55 font-medium mb-0.5">S2 — Journey Log Panel</p>
              <h1 className="text-lg font-bold text-white leading-none">
                View Journey Log {form.log_sl_no ? `— ${form.log_sl_no}` : ""}
              </h1>
            </div>
          </div>
          <Button variant="outline" size="sm"
            className="h-8 gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs"
            onClick={() => navigate(`/aircraft/${id}/journey/${logId}/edit`)}>
            <Pencil className="h-3.5 w-3.5" /> Edit Entry
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm divide-y">
        <div className="px-6 py-6 space-y-8">

          {/* 1. Header */}
          <Section title="Journey Log Panel">
            <Grid cols={3}>
              <FV label="Company Name"         value={form.company_name} />
              <FV label="Date"                 value={form.date} />
              <FV label="Aircraft Registration" value={form.registration} mono />
              <FV label="Aircraft Type"         value={form.aircraft_type} />
              <FV label="Log Serial No."        value={form.log_sl_no} mono />
            </Grid>
            <Grid cols={3}>
              <FV label="PIC Name"        value={form.pic_name} />
              <FV label="PIC Licence No." value={form.pic_license_no} mono />
            </Grid>
            <Grid cols={2}>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">PIC Signature</span>
                <SignBadge value={form.pic_sign} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Commander Pre-Flight Inspection Signature</span>
                <SignBadge value={form.commander_sign} />
              </div>
            </Grid>
          </Section>

          {/* 2. Sectors */}
          <Section title="Flight Sectors">
            <div className="space-y-4">
              {sectors.map((s, i) => (
                <div key={i} className="rounded-xl border border-dashed border-[#556ee6]/30 bg-blue-50/30 p-4 space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#556ee6]">Sl.No: {i + 1}</span>
                  <Grid cols={3}>
                    <FV label="Flight Number" value={s.flight_num} mono />
                    <FV label="Sector From"   value={s.sector_from} mono />
                    <FV label="Sector To"     value={s.sector_to}   mono />
                  </Grid>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border bg-white p-3 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">On-Chock</span>
                      <Grid cols={2}>
                        <FV label="Departure Date" value={s.on_chock_dep_date} />
                        <FV label="Departure Time" value={s.on_chock_dep_time} mono />
                        <FV label="Arrival Date"   value={s.on_chock_arr_date} />
                        <FV label="Arrival Time"   value={s.on_chock_arr_time} mono />
                      </Grid>
                      <FV label="Sector Duration" value={s.on_chock_duration} mono />
                    </div>
                    <div className="rounded-lg border bg-white p-3 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Off-Chock</span>
                      <Grid cols={2}>
                        <FV label="Departure Date" value={s.off_chock_dep_date} />
                        <FV label="Departure Time" value={s.off_chock_dep_time} mono />
                        <FV label="Arrival Date"   value={s.off_chock_arr_date} />
                        <FV label="Arrival Time"   value={s.off_chock_arr_time} mono />
                      </Grid>
                      <FV label="Sector Duration" value={s.off_chock_duration} mono />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 3. Fuel */}
          <Section title="Fuel">
            <Grid cols={3}>
              <FV label="Fuel Arrival (kg)"           value={form.fuel_arrival}           mono />
              <FV label="Fuel Departure (kg)"         value={form.fuel_departure}         mono />
              <FV label="Remaining Fuel Onboard (kg)" value={form.remaining_fuel_onboard} mono />
              <FV label="Fuel Uplift (kg)"            value={form.fuel_uplift}            mono />
              <FV label="Calculate Total Fuel (kg)"   value={form.calculate_total_fuel}   mono />
              <FV label="Fuel Discrepancy (kg)"       value={form.fuel_discrepancy}       mono />
              <FV label="Aircraft Total Hrs"          value={form.aircraft_total_hrs}     mono />
              <FV label="Aircraft Total Cyc"          value={form.aircraft_total_cyc}     mono />
              <FV label="Fuel Flight Deck Gauge (kg)" value={form.fuel_flight_deck_gauge} mono />
            </Grid>
          </Section>

          {/* 4. Maintenance */}
          <Section title="Maintenance">
            <Grid cols={3}>
              <FV label="Next Due Maintenance"  value={form.next_due_maintenance} />
              <FV label="Due @ Date"            value={form.due_at_date} />
              <FV label="Due @ Hours"           value={form.due_at_hours} mono />
              <FV label="Total Flight Hrs"      value={form.total_flight_hrs} mono />
              <FV label="Total Flight Cyc"      value={form.total_flight_cyc} mono />
              <FV label="Daily Inspection"      value={form.daily_inspection} />
              <FV label="Type of Maintenance"   value={form.type_of_maintenance} />
              <FV label="APU Hrs"               value={form.apu_hrs} mono />
              <FV label="APU Cyc"               value={form.apu_cyc} mono />
            </Grid>
          </Section>

          {/* 5. Oil */}
          <Section title="Oil Uplift">
            <Grid cols={3}>
              <FV label="Oil Uplift Engine No.1 (L)" value={form.oil_uplift_eng1} mono />
              <FV label="Oil Uplift Engine No.2 (L)" value={form.oil_uplift_eng2} mono />
              <FV label="Oil Uplift APU (L)"          value={form.oil_uplift_apu}  mono />
            </Grid>
          </Section>

          {/* 6. Defects */}
          <Section title="Action Taken">
            {defects.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No entries recorded.</p>
            ) : (
              <div className="space-y-4">
                {defects.map((d, i) => (
                  <div key={d.id} className="rounded-xl border p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-md px-2.5 py-1 text-[11px] font-bold uppercase", CAT_COLORS[d.category])}>
                        {d.category}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium">Entry #{i + 1}</span>
                    </div>
                    <Grid cols={2}>
                      <FV label="Defect Description" value={d.defect_description} />
                      <FV label="Action Taken"       value={d.action_taken} />
                    </Grid>
                    <Grid cols={4}>
                      <FV label="MEL Expiry Date" value={d.mel_expiry_date} />
                      <FV label="MEL Reference"   value={d.mel_reference} mono />
                      <FV label="MEL Repair Cat"  value={d.mel_repair_cat} mono />
                      <FV label="Lic No"          value={d.lic_no} mono />
                    </Grid>
                    {([1, 2] as const).map((pn) => {
                      const pre = `part${pn}_` as "part1_" | "part2_";
                      const desc = d[`${pre}description` as keyof typeof d] as string;
                      if (!desc) return null;
                      return (
                        <div key={pn} className="rounded-lg border bg-gray-50/50 p-3 space-y-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Part Description – {pn}</span>
                          <FV label="Part Description" value={desc} />
                          <Grid cols={2}>
                            <FV label="Part Number On"   value={d[`${pre}number_on` as keyof typeof d] as string} mono />
                            <FV label="Part Number Off"  value={d[`${pre}number_off` as keyof typeof d] as string} mono />
                            <FV label="Serial Number On"  value={d[`${pre}serial_on` as keyof typeof d] as string} mono />
                            <FV label="Serial Number Off" value={d[`${pre}serial_off` as keyof typeof d] as string} mono />
                          </Grid>
                          <FV label="Certificate Number" value={d[`${pre}cert_num` as keyof typeof d] as string} mono />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* 7. Signatures */}
          <Section title="Signatures">
            <Grid cols={2}>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Daily Inspection Signature &amp; Stamp</span>
                <SignBadge value={form.daily_inspection_sign} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Signature and Stamp</span>
                <SignBadge value={form.sign_stamp} />
              </div>
            </Grid>
          </Section>

        </div>

        {/* Footer */}
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
