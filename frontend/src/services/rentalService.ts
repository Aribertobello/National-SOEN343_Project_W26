import type { Rental, CreateRentalPayload } from '@/models/rental';
import type { Vehicle } from '@/models/vehicle';
import { PricingContext, getPricingStrategy } from './pricing/PricingStrategy';
import { RentalStore } from '@/stores/RentalStore';

/**
 * Create a new rental (book a vehicle).
 *
 * Patterns in use:
 *   ApiClient (Singleton), HTTP call with auth headers automatically attached
 *   RentalStore (Observer), addRental() notifies all subscribers immediately
 *
 * TODO: replace mock block with:
 *   const rental = await ApiClient.getInstance().post<Rental>(
 *     '/rentals/rentals/',
 *     { vehicle_id: payload.vehicle_id, payment_method: payload.payment_method }
 *   );
 *   RentalStore.getInstance().addRental(rental);
 *   return rental;
 */
export async function createRental(
  vehicle: Vehicle,
  payload: CreateRentalPayload,
): Promise<Rental> {
  await new Promise(r => setTimeout(r, 600)); // simulated network delay

  const store = RentalStore.getInstance();

  const alreadyActive = store
    .getRentals()
    .find(r => r.vehicle.id === vehicle.id && r.status === 'active');
  if (alreadyActive) throw new Error('This vehicle is already rented.');

  // Mock: log what would be sent to the API(For error of payload)
  console.debug('[rentalService] createRental payload:', payload);

  const rental: Rental = {
    id: store.allocateId(),
    vehicle,
    user_id: 1, // TODO: replace with value from auth context
    status: 'active',
    start_time: new Date().toISOString(),
    payment_status: 'paid',
  };

  store.addRental(rental); // Observer: notifies MyRentalsPage automatically
  return rental;
}

/**
 * Return a vehicle — delegates cost calculation to the appropriate
 * PricingStrategy, then updates the store.
 *
 * Patterns in use:
 *   PricingContext (Strategy) — correct pricing rules per vehicle type
 *   RentalStore (Observer)    — returnRental() notifies all subscribers
 *
 * TODO: replace mock block with:
 *   const returned = await ApiClient.getInstance().patch<Rental>(
 *     `/rentals/rentals/${rentalId}/return/`
 *   );
 *   RentalStore.getInstance().returnRental(
 *     returned.id, returned.end_time!, returned.total_cost!
 *   );
 *   return returned;
 */
export async function returnVehicle(rentalId: number): Promise<Rental> {
  await new Promise(r => setTimeout(r, 500));

  const store  = RentalStore.getInstance();
  const rental = store.getRentals().find(r => r.id === rentalId);
  if (!rental) throw new Error('Rental not found.');

  const endTime       = new Date().toISOString();
  const durationHours =
    (new Date(endTime).getTime() - new Date(rental.start_time).getTime()) /
    3_600_000;

  // Strategy: pick the pricing algorithm for this vehicle type
  const strategy = getPricingStrategy(
    rental.vehicle.type,
    rental.vehicle.battery_level,
  );
  const context   = new PricingContext(strategy);
  const totalCost = context.calculateCost(
    durationHours,
    rental.vehicle.price_per_unit,
  );

  return store.returnRental(rentalId, endTime, totalCost); // Observer: notifies
}

/**
 * Read rentals directly from the store — no network call needed since the
 * store is always kept up to date by createRental / returnVehicle.
 *
 * TODO: on app load, seed the store from the API:
 *   const rentals = await ApiClient.getInstance().get<Rental[]>('/rentals/rentals/');
 *   rentals.forEach(r => RentalStore.getInstance().addRental(r));
 */
export function getMyRentals(): Rental[] {
  return RentalStore.getInstance().getRentals();
}