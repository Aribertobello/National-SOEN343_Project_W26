import { VehicleFactory, VehicleConfig } from "./VehicleFactory";
import scooterIcon from "../../assets/scooter.svg";

export class EScooterFactory extends VehicleFactory {
  createConfig(): VehicleConfig {
    return {
      type: "escooter",
      label: "E-Scooter",
      iconPath: scooterIcon,
      rateLabel: "per 30 min",
      badgeColor: "bg-purple-100 text-purple-800",
      specs: [
        { label: "Battery Level", key: "battery_level" },  // percentage
        { label: "Max Speed",     key: "max_speed_kmh" },
        { label: "Range (km)",    key: "range_km" },
      ],
      bookingRoute: "/rent-escooter",
    };
  }
}