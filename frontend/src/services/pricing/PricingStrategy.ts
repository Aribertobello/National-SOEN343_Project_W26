import type { VehicleType } from '@/models/vehicle';

/**
 * PricingStrategy — Strategy Pattern
 *
 * Defines the interface all pricing algorithms must implement. Each vehicle
 * type encapsulates its own billing rules in a concrete strategy.
 */
export interface PricingStrategy {
  /** Calculate total cost for a completed rental. */
  calculateCost(durationHours: number, pricePerUnit: number): number;
  /** Minimum billable duration in hours. */
  getMinimumHours(): number;
  /** Human-readable billing rule shown in the UI. */
  getDescription(): string;
}

// Concrete Strategies
/** Bikes: flat hourly rate, 1-hour minimum. */
export class BikePricingStrategy implements PricingStrategy {
  calculateCost(durationHours: number, pricePerUnit: number): number {
    const billable = Math.max(this.getMinimumHours(), durationHours);
    return Math.round(pricePerUnit * billable * 100) / 100;
  }
  getMinimumHours() { return 1; }
  getDescription()  { return 'Billed per hour · 1-hour minimum'; }
}

/**
 * E-Scooters: flat hourly rate, 1-hour minimum.
 * 10 % discount when battery < 50 %, incentivises users to return
 * low-charge scooters promptly???
 */
export class EScooterPricingStrategy implements PricingStrategy {
  private batteryLevel: number;

  constructor(batteryLevel = 100) {
    this.batteryLevel = batteryLevel;
  }

  calculateCost(durationHours: number, pricePerUnit: number): number {
    const billable  = Math.max(this.getMinimumHours(), durationHours);
    const discount  = this.batteryLevel < 50 ? 0.9 : 1.0;
    return Math.round(pricePerUnit * billable * discount * 100) / 100;
  }
  getMinimumHours() { return 1; }
  getDescription() {
    return this.batteryLevel < 50
      ? 'Billed per hour · 1-hour minimum · 10 % discount (low battery)'
      : 'Billed per hour · 1-hour minimum';
  }
}

/**
 * Cars: 2-hour minimum
 */
export class CarPricingStrategy implements PricingStrategy {
  calculateCost(durationHours: number, pricePerUnit: number): number {
    const billable = Math.max(this.getMinimumHours(), durationHours);
    return Math.round(pricePerUnit * billable * 100) / 100;
  }
  getMinimumHours() { return 2; }
  getDescription()  { return 'Billed per hour · 2-hour minimum'; }
}


/**
 * PricingContext holds the active strategy and delegates all cost
 * calculation to it. Callers interact only with PricingContext, not
 * with concrete strategy classes directly.
 */
export class PricingContext {
  private strategy: PricingStrategy;

  constructor(strategy: PricingStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: PricingStrategy): void {
    this.strategy = strategy;
  }

  calculateCost(durationHours: number, pricePerUnit: number): number {
    return this.strategy.calculateCost(durationHours, pricePerUnit);
  }

  getMinimumHours(): number {
    return this.strategy.getMinimumHours();
  }

  getDescription(): string {
    return this.strategy.getDescription();
  }

  /** Minimum charge the user will pay regardless of actual duration. */
  getMinimumCost(pricePerUnit: number): number {
    return this.strategy.calculateCost(this.strategy.getMinimumHours(), pricePerUnit);
  }
}

// Factory helper
/**
 * Resolves the correct pricing strategy for a given vehicle type.
 * Pass battery_level for escooters so the discount logic works.
 */
export function getPricingStrategy(
  type: VehicleType,
  batteryLevel?: number,
): PricingStrategy {
  switch (type) {
    case 'bike':     return new BikePricingStrategy();
    case 'escooter': return new EScooterPricingStrategy(batteryLevel);
    case 'car':      return new CarPricingStrategy();
  }
}