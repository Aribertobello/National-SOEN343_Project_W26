import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { useAnalytics } from "../../hooks/useAnalytics";

const PALETTE = ["#B89CD3", "#9A77C0", "#7F5AA8", "#6A4690", "#56337A", "#432664"];
const AREA_COLOR = "#B89CD3";
const GRID_COLOR = "rgba(255, 255, 255, 0.12)";
const AXIS_COLOR = "rgba(255, 255, 255, 0.65)";
const AXIS_SUBTLE = "rgba(255, 255, 255, 0.5)";

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "-";
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className="text-3xl font-bold tabular-nums"
        style={{ color: accent ?? "#B89CD3" }}
      >
        {fmt(Number(value))}
      </p>
      {sub && (
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </h2>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <p className="text-sm font-semibold text-card-foreground mb-4">
        {title}
      </p>
      {children}
    </div>
  );
}


function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded-xl ${className}`} />
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-52" />
    </div>
  );
}


function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow text-sm">
      <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-card-foreground">
        {payload[0].value} trips
      </p>
    </div>
  );
}


const DAY_OPTIONS = [7, 14, 30, 90] as const;


export default function AnalyticsDashboard() {
  const [days, setDays] = useState<number>(30);
  const [cityFilter, setCityFilter] = useState("");
  const { data, loading, error, refresh } = useAnalytics({
    days,
    city: cityFilter || undefined,
  });

  // derive all known cities from usage_per_city for the filter dropdown
  const cities = data?.usage_per_city.map((c) => c.city) ?? [];

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <p className="text-base">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const {
    summary,
    most_used_vehicle_type,
    usage_per_city,
    daily_trips,
    vehicle_type_breakdown,
  } = data;

  const dailyChartData = daily_trips.map((d) => ({
    ...d,
    label: shortDate(d.date),
  }));

  return (
    <div className="flex flex-col gap-8 p-6 max-w-6xl mx-auto">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Mobility stats for your vehicles
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* city filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="text-sm rounded-xl border border-border bg-card text-foreground px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* day window pills */}
          <div className="flex rounded-xl overflow-hidden border border-border text-sm">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 transition ${
                  days === d
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          <button
            onClick={refresh}
            className="text-sm px-3 py-1.5 rounded-xl border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* stat cards */}
      <section>
        <SectionHeading>Overview</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Active rentals"
            value={summary.active_rentals}
            sub="Right now"
            accent="#B89CD3"
          />
          <StatCard
            label="Available vehicles"
            value={summary.available_vehicles}
            sub="Ready to rent"
            accent="#9A77C0"
          />
          <StatCard
            label={`Trips (${summary.days_window}d)`}
            value={summary.trips_last_n_days}
            sub={`Last ${summary.days_window} days`}
            accent="#7F5AA8"
          />
          <StatCard
            label="Total trips"
            value={summary.total_trips}
            sub={`Most used: ${capitalize(most_used_vehicle_type ?? "")}`}
            accent="#6A4690"
          />
        </div>
      </section>

      {/* charts row */}
      <section>
        <SectionHeading>Trends & breakdown</SectionHeading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* daily trip area chart */}
          <ChartCard title={`Daily trips - last ${days} days`}>
            {dailyChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">
                No trip data in this period
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={dailyChartData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
                >
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={AREA_COLOR} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={AREA_COLOR} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={GRID_COLOR}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: AXIS_COLOR }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: AXIS_COLOR }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="trips"
                    stroke={AREA_COLOR}
                    strokeWidth={2}
                    fill="url(#areaGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: AREA_COLOR }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* vehicle type pie */}
          <ChartCard title="Fleet composition">
            {vehicle_type_breakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">
                No vehicle data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={vehicle_type_breakdown}
                    dataKey="count"
                    nameKey="vehicle_type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={44}
                    paddingAngle={3}
                  >
                    {vehicle_type_breakdown.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, capitalize(String(name))]} />
                  <Legend
                    formatter={(value) => capitalize(value)}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, color: "rgba(255, 255, 255, 0.7)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </section>

      {/* city usage bar chart  */}
      <section>
        <SectionHeading>Usage per city</SectionHeading>
        <ChartCard title="Trips by city">
          {usage_per_city.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              No city data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={usage_per_city}
                layout="vertical"
                margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
                barSize={16}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={GRID_COLOR}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="city"
                  tick={{ fontSize: 12, fill: AXIS_SUBTLE }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(value) => [value, "Trips"]}
                  cursor={{ fill: "rgba(184, 156, 211, 0.16)" }}
                />
                <Bar dataKey="trips" radius={[0, 6, 6, 0]}>
                  {usage_per_city.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>
    </div>
  );
}
