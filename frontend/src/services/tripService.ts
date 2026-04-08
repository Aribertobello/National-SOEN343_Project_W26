import { ApiClient } from "@/utils/ApiClient";

export interface StartTripPayload {
  vehicle_id: number;
  start_location_id: number;
  end_location_id: number;
}

export interface StartedTrip {
  id: number;
  vehicle_id: number;
  start_location_id: number;
  end_location_id: number;
  start_time: string;
  message: string;
}

export async function startTrip(
  payload: StartTripPayload,
): Promise<StartedTrip> {
  return ApiClient.getInstance().post<StartedTrip>(
    "/api/analytics/trips/start/",
    payload,
  );
}
