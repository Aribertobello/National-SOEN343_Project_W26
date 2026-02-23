// Renders a single vehicle card
import { Link } from "react-router-dom";
import { MapPin, CircleCheck, CircleX, Wrench } from "lucide-react";
import type { Vehicle } from "@/models/vehicle";
import type { VehicleConfig } from "@/utils/factories/VehicleFactory";

interface VehicleCardProps {
  vehicle: Vehicle;
  config: VehicleConfig;
}

const statusMeta: Record<
  Vehicle["status"],
  { label: string; icon: React.ReactNode; classes: string }
> = {
  available: {
    label: "Available",
    icon: <CircleCheck className="w-3.5 h-3.5" />,
    classes: "bg-green-100 text-green-700",
  },
  rented: {
    label: "In Use",
    icon: <CircleX className="w-3.5 h-3.5" />,
    classes: "bg-red-100 text-red-700",
  },
  maintenance: {
    label: "Maintenance",
    icon: <Wrench className="w-3.5 h-3.5" />,
    classes: "bg-yellow-100 text-yellow-700",
  },
};

export default function VehicleCard({ vehicle, config }: VehicleCardProps) {
  const status = statusMeta[vehicle.status];
  const isAvailable = vehicle.status === "available";

  return (
    <div className="group relative bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Top accent strip using badge colour as a thin bar */}
      <div className={`h-1 w-full ${config.badgeColor.split(" ")[0]}`} />
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header row: icon + type badge + status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center p-2">
              <img
                src={config.iconPath}
                alt={config.label}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span
                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${config.badgeColor}`}
              >
                {config.label}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                #{vehicle.id}
              </p>
            </div>
          </div>
          {/* Status badge */}
          <span
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${status.classes}`}
          >
            {status.icon}
            {status.label}
          </span>
        </div>
        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{vehicle.location}</span>
        </div>
        {/* Specs grid — rendered generically from factory config */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {config.specs.map((spec) => {
            const value = vehicle[spec.key as keyof Vehicle];
            if (value == null) return null;
            return (
              <div key={spec.key}>
                <p className="text-xs text-muted-foreground">{spec.label}</p>
                <p className="text-sm font-medium capitalize">
                  {typeof value === "number" && spec.key === "battery_level"
                    ? `${value}%`
                    : String(value)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      {/* Footer: price + CTA */}
      <div className="px-5 pb-5 flex items-center justify-between">
        <div>
          <span className="text-xl font-bold">
            ${vehicle.price_per_unit.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            {vehicle.currency} {config.rateLabel}
          </span>
        </div>
        <Link
          to={isAvailable ? `${config.bookingRoute}/${vehicle.id}` : "#"}
          aria-disabled={!isAvailable}
          tabIndex={isAvailable ? undefined : -1}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors
            ${
              isAvailable
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
            }`}
        >
          {isAvailable ? "Book Now" : "Unavailable"}
        </Link>
      </div>
    </div>
  );
}
