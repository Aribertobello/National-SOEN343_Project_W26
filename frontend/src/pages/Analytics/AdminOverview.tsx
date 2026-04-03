import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { ApiClient } from "@/utils/ApiClient";
import { parseUser } from "@/models/user";
import type { User } from "@/models/user";
import { Role } from "@/models/user";
import type { Vehicle, VehicleType } from "@/models/vehicle";

interface AdminOverview {
  total_customers: number;
  total_operators: number;
  active_rentals: number;
  completed_trips: number;

  customers: {
    id: number;
    email: string;
    name: string;
  }[];

  operators: {
    id: number;
    email: string;
    name: string;
  }[];

  active_rentals_list: {
    vehicle: Vehicle;
    user: User;
    start_date_time: string;
    end_date_time: string;
  }[];

  completed_trips_list: {
    vehicle: Vehicle;
    user: User;
    start_time: string;
    end_time: string;
  }[];
}

type LoadState = "loading" | "error" | "ready";
type TimeRange = "week" | "month" | "all";

const USER_LIMIT_OPTIONS = [10, 25, 50, 100] as const;
type UserLimit = (typeof USER_LIMIT_OPTIONS)[number];

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "all", label: "All time" },
];

const selectClass =
  "text-sm rounded-lg border bg-card px-3 py-1.5 pr-8 shadow-sm " +
  "focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer " +
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")] " +
  "bg-no-repeat bg-[center_right_0.6rem]";

interface SliceData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  slices: SliceData[];
  size?: number;
  thickness?: number;
}

