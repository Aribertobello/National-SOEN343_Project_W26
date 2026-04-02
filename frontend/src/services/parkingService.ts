import type { ParkingReservation, ParkingSpot } from "@/models/parking";
import { ApiClient } from "@/utils/ApiClient";

interface ParkingListResponse {
  spots: ParkingSpot[];
}

export async function fetchParkingSpots(): Promise<ParkingSpot[]> {
  const data =
    await ApiClient.getInstance().get<ParkingListResponse>("/api/parking/");
  return data.spots;
}

export async function reserveParkingSpot(payload: {
  parking_spot_id: number;
  user_id: number;
  duration_minutes: number;
  start_at?: string;
}): Promise<ParkingReservation> {
  return ApiClient.getInstance().post<ParkingReservation>(
    "/api/parking/reserve/",
    payload,
  );
}

export async function releaseParkingReservation(payload: {
  user_id: number;
  reservation_id?: number;
  parking_spot_id?: number;
}): Promise<{ message: string; parking_spot_id: number }> {
  return ApiClient.getInstance().post<{ message: string; parking_spot_id: number }>(
    '/api/parking/release/',
    payload,
  );
}
