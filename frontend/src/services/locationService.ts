import { ApiClient } from "@/utils/ApiClient";

interface BackendLocation {
  id: number;
  address: string;
  x: number | string;
  y: number | string;
}

export interface TripLocation {
  id: number;
  address: string;
  longitude: number;
  latitude: number;
}

function adaptLocation(raw: BackendLocation): TripLocation {
  return {
    id: raw.id,
    address: raw.address,
    latitude: typeof raw.x === "string" ? parseFloat(raw.x) : raw.x,
    longitude: typeof raw.y === "string" ? parseFloat(raw.y) : raw.y,
  };
}

export async function fetchLocations(): Promise<TripLocation[]> {
  const raw = await ApiClient.getInstance().get<BackendLocation[]>(
    "/api/core/locations/",
  );
  return raw.map(adaptLocation);
}