function DonutChart({
  title,
  slices,
  size = 160,
  thickness = 38,
}: DonutChartProps) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  const outerRadius = size / 2 - 4;
  const innerRadius = outerRadius - thickness;

  const chartData =
    total === 0
      ? [{ label: "No data", value: 1, color: "hsl(var(--border))" }]
      : slices;

  return (
    <div className="bg-card border rounded-xl p-5 flex flex-col items-center gap-4">
      <h2 className="font-semibold text-sm text-center">{title}</h2>

      <div className="relative" style={{ width: size, height: size }}>
        <PieChart width={size} height={size}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            cx={size / 2}
            cy={size / 2}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
          >
            {chartData.map((slice, i) => (
              <Cell key={i} fill={slice.color} className="outline-none" />
            ))}
          </Pie>
          {total > 0 && (
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} (${((value / total) * 100).toFixed(0)}%)`,
                name,
              ]}
              contentStyle={{
                fontSize: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
              }}
            />
          )}
        </PieChart>

        {/* Centre label */}
        <div
          className="absolute pointer-events-none flex flex-col items-center justify-center"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-35%, -35%)",
          }}
        >
          <span className="text-xl font-bold leading-none">
            {total.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">total</span>
        </div>
      </div>

      {/* Legend */}
      <ul className="w-full space-y-1.5">
        {slices.map((slice) => (
          <li
            key={slice.label}
            className="flex items-center justify-between text-xs"
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              {slice.label}
            </span>
            <span className="font-medium tabular-nums">
              {slice.value}
              {total > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({((slice.value / total) * 100).toFixed(0)}%)
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const USER_ROLE_COLORS = {
  Customers: "#6366f1",
  Operators: "#f59e0b",
};

const VEHICLE_TYPE_COLORS: Record<VehicleType, string> = {
  car: "#3b82f6",
  bike: "#10b981",
  escooter: "#f97316",
};

function countVehicleTypes(vehicles: Vehicle[]): SliceData[] {
  const counts: Record<VehicleType, number> = { car: 0, bike: 0, escooter: 0 };
  vehicles.forEach((v) => {
    if (v.type in counts) counts[v.type]++;
  });
  return (Object.entries(counts) as [VehicleType, number][]).map(
    ([type, value]) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value,
      color: VEHICLE_TYPE_COLORS[type],
    }),
  );
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const api = ApiClient.getInstance();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [userLimit, setUserLimit] = useState<UserLimit>(50);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  useEffect(() => {
    async function load() {
      setLoadState("loading");
      try {
        const params = new URLSearchParams({
          user_limit: String(userLimit),
          time_range: timeRange,
        });

        const data = await api.get<AdminOverview>(
          `/api/admin/overview?${params}`,
        );
        setOverview(data);
        setLoadState("ready");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Unexpected error");
        setLoadState("error");
      }
    }

    load();
  }, [userLimit, timeRange]);

  if (loadState === "error") {
    return (
      <div className="admin-overview__error">
        <h2>Something went wrong</h2>
        <p>{errorMsg}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const metrics = overview
    ? [
        { label: "Total Customers", value: overview.total_customers },
        { label: "Total Operators", value: overview.total_operators },
        { label: "Active Rentals", value: overview.active_rentals },
        { label: "Completed Trips", value: overview.completed_trips },
      ]
    : [];

  const userRoleSlices: SliceData[] = overview
    ? [
        {
          label: "Customers",
          value: overview.total_customers,
          color: USER_ROLE_COLORS.Customers,
        },
        {
          label: "Operators",
          value: overview.total_operators,
          color: USER_ROLE_COLORS.Operators,
        },
      ]
    : [];

  const activeVehicleSlices = overview
    ? countVehicleTypes(overview.active_rentals_list.map((r) => r.vehicle))
    : [];
  const completedVehicleSlices = overview
    ? countVehicleTypes(overview.completed_trips_list.map((t) => t.vehicle))
    : [];

  const isLoading = loadState === "loading";

  return (
    <div className="admin-overview p-6 space-y-6">
      {/*Header and filters*/}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Overview</h1>
          <p className="text-muted-foreground">Overall System Performance</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Show up to
            <select
              className={selectClass}
              value={userLimit}
              onChange={(e) =>
                setUserLimit(Number(e.target.value) as UserLimit)
              }
            >
              {USER_LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} users
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Rentals & trips
            <select
              className={selectClass}
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            >
              {TIME_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {isLoading && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Refreshing…
            </span>
          )}
        </div>
      </div>

      {/* Metric boxes */}
      <div
        className={`grid grid-cols-4 gap-4 transition-opacity duration-200 ${isLoading ? "opacity-50" : ""}`}
      >
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-card border rounded-xl p-4 shadow-sm"
          >
            <div className="text-2xl font-bold">
              {metric.value.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* List sections*/}
      <div
        className={`max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-200 ${isLoading ? "opacity-50" : ""}`}
      >
        <div className="bg-card border rounded-xl p-4">
          <h2 className="font-semibold mb-4">
            Customers
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (up to {userLimit})
            </span>
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {overview?.customers.map((user) => (
              <div
                key={user.id}
                className="border rounded-lg p-3 text-sm shadow-sm"
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-muted-foreground">{user.email}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ID: {user.id}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <h2 className="font-semibold mb-4">
            Operators
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (up to {userLimit})
            </span>
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {overview?.operators.map((user) => (
              <div
                key={user.id}
                className="border rounded-lg p-3 text-sm shadow-sm"
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-muted-foreground">{user.email}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ID: {user.id}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <h2 className="font-semibold mb-4">
            Active Rentals
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({TIME_RANGE_OPTIONS.find((o) => o.value === timeRange)?.label})
            </span>
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {overview?.active_rentals_list.map((rental, i) => (
              <div key={i} className="border rounded-lg p-3 text-sm shadow-sm">
                <div className="font-medium">Rental</div>
                <div className="text-muted-foreground">
                  User ID: {rental.user.id}
                </div>
                <div className="text-muted-foreground">
                  Vehicle ID: {rental.vehicle.id}
                </div>
                <div className="text-xs mt-1">
                  Start: {new Date(rental.start_date_time).toLocaleString()}
                </div>
                <div className="text-xs">
                  End: {new Date(rental.end_date_time).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <h2 className="font-semibold mb-4">
            Completed Trips
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({TIME_RANGE_OPTIONS.find((o) => o.value === timeRange)?.label})
            </span>
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {overview?.completed_trips_list.map((trip, i) => (
              <div key={i} className="border rounded-lg p-3 text-sm shadow-sm">
                <div className="font-medium">Trip</div>
                <div className="text-muted-foreground">
                  User ID: {trip.user.id}
                </div>
                <div className="text-muted-foreground">
                  Vehicle ID: {trip.vehicle.id}
                </div>
                <div className="text-xs mt-1">
                  Start: {new Date(trip.start_time).toLocaleString()}
                </div>
                <div className="text-xs">
                  End: {new Date(trip.end_time).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Donut charts */}
      <div
        className={`max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity duration-200 ${isLoading ? "opacity-50" : ""}`}
      >
        <DonutChart title="Customers vs Operators" slices={userRoleSlices} />
        <DonutChart
          title="Active Rentals by Vehicle Type"
          slices={activeVehicleSlices}
        />
        <DonutChart
          title="Completed Trips by Vehicle Type"
          slices={completedVehicleSlices}
        />
      </div>
    </div>
  );
}
