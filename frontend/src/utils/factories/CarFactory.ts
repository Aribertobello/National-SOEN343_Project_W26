
import { VehicleFactory, VehicleConfig } from "./VehicleFactory";
import carIcon from "../../assets/carshare.svg";

export class CarFactory extends VehicleFactory {
  createConfig(): VehicleConfig {
    return {
      type: "car",
      label: "Car",
      iconPath: carIcon,
      rateLabel: "per day",
      badgeColor: "bg-blue-100 text-blue-800",
      specs: [
        { label: "Seats",        key: "seats" },
        { label: "Fuel Type",    key: "fuel_type" },
        { label: "Transmission", key: "transmission" },
        { label: "Range (km)",   key: "range_km" },
      ],
      bookingRoute: "/rent-car",
    };
  }
}