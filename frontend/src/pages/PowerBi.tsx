import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { decimalToHoursMinutes } from "@/lib/utils";
import { addDays, addYears, format, differenceInMonths } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Interfaces
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
  estimated_manhours: number | null;
  estimated_price: number | null;
  estimated_currency: string | null;
  quotation_price: number | null;
  quotation_currency: string | null;
  interval_threshold: number | null;
  repeat_interval: number | null;
  interval_unit: string;
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

interface Aircraft {
  id: string;
  model: string;
  msn: string;
  registration_number: string;
  flight_hours: number;
  flight_cycles: number;
}

// Helper functions
function calculateNextDue(
  aircraft: Aircraft,
  service: Service,
  forecast: ForecastRecord | null,
  avgHours: number,
  avgCycles: number
) {
  const unit = forecast?.interval_unit ?? service.interval_unit ?? "Hours";
  const repeat = service.repeat_interval ?? 0;

  let nextDate: Date | null = null;
  let nextHours: number | null = null;
  let nextCycles: number | null = null;
  let remainingHours: number | null = null;
  let remainingCycles: number | null = null;
  let remaining: string = "—";

  if (forecast) {
    if (unit === "Hours") {
      nextHours = (forecast.last_hours ?? 0) + repeat;
      remainingHours = nextHours - aircraft.flight_hours;
      const numDays = remainingHours > 0 ? Math.floor(remainingHours / avgHours) : 0;
      nextDate = addDays(new Date(), numDays);
      remaining = `${remainingHours.toFixed(2)} FH`;
    } else if (unit === "Cycles") {
      nextCycles = (forecast.last_cycles ?? 0) + repeat;
      remainingCycles = nextCycles - aircraft.flight_cycles;
      const numDays = remainingCycles > 0 ? Math.floor(remainingCycles / avgCycles) : 0;
      nextDate = addDays(new Date(), numDays);
      remaining = `${Math.round(remainingCycles)} FC`;
    } else if (unit === "Years" && forecast.last_date) {
      nextDate = addYears(new Date(forecast.last_date), repeat);
      remaining = `${differenceInMonths(nextDate, new Date())} months`;
    }
  }

  return {
    nextDate,
    nextHours,
    nextCycles,
    remainingHours,
    remainingCycles,
    remaining,
    unit,
  };
}

