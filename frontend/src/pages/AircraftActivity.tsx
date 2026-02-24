import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Plane,
  Wrench,
  FileText,
  BookOpen,
  Package,
  TrendingUp,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Aircraft {
  id: string;
  model: string;
  registration_number: string;
  flight_hours: number;
  flight_cycles: number;
  msn: string;
}

interface Panel {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string; // relative href; :id will be replaced
}

const PANELS: Panel[] = [
  {
    id: "S1",
    label: "OCCM Panel",
    icon: ClipboardList,
    href: "/aircraft/:id/occm",
  },
  {
    id: "S2",
    label: "Journey Log Panel S2",
    icon: Plane,
    href: "/aircraft/:id/journey",
  },
  {
    id: "S3",
    label: "Panel S3",
    icon: Wrench,
  },
  {
    id: "S4",
    label: "Panel S4",
    icon: FileText,
  },
  {
    id: "S5",
    label: "Panel S5",
    icon: BookOpen,
  },
  {
    id: "S6",
    label: "Panel S6",
    icon: Package,
  },
  {
    id: "S7",
    label: "Forecast Panel S7",
    icon: TrendingUp,
    href: "/aircraft/:id/forecast",
  },
];

// Fill S8–S30 as locked placeholders
for (let i = 8; i <= 30; i++) {
  PANELS.push({
    id: `S${i}`,
    label: `Panel S${i}`,
    icon: Lock,
  });
}

const StatBadge = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] uppercase tracking-widest text-white/50 font-medium">
      {label}
    </span>
    <span className="text-base font-semibold text-white leading-none">{value ?? "—"}</span>
  </div>
);

const AircraftActivity = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.aircrafts
      .get(id)
      .then((data: Aircraft) => setAircraft(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const resolveHref = (href: string) => href.replace(":id", id ?? "");

  return (
    <div className="space-y-0 pb-12">
      {/* ── Header bar ── */}
      <p className="text-xs uppercase tracking-widest text-black/90  font-bold mb-0.5">
                Aircraft Activity Selection
              </p>
      <div className="rounded-xl bg-[#556ee6] px-6 py-5 mb-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60  font-medium mb-0.5">Aircraft Model</p>
              <h1 className="text-lg font-bold text-white leading-none">
                {loading ? "Loading…" : (aircraft?.model ?? "—")}
              </h1>
            </div>
          </div>

          {!loading && aircraft && (
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 sm:justify-end">
              <StatBadge label="National Reg ID" value={aircraft.registration_number} />
              <div className="hidden sm:block w-px h-8 bg-white/20" />
              <StatBadge label="Aircraft FH" value={aircraft.flight_hours} />
              <div className="hidden sm:block w-px h-8 bg-white/20" />
              <StatBadge label="Aircraft FC" value={aircraft.flight_cycles} />
            </div>
          )}
        </div>
      </div>

      {/* ── Panel grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mt-2">
        {PANELS.map((panel) => {
          const Icon = panel.icon;
          const isActive = true;

          return (
            <button
              key={panel.id}
              disabled={!isActive}
              onClick={() => isActive && panel.href && navigate(resolveHref(panel.href))}
              className={cn(
                "group relative flex flex-col items-start gap-3 rounded-xl border bg-white p-4 text-left",
                "transition-all duration-150",
                isActive
                  ? "cursor-pointer hover:border-[#556ee6]/60 hover:shadow-md hover:-translate-y-0.5"
                  : "cursor-not-allowed opacity-50"
              )}
            >
              {/* Panel ID tag */}
              <span className="absolute top-3 right-3 text-[10px] font-mono font-semibold text-muted-foreground/60">
                {panel.id}
              </span>

              {/* Icon */}
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  isActive ? "bg-[#556ee6]/10" : "bg-gray-100"
                )}
              >
                <Icon
                  className={cn("h-4 w-4", isActive ? "text-[#556ee6]" : "text-gray-400")}
                />
              </div>

              {/* Text */}
              <div className="space-y-0.5 pr-4">
                <p
                  className={cn(
                    "text-[13px] font-semibold leading-snug",
                    isActive ? "text-gray-800" : "text-gray-500"
                  )}
                >
                  {panel.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AircraftActivity;
