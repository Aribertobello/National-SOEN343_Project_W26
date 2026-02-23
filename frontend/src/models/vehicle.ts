export type VehicleType = "car" | "bike" | "escooter";
export type VehicleStatus = "available" | "rented" | "maintenance";
export interface Vehicle {
  id: number;
  type: VehicleType;
  status: VehicleStatus;
  location: string;
  latitude: number;
  longitude: number;
  price_per_unit: number;

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
