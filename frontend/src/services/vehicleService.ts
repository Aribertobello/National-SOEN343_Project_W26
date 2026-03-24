// All API calls related to vehicles
import type { Vehicle, VehicleType } from "@/models/vehicle";
import { VehicleAdapter, type BackendVehicle } from "@/utils/adapters/VehicleAdapter";

const BASE_URL = "http://localhost:8000/api";

// Toggle this to false once the Django backend is running
const USE_MOCK = false;

export async function fetchVehiclesByType(type: VehicleType): Promise<Vehicle[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400)); // simulate network delay
    return MOCK_VEHICLES.filter(v => v.type === type);
  }
 
    const response = await fetch(`${BASE_URL}/rentals/vehicles/?type=${type}`);
  if (!response.ok) throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
  const raw: BackendVehicle[] = await response.json();
  return VehicleAdapter.adaptMany(raw); //ADAPTER
}

export async function fetchVehicleById(id: number): Promise<Vehicle> {
   if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    const vehicle = MOCK_VEHICLES.find(v => v.id === id);
    if (!vehicle) throw new Error(`Vehicle ${id} not found`);
    return vehicle;
  }
 
  const response = await fetch(`${BASE_URL}/rentals/vehicles/${id}/`);
  if (!response.ok) throw new Error(`Failed to fetch vehicle ${id}: ${response.statusText}`);
  const raw: BackendVehicle = await response.json();
  return VehicleAdapter.adapt(raw);  //ADAPTER
}

// Mock data — shaped exactly like the Django API response
const MOCK_VEHICLES: Vehicle[] = [
  // Bikes
  { id: 1, type: "bike", status: "available", location: "Station A — Guy-Concordia", latitude: 45.4972, longitude: -73.5791, price_per_unit: 3.50, hourly_rate: 3.50, style: "city" },
  { id: 2, type: "bike", status: "available", location: "Station B — Peel",          latitude: 45.4966, longitude: -73.5726, price_per_unit: 4.00, hourly_rate: 4.00, style: "mountain" },
  { id: 3, type: "bike", status: "rented",    location: "Station C — McGill",        latitude: 45.5048, longitude: -73.5772, price_per_unit: 3.00, hourly_rate: 3.00, style: "city" },
  { id: 4, type: "bike", status: "available", location: "Station D — Atwater",       latitude: 45.4890, longitude: -73.5838, price_per_unit: 3.50, hourly_rate: 3.50, style: "hybrid" },
 
  // E-Scooters
  { id: 5, type: "escooter", status: "available",   location: "Station A — Guy-Concordia", latitude: 45.4972, longitude: -73.5791, price_per_unit: 5.00, hourly_rate: 5.00, battery_level: 92, max_speed_kmh: 25 },
  { id: 6, type: "escooter", status: "available",   location: "Station B — Peel",          latitude: 45.4966, longitude: -73.5726, price_per_unit: 5.50, hourly_rate: 5.50, battery_level: 78, max_speed_kmh: 30 },
  { id: 7, type: "escooter", status: "maintenance", location: "Station E — Berri",         latitude: 45.5194, longitude: -73.5617, price_per_unit: 4.50, hourly_rate: 4.50, battery_level: 15, max_speed_kmh: 25 },
  { id: 8, type: "escooter", status: "available",   location: "Station C — McGill",        latitude: 45.5048, longitude: -73.5772, price_per_unit: 5.00, hourly_rate: 5.00, battery_level: 44, max_speed_kmh: 28 },
 
  // Cars
  { id: 9,  type: "car", status: "available", location: "Lot 1 — Downtown",  latitude: 45.5017, longitude: -73.5673, price_per_unit: 18.00, hourly_rate: 18.00, seats: 5, fuel_type: "Hybrid",   transmission: "Automatic", range_km: 900 },
  { id: 10, type: "car", status: "available", location: "Lot 2 — Plateau",   latitude: 45.5236, longitude: -73.5789, price_per_unit: 15.00, hourly_rate: 15.00, seats: 5, fuel_type: "Gasoline", transmission: "Manual",    range_km: 600 },
  { id: 11, type: "car", status: "rented",    location: "Lot 1 — Downtown",  latitude: 45.5017, longitude: -73.5673, price_per_unit: 22.00, hourly_rate: 22.00, seats: 5, fuel_type: "Electric", transmission: "Automatic", range_km: 480 },
  { id: 12, type: "car", status: "available", location: "Lot 3 — Mile End",  latitude: 45.5265, longitude: -73.5973, price_per_unit: 16.00, hourly_rate: 16.00, seats: 5, fuel_type: "Electric", transmission: "Automatic", range_km: 320 },
];