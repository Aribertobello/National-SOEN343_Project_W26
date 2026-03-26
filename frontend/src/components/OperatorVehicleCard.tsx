// Renders a single vehicle card
import { MapPin } from "lucide-react";
import { RentalVehicleStatus, type RentalVehicle } from "@/models/vehicle";
import { Button } from "./ui/button";

import bikeIcon from "@/assets/bicycle.svg";
import carIcon from "@/assets/carshare.svg";
import scooterIcon from "@/assets/scooter.svg";

interface OperatorVehicleCardProps {
  vehicle: RentalVehicle;
  clientName?: string
}

export default function OperatorVehicleCard({vehicle, clientName}: OperatorVehicleCardProps) {

    const iconPath = (() => {
      switch (vehicle.type) {
        case "bike":
          return bikeIcon;
        case "car":
          return carIcon;
        default:
          return scooterIcon;
      }
    })();

    const statusCSS = (() => {
      switch (vehicle.status) {
        case RentalVehicleStatus.AVAILABLE:
          return "bg-green-50 text-green-700";
        case RentalVehicleStatus.RENTEDOUT:
          return "bg-red-50 text-red-700";
        default:
          return "bg-gray-700 text-gray-50";
      }
    })();

  return (
    <div className="group relative bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col max-w-3/4">
      <div className={`h-1 w-full bg-accent`} />
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center p-2">
              <img src={iconPath} className="w-full h-full object-contain"/>
            </div>
            <div>
              <span
                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-accent`}
              >
                id
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                #{vehicle.id}
              </p>
            </div>
          </div>
          <span
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${statusCSS}`}
          >
            {vehicle.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{vehicle.location.address}</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">          
            <div key={vehicle.rate}>
                <p className="text-xs text-muted-foreground">rate</p>
                <p className="text-sm font-medium capitalize">
                  {vehicle.rate}
                </p>
            </div>
            <div key={vehicle.overtime_rate}>
                <p className="text-xs text-muted-foreground">overtime rate</p>
                <p className="text-sm font-medium capitalize">
                  {vehicle.overtime_rate}
                </p>
            </div>
            <div key={vehicle.capacity}>
                <p className="text-xs text-muted-foreground">capacity</p>
                <p className="text-sm font-medium capitalize">
                  {vehicle.capacity}
                </p>
            </div>
            <div key={clientName}>
                <p className="text-xs text-muted-foreground">currently rented by</p>
                <p className="text-sm font-medium capitalize">
                  {clientName ?? "no one"}
                </p>
            </div>
        </div>
      </div>
      <div className="px-5 pb-5 flex items-center justify-between">
        <div>
          <span className="text-xl font-bold">
            ${vehicle.rate.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            per day
          </span>
        </div>
        <Button onClick={()=>{}/*see rental detials if rented opens modal*/}>
            see details
        </Button>
      </div>
    </div>
  );
}
