// Uses getAllVehicleConfigs() so adding a new vehicle type automatically
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getAllVehicleConfigs } from "@/utils/factories";

const allConfigs = getAllVehicleConfigs();

export default function RentPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Rent a Vehicle</h1>
        <p className="text-muted-foreground text-base">
          Choose your ride — bikes, e-scooters, and cars available across the city.
        </p>
      </div>

      {/* Category cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {allConfigs.map((config) => (
          <Link
            key={config.type}
            to={config.bookingRoute}
            className="group relative border rounded-2xl p-6 bg-card hover:shadow-md transition-all duration-200 flex flex-col gap-4 overflow-hidden"
          >
            {/* Decorative background blob */}
            <div
              className={`absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 ${config.badgeColor.split(" ")[0]}`}
            />

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-muted p-3">
              <img
                src={config.iconPath}
                alt={config.label}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Info */}
            <div className="space-y-1">
              <span
                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${config.badgeColor}`}
              >
                {config.label}
              </span>
              <p className="text-sm text-muted-foreground">
                From{" "}
                <span className="font-semibold text-foreground">
                  {config.rateLabel}
                </span>
              </p>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-1 text-sm font-semibold text-primary mt-auto">
              Browse {config.label}s
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