function buildChartData(
  aircraft: Aircraft,
  services: Service[],
  forecasts: ForecastRecord[],
  avgHours: number,
  avgCycles: number,
  dailyFlightHours: number = 8
) {
  console.log("Building chart data for aircraft model:", aircraft.model);

  // Filter services for this aircraft model
  const modelServices = services.filter((s) => s.aircraft_model === aircraft.model);
  console.log(`Found ${modelServices.length} services for model ${aircraft.model}`);

  // If no services for this model, but there are services in general, show a warning
  if (modelServices.length === 0 && services.length > 0) {
    console.warn(`No services found for aircraft model: ${aircraft.model}`);
    console.log("Available models in services:", [...new Set(services.map(s => s.aircraft_model))]);
  }

  // Calculate next due dates and costs for each service
  const serviceData = modelServices.map((service) => {
    const forecast = forecasts.find((f) => f.service_id === service.id) ?? null;
    const dueInfo = calculateNextDue(aircraft, service, forecast, dailyFlightHours, avgCycles);

    // Dynamic fallback exchange rates (could be fetched from API)
    const EXCHANGE_RATES: Record<string, number> = {
      USD: 1,
      MYR: 0.25, 
      EUR: 1.15,
    };
    
    const estRate = EXCHANGE_RATES[service.estimated_currency || "MYR"] || 1;
    const quotRate = EXCHANGE_RATES[service.quotation_currency || "MYR"] || 1;

    const componentValue = service.assigned_component_id ? ((service.estimated_price ?? 0) * estRate) : 0;
    const serviceValue = (service.quotation_price ?? service.estimated_price ?? 0) * (service.quotation_price ? quotRate : estRate);
    const totalValue = componentValue + serviceValue;

    return {
      service,
      forecast,
      dueInfo,
      componentValue,
      serviceValue,
      totalValue,
      taskId: service.mpd_id || service.task_name,
    };
  });

  // Sort by next due date
  const sortedData = serviceData
    .filter((d) => d.dueInfo.nextDate)
    .sort((a, b) => {
      if (!a.dueInfo.nextDate || !b.dueInfo.nextDate) return 0;
      return a.dueInfo.nextDate.getTime() - b.dueInfo.nextDate.getTime();
    });

  console.log(`${sortedData.length} services have forecast data with next due dates`);

  // Build monthly forecast data (12 months)
  const monthlyData: any[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();
  let cumulative = 0;

  for (let i = 0; i < 12; i++) {
    const monthDate = addDays(today, i * 30);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const tasksThisMonth = sortedData.filter((d) => {
      if (!d.dueInfo.nextDate) return false;
      return d.dueInfo.nextDate >= monthStart && d.dueInfo.nextDate <= monthEnd;
    });

    const compCost = tasksThisMonth.reduce((sum, d) => sum + d.componentValue, 0);
    const serviceCost = tasksThisMonth.reduce((sum, d) => sum + d.serviceValue, 0);
    const total = compCost + serviceCost;
    cumulative += total;

    monthlyData.push({
      month: monthNames[monthDate.getMonth()],
      compCost: Math.round(compCost),
      serviceCost: Math.round(serviceCost),
      total: Math.round(total),
      cumulative: Math.round(cumulative),
    });
  }

  // Build bubble chart data (tasks within 12 months) - sorted chronologically
  const bubbleData = sortedData
    .filter((d) => {
      if (!d.dueInfo.nextDate) return false;
      const monthsDiff = differenceInMonths(d.dueInfo.nextDate, today);
      return monthsDiff >= 0 && monthsDiff <= 12;
    })
    .map((d, index) => {
      const dueDate = d.dueInfo.nextDate!;
      const monthYear = format(dueDate, "MMM yyyy"); // e.g., "Apr 2026"
      const monthName = format(dueDate, "MMM"); // e.g., "Apr"
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: d.taskId,
        dueDate: dueDate.getTime(), // Timestamp for X-axis positioning
        monthNumeric: Math.max(1, differenceInMonths(dueDate, today) + 1),
        monthName: monthName, // For display
        monthYear: monthYear, // For tooltip
        daysUntilDue: daysUntilDue,
        mh: d.service.estimated_manhours ?? 0,
        cost: d.totalValue,
        name: d.service.task_name,
        shortName: d.taskId, // Use task ID for bubble labels
        index: index, // For connecting lines
      };
    })
    .sort((a, b) => a.dueDate - b.dueDate); // Ensure chronological order

  // Find major overhauls (high cost tasks beyond 12 months)
  const majorOverhauls = sortedData
    .filter((d) => d.totalValue > 100000 && d.dueInfo.nextDate)
    .map((d) => ({
      id: d.taskId,
      year: d.dueInfo.nextDate!.getFullYear(),
      mh: d.service.estimated_manhours ?? 0,
      cost: d.totalValue,
      name: d.service.task_name,
    }));

  // Build remaining life data (all sorted tasks)
  const remainingLifeData = sortedData.map((d) => ({
    id: d.taskId,
    remaining: d.dueInfo.remaining,
    date: d.dueInfo.nextDate ? format(d.dueInfo.nextDate, "dd-MMM-yyyy") : "—",
    mh: d.service.estimated_manhours ?? 0,
    compValue: d.componentValue,
    servValue: d.serviceValue,
    totalValue: d.totalValue,
  }));

  // Calculate totals
  const total12MLiability = monthlyData[11]?.cumulative ?? 0;
  const totalComponentsCost = sortedData
    .filter((d) => {
      if (!d.dueInfo.nextDate) return false;
      const monthsDiff = differenceInMonths(d.dueInfo.nextDate, today);
      return monthsDiff >= 0 && monthsDiff <= 12;
    })
    .reduce((sum, d) => sum + d.componentValue, 0);
  const totalServicesCost = sortedData
    .filter((d) => {
      if (!d.dueInfo.nextDate) return false;
      const monthsDiff = differenceInMonths(d.dueInfo.nextDate, today);
      return monthsDiff >= 0 && monthsDiff <= 12;
    })
    .reduce((sum, d) => sum + d.serviceValue, 0);

  const nextMajorOverhaul = majorOverhauls.length > 0 ? majorOverhauls[0] : null;

  return {
    monthlyData,
    bubbleData,
    majorOverhauls,
    remainingLifeData,
    total12MLiability,
    totalComponentsCost,
    totalServicesCost,
    nextMajorOverhaul,
  };
}

