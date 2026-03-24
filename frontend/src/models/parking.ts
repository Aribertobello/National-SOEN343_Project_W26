export interface ParkingSpot {
  id: number;
  location: string;
  latitude: number;
  longitude: number;
  rate: number;
  is_available: boolean;
  reserved_until: string | null;
  is_reserved_by_me: boolean;
  my_reservation_id: number | null;
}

export interface ParkingReservation {
  reservation_id: number;
  parking_spot_id: number;
  location: string;
  duration_minutes: number;
  start_at: string;
  reserved_until: string;
  end_at: string;
  total: number;
  payment_status: "paid" | "pending" | "failed";
}
