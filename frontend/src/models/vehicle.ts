import { type Rental } from "./rental";
import type { Location } from "@/models/location";
import type { RentalStation } from "./RentalStation";

export type VehicleType = "car" | "bike" | "escooter";
export type VehicleStatus = "available" | "rented-out" | "maintenance";
export interface Vehicle {
  id: number;
  location_id?: number;
  type: VehicleType;
  status: VehicleStatus;
  location: string;
  latitude: number;
  longitude: number;
  price_per_unit: number;
  hourly_rate: number;

  // Car
  seats?: number;
  fuel_type?: string;
  transmission?: string;
  range_km?: number;

  // Bike
  style?: string;

  // E-Scooter
  battery_level?: number; //percentage
  max_speed_kmh?: number;
}

export const RentalVehicleStatus = {
  AVAILABLE: "available",
  RENTEDOUT: "rented-out",
  MAINTENANCE: "maintenence",
} as const;

type RentalVehicleStatusType =
  (typeof RentalVehicleStatus)[keyof typeof RentalVehicleStatus];

export interface RentalVehicle {
  id: number;
  type: VehicleType;
  status: RentalVehicleStatusType;
  location: Location;
  station: RentalStation;
  rate: number;
  overtime_rate: number;
  rental: Rental;
  capacity: number;
}