// ─── Maintenance Portfolio Bubble Chart ────────────────────────────────────────

interface BubbleDatum {
  id: string;
  dueDate: number;
  monthName: string;
  monthYear: string;
  mh: number;
  cost: number;
  name: string;
  shortName: string;
  index: number;
}

function getBubbleRadius(cost: number, minCost: number, maxCost: number): number {
  const MIN_R = 14;
  const MAX_R = 36;
  if (maxCost === minCost) return (MIN_R + MAX_R) / 2;
  const t = (cost - minCost) / (maxCost - minCost);
  return MIN_R + t * (MAX_R - MIN_R);
}

const MaintenanceBubbleChart = ({
  bubbleData,
  aircraft,
}: {
  bubbleData: BubbleDatum[];
  aircraft: any;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 500 });

  const measure = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDims({ width: Math.max(width, 400), height: Math.max(height, 300) });
    }
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Layout constants
  const LEGEND_W = 100;  // right legend area width
  const PAD_LEFT = 80;
  const PAD_TOP = 80;    // extra space for label boxes above top bubble
  const PAD_BOTTOM = 60;
  const PAD_RIGHT = 20;

  const plotW = dims.width - PAD_LEFT - LEGEND_W - PAD_RIGHT;
  const plotH = dims.height - PAD_TOP - PAD_BOTTOM;

  // X-axis: determine date range
  if (!bubbleData || bubbleData.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
        No maintenance tasks within forecast window.
      </div>
    );
  }

  const sortedData = [...bubbleData].sort((a, b) => a.dueDate - b.dueDate);
  const minDate = sortedData[0].dueDate;
  const maxDate = sortedData[sortedData.length - 1].dueDate;

  // ── Dynamic Y-axis: scale to fit all MH values ──────────────────────────────
  const maxMH = Math.max(...sortedData.map((d) => d.mh));
  const Y_MIN = 0;
  // Round up to next multiple of 2, then add 4 ticks of headroom for label boxes
  const Y_MAX = Math.max(16, Math.ceil((maxMH + 4) / 2) * 2);
  const yTicks: number[] = [];
  for (let t = 0; t <= Y_MAX; t += 2) yTicks.push(t);
  const toY = (mh: number) => PAD_TOP + plotH - ((mh - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;


  // Build month ticks spanning the range + padding months
  const startDate = new Date(minDate);
  startDate.setDate(1);
  startDate.setHours(0,0,0,0);
  startDate.setMonth(startDate.getMonth() - 1);
  
  const endDate = new Date(maxDate);
  endDate.setDate(1);
  endDate.setHours(0,0,0,0);
  endDate.setMonth(endDate.getMonth() + 2);

  const monthTicks: { label: string; ts: number }[] = [];
  const cursor = new Date(startDate);
  // Prevent infinite loops if dates are bad
  let safety = 0;
  while (cursor <= endDate && safety < 100) {
    monthTicks.push({ label: format(cursor, 'MMM'), ts: cursor.getTime() });
    cursor.setMonth(cursor.getMonth() + 1);
    safety++;
  }

  const xDomainMin = startDate.getTime();
  const xDomainMax = monthTicks[monthTicks.length - 1].ts;
  const toX = (ts: number) =>
    PAD_LEFT + ((ts - xDomainMin) / (xDomainMax - xDomainMin)) * plotW;

  // Cost range for bubble radius scaling
  const costs = sortedData.map((d) => d.cost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);

  // Make legend ticks dynamic based on min/max cost
  const legendInterval = Math.max(500, Math.ceil((maxCost - minCost) / 7 / 500) * 500);
  const legendMin = Math.floor(minCost / 500) * 500;
  const legendMax = legendMin + (legendInterval * 7);
  
  const legendTicks: number[] = [];
  for (let t = legendMax; t >= legendMin; t -= legendInterval) {
    if (t > 0) legendTicks.push(t);
  }

  // Legend dimensions
  const LEG_BAR_H = 220;
  const LEG_BAR_W = 16;
  const LEG_X = PAD_LEFT + plotW + 24;
  const LEG_Y_TOP = PAD_TOP + 10;
  const LEG_LABEL_MIN = legendMin;
  const LEG_LABEL_MAX = legendMax;
  const legTickY = (v: number) =>
    LEG_Y_TOP + LEG_BAR_H - ((v - LEG_LABEL_MIN) / (LEG_LABEL_MAX - LEG_LABEL_MIN)) * LEG_BAR_H;

  function getDynamicBubbleColor(cost: number) {
    let p = 0;
    if (legendMax > legendMin) {
      p = Math.max(0, Math.min(1, (cost - legendMin) / (legendMax - legendMin)));
    }
    const stops = [
      { pct: 0.0, rgb: [250, 243, 215], stroke: [200, 180, 90] },   // #FAF3D7
      { pct: 0.4, rgb: [238, 219, 146], stroke: [180, 150, 30] },   // #EEDB92
      { pct: 0.8, rgb: [225, 90, 107],  stroke: [150, 30, 40] },    // #E15A6B
      { pct: 1.0, rgb: [155, 35, 53],   stroke: [100, 15, 25] }     // #9B2335
    ];
    let lower = stops[0], upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (p >= stops[i].pct && p <= stops[i+1].pct) {
        lower = stops[i];
        upper = stops[i+1];
        break;
      }
    }
    const range = upper.pct - lower.pct;
    const factor = range === 0 ? 0 : (p - lower.pct) / range;
    const interp = (a: number, b: number) => Math.round(a + factor * (b - a));
    return { 
      fill: `rgb(${interp(lower.rgb[0], upper.rgb[0])},${interp(lower.rgb[1], upper.rgb[1])},${interp(lower.rgb[2], upper.rgb[2])})`,
      stroke: `rgb(${interp(lower.stroke[0], upper.stroke[0])},${interp(lower.stroke[1], upper.stroke[1])},${interp(lower.stroke[2], upper.stroke[2])})`
    };
  }

  // Compute pixel positions
  const bubbles = sortedData.map((d) => ({
    ...d,
    cx: toX(d.dueDate),
    cy: toY(d.mh),
    r: getBubbleRadius(d.cost, minCost, maxCost),
    color: getDynamicBubbleColor(d.cost),
  }));

  // Label box height
  const LBL_W = 76;
  const LBL_H = 46;
  const LBL_PAD_Y = 10; // gap between label bottom and bubble top

  const svgH = dims.height;
  const svgW = dims.width;

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg width={svgW} height={svgH} style={{ fontFamily: 'inherit', overflow: 'visible' }}>
        <defs>
          <linearGradient id="mbcLegendGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FAF3D7" />
            <stop offset="40%" stopColor="#EEDB92" />
            <stop offset="80%" stopColor="#E15A6B" />
            <stop offset="100%" stopColor="#9B2335" />
          </linearGradient>
          <filter id="mbcShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.18)" />
          </filter>
          <filter id="mbcLabelShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.12)" />
          </filter>
        </defs>

        {/* Chart background */}
        <rect x={PAD_LEFT} y={PAD_TOP} width={plotW} height={plotH} fill="#ffffff" />

        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={`ygrid-${tick}`}
            x1={PAD_LEFT} y1={toY(tick)}
            x2={PAD_LEFT + plotW} y2={toY(tick)}
            stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth={1}
          />
        ))}
        {monthTicks.map((mt) => (
          <line
            key={`xgrid-${mt.ts}`}
            x1={toX(mt.ts)} y1={PAD_TOP}
            x2={toX(mt.ts)} y2={PAD_TOP + plotH}
            stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth={1}
          />
        ))}

        {/* Y-axis label */}
        <text
          x={14}
          y={PAD_TOP + plotH / 2}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill="#374151"
          transform={`rotate(-90, 14, ${PAD_TOP + plotH / 2})`}
        >
          Ground Time / Man-Hours (Operational Risk)
        </text>

        {/* Y-axis ticks */}
        {yTicks.map((tick) => (
          <g key={`ytick-${tick}`}>
            <line x1={PAD_LEFT - 5} y1={toY(tick)} x2={PAD_LEFT} y2={toY(tick)} stroke="#94A3B8" strokeWidth={1} />
            <text x={PAD_LEFT - 8} y={toY(tick) + 4} textAnchor="end" fontSize={11} fill="#64748B">
              {tick}
            </text>
          </g>
        ))}

        {/* X-axis line */}
        <line x1={PAD_LEFT} y1={PAD_TOP + plotH} x2={PAD_LEFT + plotW} y2={PAD_TOP + plotH} stroke="#94A3B8" strokeWidth={1} />
        {/* Y-axis line */}
        <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + plotH} stroke="#94A3B8" strokeWidth={1} />

        {/* X-axis month ticks */}
        {monthTicks.map((mt) => (
          <g key={`xtick-${mt.ts}`}>
            <line x1={toX(mt.ts)} y1={PAD_TOP + plotH} x2={toX(mt.ts)} y2={PAD_TOP + plotH + 5} stroke="#94A3B8" strokeWidth={1} />
            <text x={toX(mt.ts)} y={PAD_TOP + plotH + 18} textAnchor="middle" fontSize={11} fill="#64748B">
              {mt.label}
            </text>
          </g>
        ))}

        {/* X-axis label */}
        <text
          x={PAD_LEFT + plotW / 2}
          y={svgH - 10}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          fill="#1F2937"
        >
          {new Date(minDate).getFullYear()} Forecast Timeline
        </text>

        {/* Connecting dashed line between bubble centers */}
        {bubbles.length > 1 && (
          <polyline
            points={bubbles.map((b) => `${b.cx},${b.cy}`).join(' ')}
            fill="none"
            stroke="#94A3B8"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            opacity={0.8}
          />
        )}

        {/* Bubbles + labels */}
        {bubbles.map((b) => {
          const labelX = b.cx - LBL_W / 2;
          const labelY = b.cy - b.r - LBL_PAD_Y - LBL_H;
          // Clamp label to top of SVG (plus small margin)
          const clampedLabelY = Math.max(2, labelY);
          const leaderFromY = clampedLabelY + LBL_H;
          const leaderToY = b.cy - b.r;

          return (
            <g key={b.id}>
              {/* Leader line: label box bottom → bubble top */}
              <line
                x1={b.cx}
                y1={leaderFromY}
                x2={b.cx}
                y2={leaderToY}
                stroke="#94A3B8"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.7}
              />

              {/* Bubble */}
              <circle
                cx={b.cx}
                cy={b.cy}
                r={b.r}
                fill={b.color.fill}
                stroke={b.color.stroke}
                strokeWidth={2}
                opacity={0.92}
                filter="url(#mbcShadow)"
              />

              {/* Label box */}
              <rect
                x={labelX}
                y={clampedLabelY}
                width={LBL_W}
                height={LBL_H}
                rx={4}
                fill="white"
                stroke="#CBD5E1"
                strokeWidth={1}
                filter="url(#mbcLabelShadow)"
              />
              {/* Task ID */}
              <text
                x={b.cx}
                y={clampedLabelY + 13}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill="#1F2937"
              >
                {b.shortName}
              </text>
              {/* USD Cost */}
              <text
                x={b.cx}
                y={clampedLabelY + 26}
                textAnchor="middle"
                fontSize={9.5}
                fill="#374151"
              >
                ${Math.round(b.cost).toLocaleString()}
              </text>
              {/* MH */}
              <text
                x={b.cx}
                y={clampedLabelY + 39}
                textAnchor="middle"
                fontSize={9.5}
                fill="#374151"
              >
                {b.mh.toFixed(1)} MH
              </text>
            </g>
          );
        })}

        {/* ── Color Scale Legend ── */}
        {/* Gradient bar */}
        <rect
          x={LEG_X}
          y={LEG_Y_TOP}
          width={LEG_BAR_W}
          height={LEG_BAR_H}
          fill="url(#mbcLegendGrad)"
          stroke="#CBD5E1"
          strokeWidth={1}
          rx={3}
        />
        {/* Tick marks + labels */}
        {legendTicks.map((v) => (
          <g key={`leg-${v}`}>
            <line
              x1={LEG_X + LEG_BAR_W}
              y1={legTickY(v)}
              x2={LEG_X + LEG_BAR_W + 4}
              y2={legTickY(v)}
              stroke="#94A3B8"
              strokeWidth={1}
            />
            <text
              x={LEG_X + LEG_BAR_W + 7}
              y={legTickY(v) + 4}
              fontSize={9.5}
              fill="#64748B"
            >
              {v.toLocaleString()}
            </text>
          </g>
        ))}
        {/* Legend axis label */}
        <text
          x={LEG_X + LEG_BAR_W + 46}
          y={LEG_Y_TOP + LEG_BAR_H / 2}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill="#374151"
          transform={`rotate(90, ${LEG_X + LEG_BAR_W + 46}, ${LEG_Y_TOP + LEG_BAR_H / 2})`}
        >
          Financial Intensity (Total Value in USD)
        </text>
      </svg>
    </div>
  );
};

