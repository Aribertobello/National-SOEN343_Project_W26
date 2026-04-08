import type { Vehicle, VehicleType, VehicleStatus } from "@/models/vehicle";

/**
 * VehicleAdapter — Adapter Pattern
 *
 * Converts the raw Django API response shape into the Vehicle interface
 * the frontend uses
 *
 * Backend returns: rate, nested location object, decimal strings
 * Frontend expects: price_per_unit, location string, latitude/longitude numbers
 */

export interface BackendVehicle {
  id: number;
  type: string;
  status: string;
  rate: string;
  capacity: number;
  location: {
    id: number;
    address: string;
    x: string; // DecimalField — latitude
    y: string; // DecimalField — longitude
  } | null;
  // Optional type-specific fields
  battery_level?: number;
  max_speed_kmh?: number;
  seats?: number;
  fuel_type?: string;
  transmission?: string;
  range_km?: number;
  style?: string;
}

export class VehicleAdapter {
  private static normalizeStatus(rawStatus: string): VehicleStatus {
    if (rawStatus === "maintenence") {
      return "maintenance";
    }
    if (rawStatus === "available" || rawStatus === "rented-out") {
      return rawStatus;
    }
    return "maintenance";
  }

  static adapt(raw: BackendVehicle): Vehicle {
    const rate = parseFloat(raw.rate);
    return {
      id: raw.id,
      location_id: raw.location?.id,
      type: raw.type as VehicleType,
      status: VehicleAdapter.normalizeStatus(raw.status),
      price_per_unit: rate,
      hourly_rate: rate,
      location: raw.location?.address ?? "Unknown",
      latitude: raw.location ? parseFloat(raw.location.x) : 0,
      longitude: raw.location ? parseFloat(raw.location.y) : 0,
      // type-specific — passed through as-is
      battery_level: raw.battery_level,
      max_speed_kmh: raw.max_speed_kmh,
      seats: raw.seats,
      fuel_type: raw.fuel_type,
      transmission: raw.transmission,
      range_km: raw.range_km,
      style: raw.style,
    };
  }

  static adaptMany(raws: BackendVehicle[]): Vehicle[] {
    return raws.map(VehicleAdapter.adapt);
  }
}
