import type { Rental, CreateRentalPayload } from '@/models/rental';
import type { Vehicle } from '@/models/vehicle';
import { PricingContext, getPricingStrategy } from './pricing/PricingStrategy';
import { RentalStore } from '@/stores/RentalStore';
import { ApiClient } from '@/utils/ApiClient';
import { RentalAdapter, type BackendRental } from '@/utils/adapters/RentalAdapter';

// Flip to false once the Django backend is running
const USE_MOCK = false;

/**
 * createRental
 *
 * Patterns in use:
 *   ApiClient   (Singleton)  — single shared HTTP client with auth headers
 *   RentalStore (Observer)   — addRental() notifies all subscribers immediately
 *   RentalAdapter (Adapter)  — transforms raw backend shape into frontend Rental
 */
export async function createRental(
  vehicle: Vehicle,
  payload: CreateRentalPayload,
): Promise<Rental> {
  const store = RentalStore.getInstance();

  const alreadyActive = store
    .getRentals()
    .find(r => r.vehicle.id === vehicle.id && r.status === 'active');
  if (alreadyActive) throw new Error('This vehicle is already rented.');

  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 600));
    console.debug('[rentalService] createRental payload:', payload);

    const rental: Rental = {
      id:             store.allocateId(),
      vehicle,
      user_id:        1,
      status:         'active',
      start_time:     new Date().toISOString(),
      payment_status: 'paid',
    };
    store.addRental(rental);
    return rental;
  }

  const raw = await ApiClient.getInstance().post<BackendRental>(
    '/api/rentals/rentals/',
    { vehicle_id: payload.vehicle_id },
  );
  const rental = RentalAdapter.adapt(raw);
  store.addRental(rental);
  return rental;
}

/**
 * returnVehicle
 *
 * Patterns in use:
 *   PricingContext (Strategy) — correct billing rules per vehicle type
 *   RentalStore   (Observer)  — returnRental() notifies all subscribers
 *   RentalAdapter (Adapter)   — transforms raw backend shape into frontend Rental
 */
export async function returnVehicle(rentalId: number): Promise<Rental> {
  const store = RentalStore.getInstance();

  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 500));

    const rental = store.getRentals().find(r => r.id === rentalId);
    if (!rental) throw new Error('Rental not found.');

    const endTime       = new Date().toISOString();
    const durationHours =
      (new Date(endTime).getTime() - new Date(rental.start_time).getTime()) /
      3_600_000;
    const context   = new PricingContext(
      getPricingStrategy(rental.vehicle.type, rental.vehicle.battery_level),
    );
    const totalCost = context.calculateCost(durationHours, rental.vehicle.price_per_unit);
    return store.returnRental(rentalId, endTime, totalCost);
  }

  const raw      = await ApiClient.getInstance().patch<BackendRental>(
    `/api/rentals/rentals/${rentalId}/return/`,
  );
  const returned = RentalAdapter.adapt(raw);
  store.returnRental(returned.id, returned.end_time!, returned.total_cost!);
  return returned;
}

/**
 * loadMyRentals
 *
 * Patterns in use:
 *   ApiClient   (Singleton) — single shared HTTP client
 *   RentalStore (Observer)  — addRental() notifies all subscribers
 *   RentalAdapter (Adapter) — transforms raw backend rentals into frontend shape
 */
export async function loadMyRentals(): Promise<void> {
  if (USE_MOCK) return; // store is populated by createRental in mock mode

  const raws = await ApiClient.getInstance().get<BackendRental[]>(
    '/api/rentals/rentals/',
  );
  RentalAdapter.adaptMany(raws).forEach(r =>
    RentalStore.getInstance().addRental(r),
  );
}

/**
 * getMyRentals(Read current rentals from the store synchronously)
 */
export function getMyRentals(): Rental[] {
  return RentalStore.getInstance().getRentals();
}