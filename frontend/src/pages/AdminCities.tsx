import { useEffect, useState } from "react";
import { ApiClient } from "@/utils/ApiClient";

interface CityStats {
  city: string;
  total_parking_spots: number;
  reserved_parking_spots: number;
  parking_utilization_pct: number;
  rentals: number;
  trips: number;
}

type LoadState = "loading" | "error" | "ready";

const COLOR_RENTALS  = "#6366f1";
const COLOR_TRIPS    = "#10b981"; 
const COLOR_PARKING  = "#f59e0b"; 
const COLOR_PARKING_BG = "#f59e0b22";


interface GroupedBarChartProps {
  data: CityStats[];
  height?: number;
}

function GroupedBarChart({ data, height = 280 }: GroupedBarChartProps) {
  const paddingLeft  = 44;
  const paddingRight = 16;
  const paddingTop   = 16;
  const paddingBottom = 52;

  const maxVal = Math.max(...data.flatMap((d) => [d.rentals, d.trips]), 1);

  // Round up to a "nice" ceiling for the y-axis
  const magnitude  = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const niceCeil   = Math.ceil(maxVal / magnitude) * magnitude;
  const yTickCount = 4;
  const yTicks     = Array.from({ length: yTickCount + 1 }, (_, i) =>
    Math.round((niceCeil / yTickCount) * i)
  );

  const chartW = 600;
  const chartH = height;
  const innerW = chartW - paddingLeft - paddingRight;
  const innerH = chartH - paddingTop - paddingBottom;

  const groupW    = innerW / data.length;
  const barW      = Math.min(groupW * 0.28, 32);
  const groupGap  = (groupW - barW * 2) / 2;

  const scaleY = (v: number) => innerH - (v / niceCeil) * innerH;

  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm">Rentals &amp; Trips per City</h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLOR_RENTALS }} />
            Rentals
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLOR_TRIPS }} />
            Trips
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        width="100%"
        className="overflow-visible"
        aria-label="Grouped bar chart: rentals and trips per city"
      >
        {/* Y-axis grid lines + labels */}
        {yTicks.map((tick) => {
          const y = paddingTop + scaleY(tick);
          return (
            <g key={tick}>
              <line
                x1={paddingLeft} y1={y}
                x2={paddingLeft + innerW} y2={y}
                stroke="currentColor" strokeOpacity={0.07} strokeWidth={1}
              />
              <text
                x={paddingLeft - 6} y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="currentColor"
                fillOpacity={0.45}
              >
                {tick.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const groupX = paddingLeft + i * groupW + groupGap;

          const rentalH = Math.max((d.rentals / niceCeil) * innerH, 2);
          const tripH   = Math.max((d.trips   / niceCeil) * innerH, 2);

          const rentalY = paddingTop + innerH - rentalH;
          const tripY   = paddingTop + innerH - tripH;

          const labelX = paddingLeft + i * groupW + groupW / 2;
          const labelY = paddingTop + innerH + 18;

          return (
            <g key={d.city}>
              {/* Rental bar */}
              <rect
                x={groupX}
                y={rentalY}
                width={barW}
                height={rentalH}
                fill={COLOR_RENTALS}
                rx={3}
                className="transition-opacity duration-150 hover:opacity-75"
              />
              {/* Trip bar */}
              <rect
                x={groupX + barW}
                y={tripY}
                width={barW}
                height={tripH}
                fill={COLOR_TRIPS}
                rx={3}
                className="transition-opacity duration-150 hover:opacity-75"
              />

              {/* Value labels (only if bar is tall enough) */}
              {rentalH > 18 && (
                <text x={groupX + barW / 2} y={rentalY - 4} textAnchor="middle" fontSize={9} fill={COLOR_RENTALS} fontWeight={600}>
                  {d.rentals}
                </text>
              )}
              {tripH > 18 && (
                <text x={groupX + barW + barW / 2} y={tripY - 4} textAnchor="middle" fontSize={9} fill={COLOR_TRIPS} fontWeight={600}>
                  {d.trips}
                </text>
              )}

              {/* City label */}
              <text
                x={labelX} y={labelY}
                textAnchor="middle"
                fontSize={11}
                fill="currentColor"
                fillOpacity={0.7}
              >
                {d.city.length > 12 ? d.city.slice(0, 11) + "…" : d.city}
              </text>
            </g>
          );
        })}

        {/* Y-axis line */}
        <line
          x1={paddingLeft} y1={paddingTop}
          x2={paddingLeft} y2={paddingTop + innerH}
          stroke="currentColor" strokeOpacity={0.15} strokeWidth={1}
        />

        {/* X-axis line */}
        <line
          x1={paddingLeft} y1={paddingTop + innerH}
          x2={paddingLeft + innerW} y2={paddingTop + innerH}
          stroke="currentColor" strokeOpacity={0.15} strokeWidth={1}
        />
      </svg>
    </div>
  );
}


