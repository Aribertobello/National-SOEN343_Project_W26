import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Rental } from '@/models/rental';
import { returnVehicle } from '@/services/rentalService';
import { RentalStore } from '@/stores/RentalStore';
import { PricingContext, getPricingStrategy } from '@/services/pricing/PricingStrategy';
import { buildGoogleMapsSearchUrl } from '@/utils/googleMaps';

// Custom hook — Observer pattern
// Subscribes to RentalStore and re-renders when any rental changes.
// No manual load() / refetch() anywhere in this file.
function useRentals(): Rental[] {
  const [rentals, setRentals] = useState<Rental[]>([]);
  useEffect(() => {
    // subscribe() returns the unsubscribe fn
    return RentalStore.getInstance().subscribe(setRentals);
  }, []);
  return rentals;
}

// Helpers
function formatDuration(start: string, end?: string): string {
  const ms   = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function StatusBadge({ status }: { status: Rental['status'] }) {
  const map = {
    active:    'bg-green-100 text-green-800',
    completed: 'bg-gray-100  text-gray-700',
    cancelled: 'bg-red-100   text-red-700',
  } as const;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

// Active rental card: live timer + PricingContext for estimated cost
function ActiveRentalCard({
  rental,
  onReturn,
}: {
  rental: Rental;
  onReturn: (id: number) => Promise<void>;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
 
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
 
  // Strategy: live estimated cost using vehicle-type-specific pricing
  const pricing = new PricingContext(
    getPricingStrategy(rental.vehicle.type, rental.vehicle.battery_level),
  );
  const durationHours =
    (now - new Date(rental.start_date_time).getTime()) / 3_600_000;
  const estimatedCost = pricing.calculateCost(
    durationHours,
    rental.vehicle.price_per_unit,
  );
  const mapsUrl = buildGoogleMapsSearchUrl(rental.vehicle.location);
 
  async function handleReturn() {
    setLoading(true);
    await onReturn(rental.id);
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border-2 border-green-400 bg-green-50 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
            Active rental
          </p>
          <p className="font-bold text-lg mt-0.5 capitalize">
            {rental.vehicle.type} #{rental.vehicle.id}
          </p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:underline"
          >
            {rental.vehicle.location}
          </a>
        </div>
        <StatusBadge status="active" />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Duration"   value={formatDuration(rental.start_date_time)} />
        <Stat label="Rate"       value={`$${rental.vehicle.price_per_unit.toFixed(2)}/hr`} />
        <Stat label="Est. total" value={`$${estimatedCost.toFixed(2)}`} />
      </div>

      {/* Strategy: show vehicle-type-specific billing rule */}
      <p className="text-xs text-green-700 text-center">{pricing.getDescription()}</p>

      <button
        onClick={handleReturn}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
      >
        {loading ? 'Processing return…' : 'Return Vehicle'}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

// History row
function HistoryRow({ rental }: { rental: Rental }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium capitalize">
          {rental.vehicle.type} #{rental.vehicle.id}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(rental.start_date_time).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
          {rental.end_date_time && ` · ${formatDuration(rental.start_date_time, rental.end_date_time)}`}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {rental.total_cost != null && (
          <span className="text-sm font-semibold">
            ${rental.total_cost.toFixed(2)}
          </span>
        )}
        <StatusBadge status={rental.status} />
      </div>
    </div>
  );
}

// Page
export default function MyRentalsPage() {
  // Observer: subscribe to RentalStore — updates automatically on any change
  const rentals = useRentals();

  async function handleReturn(rentalId: number) {
    await returnVehicle(rentalId);
  }

  const activeRentals = rentals.filter(r => r.status === 'active');
  const pastRentals   = rentals.filter(r => r.status !== 'active');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
      <h1 className="text-2xl font-bold">My Rentals</h1>

      {rentals.length === 0 && (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <span className="text-5xl">🚲</span>
          <p className="font-semibold text-lg">No rentals yet</p>
          <p className="text-sm text-muted-foreground">
            Browse bikes, e-scooters, or cars to get started.
          </p>
          <Link
            to="/rent"
            className="mt-1 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Browse vehicles
          </Link>
        </div>
      )}

      {activeRentals.length > 0 && (
        <section className="flex flex-col gap-3">
          {activeRentals.map(r => (
            <ActiveRentalCard key={r.id} rental={r} onReturn={handleReturn} />
          ))}
        </section>
      )}

      {pastRentals.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">History</h2>
          <div className="rounded-2xl border bg-card px-4">
            {pastRentals.map(r => (
              <HistoryRow key={r.id} rental={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}