const StatBadge = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] uppercase tracking-widest text-white/50 font-medium">
      {label}
    </span>
    <span className="text-base font-semibold text-white leading-none">{value ?? "—"}</span>
  </div>
);

const Dashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedChart, setSelectedChart] = useState("budget_forecast");
  const [timeView, setTimeView] = useState("12");
  const [utilizationSettings, setUtilizationSettings] = useState({ dailyFlightHours: 8 });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching data for aircraft:", id);
        const [ac, allServices, allForecasts] = await Promise.all([
          api.aircrafts.get(id),
          api.services.list(),
          api.forecast.getForAircraft(id),
        ]);

        console.log("Aircraft:", ac);
        console.log("Services count:", allServices.length);
        console.log("Forecasts count:", allForecasts.length);

        setAircraft(ac);

        // Get average hours and cycles from forecast data or use defaults
        const withAvg = (allForecasts as ForecastRecord[]).filter((f) => f.avg_hours);
        const avgHours = withAvg.length > 0 ? (withAvg[withAvg.length - 1].avg_hours ?? 10) : 10;
        const avgCycles = withAvg.length > 0 ? (withAvg[withAvg.length - 1].avg_cycles ?? 2) : 2;

        console.log("Building chart data...");
        // Build chart data with utilization settings
        const data = buildChartData(ac, allServices, allForecasts, avgHours, avgCycles, utilizationSettings.dailyFlightHours);
        console.log("Chart data built:", data);
        setChartData(data);
      } catch (error) {
        console.error("Error loading data:", error);
        setError(error instanceof Error ? error.message : "Failed to load data");
        // Set empty chart data to exit loading state
        setChartData({
          monthlyData: [],
          bubbleData: [],
          majorOverhauls: [],
          remainingLifeData: [],
          total12MLiability: 0,
          totalComponentsCost: 0,
          totalServicesCost: 0,
          nextMajorOverhaul: null,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, utilizationSettings.dailyFlightHours]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-red-600">Error: {error}</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">No data available</div>
      </div>
    );
  }

  const filterMonths = parseInt(timeView, 10);
  const displayForecastData = chartData.monthlyData.slice(0, filterMonths);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md text-sm">
          <p className="font-semibold mb-2">{label || payload[0]?.payload?.id}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Man-Hours' ? entry.value : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-0 pb-12 bg-slate-50 min-h-screen">
      <div className="p-6 pb-0">
        <p className="text-xs uppercase tracking-widest text-black/90 font-bold mb-0.5">
          Aircraft Dashboard Visualization
        </p>
        <div className="rounded-xl bg-[#556ee6] px-6 py-5 mb-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (id) {
                    navigate(-1);
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60 font-medium mb-0.5">Aircraft Model</p>
                <h1 className="text-lg font-bold text-white leading-none">
                  {loading ? "Loading…" : (aircraft?.model ?? "—")}
                </h1>
              </div>
            </div>

            {!loading && aircraft && (
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 sm:justify-end">
                <StatBadge label="Aircraft Reg ID" value={aircraft.registration_number} />
                <div className="hidden sm:block w-px h-8 bg-white/20" />
                <StatBadge label="Aircraft FH" value={decimalToHoursMinutes(aircraft.flight_hours)} />
                <div className="hidden sm:block w-px h-8 bg-white/20" />
                <StatBadge label="Aircraft FC" value={aircraft.flight_cycles} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Financial & Maintenance Forecasts</h2>
          <Select value={selectedChart} onValueChange={setSelectedChart}>
            <SelectTrigger className="w-[320px] bg-white text-sm">
              <SelectValue placeholder="Select Data View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="budget_forecast">Budget Forecast</SelectItem>
              <SelectItem value="annual_forecast">Annual Maintenance Financial Forecast</SelectItem>
              <SelectItem value="portfolio_risk">Maintenance Portfolio: Cost vs. Downtime</SelectItem>
              {/* <SelectItem value="strategic_overview">Strategic Overhaul (2026 vs 2033)</SelectItem> */}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Chart Area */}
        <div className="mb-6">
          {selectedChart === "budget_forecast" && (
            <Card className="bg-white shadow-sm rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base text-slate-800">Budget Forecast (Component vs Service)</CardTitle>
                  <CardDescription className="text-xs">Monthly breakdown of scheduled maintenance</CardDescription>
                </div>
                <Tabs value={timeView} onValueChange={setTimeView} className="w-[180px]">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="3" className="text-xs">3M</TabsTrigger>
                    <TabsTrigger value="6" className="text-xs">6M</TabsTrigger>
                    <TabsTrigger value="12" className="text-xs">12M</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayForecastData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} tick={{ fontSize: 12 }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="compCost" name="Component Cost" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="serviceCost" name="Service Cost" stackId="a" fill="#F97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {selectedChart === "annual_forecast" && (
            <Card className="bg-white shadow-sm rounded-lg">
              <CardHeader>
                <CardTitle className="text-base text-slate-800">Annual Maintenance Financial Forecast</CardTitle>
                <CardDescription className="text-xs">Monthly expense vs Total Accrued Cost</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={displayForecastData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} tick={{ fontSize: 12 }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="total" name="Monthly Expense" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={40} />
                    <Line yAxisId="right" type="stepAfter" dataKey="cumulative" name="Cumulative Spend" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {selectedChart === "portfolio_risk" && (
            <Card className="bg-white shadow-sm rounded-lg">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm text-slate-900 font-bold uppercase tracking-wide">
                      {aircraft?.registration_number || aircraft?.model || ''} MAINTENANCE PORTFOLIO: COST vs. DOWNTIME RISK
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">(Bubble Size = Total Financial Outlay)</CardDescription>
                  </div>
                  {/* <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Daily Flight Hours:</label>
                    <input
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={utilizationSettings.dailyFlightHours}
                      onChange={(e) => setUtilizationSettings({ dailyFlightHours: parseFloat(e.target.value) || 8 })}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div> */}
                </div>
              </CardHeader>
              <CardContent className="h-[560px] relative pr-4">
                <MaintenanceBubbleChart
                  bubbleData={chartData.bubbleData}
                  aircraft={aircraft}
                />
              </CardContent>
            </Card>
          )}

          {/* Strategic Overhaul Timeline - COMMENTED OUT */}
          {/*
          {selectedChart === "strategic_overview" && (
            <Card className="bg-white shadow-sm rounded-lg">
              <CardHeader>
                <CardTitle className="text-base text-slate-800">Strategic Overhaul Timeline</CardTitle>
                <CardDescription className="text-xs">Major overhaul tasks perspective</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" dataKey="year" name="Year" domain={[new Date().getFullYear(), new Date().getFullYear() + 10]} tickCount={5} tick={{ fontSize: 12 }} />
                    <YAxis type="number" dataKey="mh" name="Man-Hours" unit=" MH" tick={{ fontSize: 12 }} />
                    <ZAxis type="number" dataKey="cost" range={[1000, 4000]} name="Cost" />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Major Overhaul" data={chartData.majorOverhauls} fill="#8B5CF6" opacity={0.8} />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          */}
        </div>

        {/* Data Table */}
        <Card className="bg-white shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">Remaining Life & Resource Forecast</CardTitle>
            <CardDescription className="text-xs">List of scheduled maintenance tasks for the selected aircraft.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-xs text-slate-500 uppercase">Task ID</TableHead>
                    <TableHead className="font-semibold text-xs text-slate-500 uppercase">Remaining Life</TableHead>
                    <TableHead className="font-semibold text-xs text-slate-500 uppercase">Next Due Date</TableHead>
                    <TableHead className="font-semibold text-xs text-slate-500 uppercase text-right">Man-hours</TableHead>
                    <TableHead className="font-semibold text-xs text-slate-500 uppercase text-right">Comp. Value (USD)</TableHead>
                    <TableHead className="font-semibold text-xs text-slate-500 uppercase text-right">Service Value (USD)</TableHead>
                    <TableHead className="font-semibold text-xs text-slate-500 uppercase text-right">Total Value (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.remainingLifeData.length > 0 ? (
                    chartData.remainingLifeData.map((row: any, index: number) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium text-sm">
                          {row.id}
                          {index === 0 && <Badge variant="destructive" className="ml-2 text-[10px] uppercase">Next Due</Badge>}
                        </TableCell>
                        <TableCell className="text-sm">{row.remaining}</TableCell>
                        <TableCell className="text-sm">{row.date}</TableCell>
                        <TableCell className="text-right text-sm">{row.mh.toFixed(1)}</TableCell>
                        <TableCell className="text-right text-sm">{row.compValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right text-sm">{row.servValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{row.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-slate-500 py-8">
                        No maintenance tasks scheduled for this aircraft.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
