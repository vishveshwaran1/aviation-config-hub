import React, { useState, useEffect } from "react";
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
  ScatterChart,
  Scatter,
  ZAxis,
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
  quotation_price: number | null;
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

    const componentValue = service.assigned_component_id ? (service.estimated_price ?? 0) : 0;
    const serviceValue = service.quotation_price ?? service.estimated_price ?? 0;
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
    if (value >= 1000000) return `MYR ${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `MYR ${(value / 1000).toFixed(1)}k`;
    return `MYR ${value}`;
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
                    navigate(`/aircraft/${id}`);
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
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `MYR ${val}`} tick={{ fontSize: 12 }} />
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
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(val) => `MYR ${val}`} tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={(val) => `MYR ${val}`} tick={{ fontSize: 12 }} />
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
                    <CardTitle className="text-base text-slate-900 font-bold">
                      {aircraft?.registration_number || aircraft?.model || ''} MAINTENANCE PORTFOLIO: COST vs. DOWNTIME RISK
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600">(Bubble Size = Total Financial Outlay)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[550px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 120, bottom: 70, left: 90 }}>
                    <defs>
                      {/* Gradient definition for the legend */}
                      <linearGradient id="costGradient" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#FFFBEB" /> {/* Cream */}
                        <stop offset="20%" stopColor="#FEF3C7" /> {/* Light yellow */}
                        <stop offset="40%" stopColor="#FDE68A" /> {/* Beige */}
                        <stop offset="60%" stopColor="#FB923C" /> {/* Orange */}
                        <stop offset="80%" stopColor="#F87171" /> {/* Coral */}
                        <stop offset="100%" stopColor="#881337" /> {/* Maroon */}
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />

                    <XAxis
                      type="number"
                      dataKey="dueDate"
                      name="Due Date"
                      domain={['dataMin', 'dataMax']}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(timestamp) => {
                        const date = new Date(timestamp);
                        return format(date, "MMM");
                      }}
                      label={{
                        value: '2026 Forecast Timeline',
                        position: 'insideBottom',
                        offset: -10,
                        style: { fontSize: 12, fontWeight: 600, fill: '#1F2937' }
                      }}
                      height={60}
                    />

                    <YAxis
                      yAxisId="left"
                      type="number"
                      dataKey="mh"
                      name="Man-Hours"
                      domain={[0, 16]}
                      ticks={[0, 2, 4, 6, 8, 10, 12, 14, 16]}
                      tick={{ fontSize: 11 }}
                      label={{
                        value: 'Ground Time / Man-hours (Operational Risk)',
                        angle: -90,
                        position: 'insideLeft',
                        offset: 5,
                        style: { fontSize: 12, fontWeight: 600, textAnchor: 'middle', fill: '#1F2937' }
                      }}
                      width={90}
                    />

                    <ZAxis type="number" dataKey="cost" range={[1000, 4500]} name="Cost" />

                    <RechartsTooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border border-slate-300 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.15)] text-center text-[11px] font-medium text-slate-800 leading-tight flex flex-col min-w-[80px]">
                              <span>{data.shortName}</span>
                              <span>MYR {Math.round(data.cost).toLocaleString()}</span>
                              <span>{data.mh.toFixed(1)} MH</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    {/* Connecting dotted lines between bubbles */}
                    {chartData.bubbleData.length > 1 && chartData.bubbleData.map((bubble: any, i: number) => {
                      if (i === chartData.bubbleData.length - 1) return null;
                      const nextBubble = chartData.bubbleData[i + 1];

                      return (
                        <line
                          key={`line-${i}`}
                          x1={bubble.dueDate}
                          y1={bubble.mh}
                          x2={nextBubble.dueDate}
                          y2={nextBubble.mh}
                          stroke="#CBD5E1"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          opacity={0.8}
                        />
                      );
                    })}

                    <Scatter
                      yAxisId="left"
                      name="Maintenance Tasks"
                      data={chartData.bubbleData}
                      shape={(props: any) => {
                        const { cx, cy, payload } = props;
                        const cost = payload.cost;

                        let fillColor = '#FFFBEB'; 
                        let strokeColor = '#FEF3C7';

                        if (cost > 3000) {
                          // High Cost: Coral/Maroon
                          fillColor = '#E15A6B'; 
                          strokeColor = '#902638';
                        } else if (cost >= 1500) {
                          // Mid Cost: Beige/Tan/Orange
                          fillColor = '#EEDB92'; 
                          strokeColor = '#A18320';
                        } else {
                          // Low Cost: Cream/Light yellow
                          fillColor = '#FAF3D7'; 
                          strokeColor = '#C1B68A';
                        }

                        const radius = props.node.z / 65; // Scale radius appropriately
                        
                        return (
                          <g className="bubble-group cursor-pointer">
                            {/* Bubble circle with shadow */}
                            <circle
                              cx={cx}
                              cy={cy}
                              r={radius}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={2}
                              opacity={0.9}
                              style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.15))" }}
                            />
                            {/* Hover info is handled by Recharts Tooltip, but we add a subtle semi-transparent label inside for immediate context if needed, wait no, they asked for white label on hover. We'll rely on the Tooltip for the exact white block! */}
                          </g>
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>

                {/* Right Y-Axis Color Gradient Legend */}
                <div className="absolute right-0 top-16 bottom-16 flex items-center pr-4">
                  <div className="h-[280px] flex items-center relative gap-2">
                    <div className="flex flex-col items-end text-[11px] text-gray-600 justify-between h-full py-1 pr-1 font-medium">
                      <span>4500</span>
                      <span>4000</span>
                      <span>3500</span>
                      <span>3000</span>
                      <span>2500</span>
                      <span>2000</span>
                      <span>1500</span>
                      <span>1000</span>
                    </div>
                    <svg width="18" height="280">
                      <defs>
                        <linearGradient id="legendGradient" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#FAF3D7" />
                          <stop offset="20%" stopColor="#FAF3D7" />
                          <stop offset="40%" stopColor="#EEDB92" />
                          <stop offset="60%" stopColor="#EEDB92" />
                          <stop offset="80%" stopColor="#E15A6B" />
                          <stop offset="100%" stopColor="#E15A6B" />
                        </linearGradient>
                      </defs>
                      <rect x="0" y="0" width="18" height="280" fill="url(#legendGradient)" stroke="#CBD5E1" strokeWidth="1" rx="2" />
                    </svg>
                    <div 
                      className="text-[11px] font-bold text-gray-600 tracking-wide ml-1" 
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                      Financial Intensity (Total Value in MYR)
                    </div>
                  </div>
                </div>
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
                    <TableHead className="font-semibold text-xs text-slate-500 uppercase text-right">Comp. Value (MYR)</TableHead>
                    <TableHead className="font-semibold text-xs text-slate-500 uppercase text-right">Service Value (MYR)</TableHead>
                    <TableHead className="font-semibold text-xs text-slate-500 uppercase text-right">Total Value (MYR)</TableHead>
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