interface ParkingUtilizationProps {
  data: CityStats[];
}

function ParkingUtilization({ data }: ParkingUtilizationProps) {
  return (
    <div className="bg-card border rounded-xl p-5">
      <h2 className="font-semibold text-sm mb-5">Parking Utilization by City</h2>

      {data.length === 0 && (
        <p className="text-sm text-muted-foreground">No city data available.</p>
      )}

      <div className="space-y-5">
        {data.map((d) => {
          const pct = Math.min(d.parking_utilization_pct, 100);

          // Colour shifts: green → amber → red
          const barColor =
            pct >= 85 ? "#ef4444"
            : pct >= 60 ? COLOR_PARKING
            : COLOR_TRIPS;

          return (
            <div key={d.city}>
              {/* Label row */}
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-medium">{d.city}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {d.reserved_parking_spots} / {d.total_parking_spots} spots
                  <span className="ml-2 font-semibold" style={{ color: barColor }}>
                    {pct.toFixed(1)}%
                  </span>
                </span>
              </div>

              {/* Track */}
              <div
                className="w-full rounded-full h-3 overflow-hidden"
                style={{ background: COLOR_PARKING_BG }}
              >
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLOR_TRIPS }} />
          &lt;60% — Low
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLOR_PARKING }} />
          60–84% — Moderate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#ef4444" }} />
          ≥85% — High
        </span>
      </div>
    </div>
  );
}


interface SummaryCardsProps {
  data: CityStats[];
}

function SummaryCards({ data }: SummaryCardsProps) {
  const totalRentals  = data.reduce((s, d) => s + d.rentals, 0);
  const totalTrips    = data.reduce((s, d) => s + d.trips, 0);
  const totalSpots    = data.reduce((s, d) => s + d.total_parking_spots, 0);
  const totalReserved = data.reduce((s, d) => s + d.reserved_parking_spots, 0);
  const avgUtil       = totalSpots > 0
    ? ((totalReserved / totalSpots) * 100).toFixed(1)
    : "—";

  const cards = [
    { label: "Cities tracked",      value: data.length.toLocaleString() },
    { label: "Total rentals",        value: totalRentals.toLocaleString()  },
    { label: "Total trips",          value: totalTrips.toLocaleString()    },
    { label: "Avg parking util.",    value: `${avgUtil}%`                  },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-card border rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold">{c.value}</div>
          <div className="text-sm text-muted-foreground">{c.label}</div>
        </div>
      ))}
    </div>
  );
}


export default function AdminCities() {
  const api = ApiClient.getInstance();

  const [data,      setData]      = useState<CityStats[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMsg,  setErrorMsg]  = useState<string>("");

  useEffect(() => {
    async function load() {
      setLoadState("loading");
      try {
        const result = await api.get<CityStats[]>("/api/admin/cities");
        setData(result);
        setLoadState("ready");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Unexpected error");
        setLoadState("error");
      }
    }
    load();
  }, []);


  if (loadState === "loading") {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <span className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full inline-block" />
        <p>Loading city data…</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-5 max-w-md">
          <h2 className="font-semibold text-destructive mb-1">Failed to load</h2>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <button
            className="mt-4 text-sm underline"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">City Analytics</h1>
        <p className="text-muted-foreground">
          Parking utilization, rentals and trips — broken down by city
        </p>
      </div>

      {/* Summary cards */}
      <SummaryCards data={data} />

      {/* Charts */}
      {data.length === 0 ? (
        <div className="bg-card border rounded-xl p-10 text-center text-muted-foreground">
          No city data found. Add cities and activity to see charts here.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grouped bar chart: rentals & trips */}
          <GroupedBarChart data={data} />

          {/* Parking utilization horizontal bars */}
          <ParkingUtilization data={data} />

          {/* Raw data table */}
          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold text-sm mb-4">City breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="pb-2 pr-4 font-medium">City</th>
                    <th className="pb-2 pr-4 font-medium text-right">Rentals</th>
                    <th className="pb-2 pr-4 font-medium text-right">Trips</th>
                    <th className="pb-2 pr-4 font-medium text-right">Parking spots</th>
                    <th className="pb-2 pr-4 font-medium text-right">Reserved</th>
                    <th className="pb-2 font-medium text-right">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((d) => (
                    <tr key={d.city} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4 font-medium">{d.city}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">{d.rentals.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">{d.trips.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">{d.total_parking_spots.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">{d.reserved_parking_spots.toLocaleString()}</td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span
                          className="font-semibold"
                          style={{
                            color:
                              d.parking_utilization_pct >= 85 ? "#ef4444"
                              : d.parking_utilization_pct >= 60 ? COLOR_PARKING
                              : COLOR_TRIPS,
                          }}
                        >
                          {d.parking_utilization_pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}