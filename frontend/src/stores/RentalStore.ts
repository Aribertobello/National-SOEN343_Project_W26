import type { Rental } from '../models/rental';

/**
 * RentalStore — Observer + Singleton
 *
 * Acts as the single source of truth for rental state. Any component
 * that needs rental data subscribes to this store; when a rental is
 * created or returned, all subscribers are notified automatically.
 */

type RentalListener = (rentals: Rental[]) => void;

export class RentalStore {
  //Singleton
  private static instance: RentalStore | null = null;

  static getInstance(): RentalStore {
    if (!RentalStore.instance) {
      RentalStore.instance = new RentalStore();
    }
    return RentalStore.instance;
  }

  private constructor() {}
  private rentals: Rental[] = [];
  private nextId = 100; // mock ID counter; irrelevant once real API is wired

  //Observer registry
  private listeners = new Set<RentalListener>();

  /**
   * Subscribe to rental state changes.
   * The listener is called immediately with the current state, then again
   * on every subsequent change.
   *
   * @returns An unsubscribe function
   */
  subscribe(listener: RentalListener): () => void {
    this.listeners.add(listener);
    listener([...this.rentals]);
    return () => this.listeners.delete(listener);
  }

  /** Notify all subscribers with an immutable snapshot of current state. */
  private notify(): void {
    const snapshot = [...this.rentals];
    this.listeners.forEach(l => l(snapshot));
  }

  //Mutations(notify after every change)

  addRental(rental: Rental): void {
    this.rentals = [rental, ...this.rentals]; //(newest first)
    this.notify();
  }

  returnRental(rentalId: number, endTime: string, totalCost: number): Rental {
    const index = this.rentals.findIndex(r => r.id === rentalId);
    if (index === -1) throw new Error(`Rental #${rentalId} not found in store.`);

    const updated: Rental = {
      ...this.rentals[index],
      status: 'completed',
      end_date_time: endTime,
      total_cost: totalCost,
    };

    this.rentals = [
      ...this.rentals.slice(0, index),
      updated,
      ...this.rentals.slice(index + 1),
    ];

    this.notify();
    return updated;
  }

  //reads

  getRentals(): Rental[] {
    return [...this.rentals];
  }

  //Used by the mock layer to assign sequential IDs
  allocateId(): number {
    return this.nextId++;
  }
}