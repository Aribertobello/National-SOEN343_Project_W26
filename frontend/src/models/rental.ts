import type { Vehicle } from '@/models/vehicle';
import type { Payment } from '@/models/Payment';

export type RentalStatus  = 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Rental {
  id: number;
  vehicle: Vehicle;
  user_id: number;
  status: RentalStatus;
  start_date_time: string; 
  end_date_time?: string;  
  total_cost?: number;     
  payment?: Payment;      
}

export interface CreateRentalPayload {
  vehicle_id: number;
  payment_method: 'credit_card' | 'debit_card' | 'wallet';
  end_date_time?: string
}