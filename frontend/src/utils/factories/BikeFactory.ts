// utils/factories/BikeFactory.ts

import type { VehicleConfig } from "./VehicleFactory";
import { VehicleFactory } from "./VehicleFactory";
import bikeIcon from "../../assets/bicycle.svg";

export class BikeFactory extends VehicleFactory {
  createConfig(): VehicleConfig {
    return {
      type: "bike",
      label: "Bicycle",
      iconPath: bikeIcon,
      rateLabel: "per hour",
      badgeColor: "bg-green-100 text-green-800",
      specs: [
        { label: "Style",      key: "style" },
      ],
      bookingRoute: "/rent-bike",
    };
  }
}