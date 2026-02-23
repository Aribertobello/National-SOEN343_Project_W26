// All API calls related to vehicles
import type { Vehicle, VehicleType } from "@/models/vehicle";

const BASE_URL = "http://localhost:8000/api";

export async function fetchVehiclesByType(type: VehicleType): Promise<Vehicle[]> {
  const response = await fetch(`${BASE_URL}/rentals/vehicles/?type=${type}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchVehicleById(id: number): Promise<Vehicle> {
  const response = await fetch(`${BASE_URL}/rentals/vehicles/${id}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch vehicle ${id}: ${response.statusText}`);
  }
  return response.json();
}
