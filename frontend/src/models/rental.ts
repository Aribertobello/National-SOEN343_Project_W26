import type { Vehicle } from '@/models/vehicle';
import type { Payment } from '@/models/Payment';

export type RentalStatus  = 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Rental {
  id: number;
  vehicle: Vehicle;
  user_id: number;
  status: RentalStatus;
  start_time: string;   // ISO string
  end_time?: string;    // ISO string — set on return
  total_cost?: number;  // set on return
  payment: Payment;
}

export interface CreateRentalPayload {
  vehicle_id: number;
  payment_method: 'credit_card' | 'debit_card' | 'wallet';
}