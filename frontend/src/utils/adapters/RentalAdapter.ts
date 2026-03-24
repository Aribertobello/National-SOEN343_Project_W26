import type { Rental, RentalStatus, PaymentStatus } from '@/models/rental';
import type { BackendVehicle } from './VehicleAdapter';
import { VehicleAdapter } from './VehicleAdapter';

/**
 * RentalAdapter — Adapter Pattern
 *
 * Converts the raw Django Rental response into the frontend Rental interface.
 * Backend uses start_date_time / end_date_time; frontend uses start_time / end_time.
 */

export interface BackendRental {
  id: number;
  vehicle: BackendVehicle;
  user_id: number;
  status: string;
  start_date_time: string;
  end_date_time: string | null;
  payment_status: string;
  total_cost: number | null;
}

export class RentalAdapter {
  static adapt(raw: BackendRental): Rental {
    return {
      id:             raw.id,
      vehicle:        VehicleAdapter.adapt(raw.vehicle),
      user_id:        raw.user_id,
      status:         raw.status as RentalStatus,
      start_time:     raw.start_date_time,
      end_time:       raw.end_date_time ?? undefined,
      total_cost:     raw.total_cost ?? undefined,
      payment_status: raw.payment_status as PaymentStatus,
    };
  }

  static adaptMany(raws: BackendRental[]): Rental[] {
    return raws.map(RentalAdapter.adapt);
  }
}