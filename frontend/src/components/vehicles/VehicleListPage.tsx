
// Generic listing page — used by RentBikePage, RentCarPage, RentEScooterPage
// Receives a VehicleConfig from the factory and fetches only that vehicle type

import { useState, useEffect } from "react";
import { SlidersHorizontal, SearchX } from "lucide-react";
import VehicleCard from "./VehicleCard";
import type { Vehicle, VehicleStatus } from "@/models/vehicle";
import type { VehicleConfig } from "@/utils/factories/VehicleFactory";
import { fetchVehiclesByType } from "@/services/vehicleService";

interface VehicleListPageProps {
  config: VehicleConfig;
}

const STATUS_FILTERS: { label: string; value: VehicleStatus | "all" }[] = [
  { label: "All",         value: "all" },
  { label: "Available",   value: "available" },
  { label: "In Use",      value: "rented" },
  { label: "Maintenance", value: "maintenance" },
];

export default function VehicleListPage({ config }: VehicleListPageProps) {
  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
  const [search, setSearch]       = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVehiclesByType(config.type);
        setVehicles(data);
      } catch (err) {
        setError("Failed to load vehicles. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [config.type]);

  const filtered = vehicles.filter((v) => {
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    const matchesSearch = v.location.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted p-3">
          <img src={config.iconPath} alt={config.label} className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Rent a {config.label}</h1>
          <p className="text-muted-foreground text-sm">
            {vehicles.filter((v) => v.status === "available").length} available near you
          </p>
        </div>
      </div>
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <SlidersHorizontal className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Search vehicles by location"
          />
        </div>
        {/* Status filter pills */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors
                ${statusFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <SearchX className="w-10 h-10 text-muted-foreground" />
          <p className="font-semibold text-lg">Something went wrong</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <SearchX className="w-10 h-10 text-muted-foreground" />
          <p className="font-semibold text-lg">No vehicles found</p>
          <p className="text-muted-foreground text-sm">
            Try adjusting your filters or search term.
          </p>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} config={config} />
          ))}
        </div>
      )}
    </div>
  );
}
