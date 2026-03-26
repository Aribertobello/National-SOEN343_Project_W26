import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import type { Vehicle, VehicleType } from '@/models/vehicle';
import type { Rental } from '@/models/rental';
import type { VehicleConfig } from '@/utils/factories/VehicleFactory';
import { fetchVehiclesByType } from '@/services/vehicleService';
import { createRental } from '@/services/rentalService';
import { PricingContext, getPricingStrategy } from '@/services/pricing/PricingStrategy';

interface BookingPageProps {
  config: VehicleConfig;
}

type Step = 'review' | 'payment' | 'confirm';
type PaymentMethod = 'credit_card' | 'debit_card' | 'wallet';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'credit_card', label: '💳  Credit Card'    },
  { value: 'debit_card',  label: '🏦  Debit Card'     },
  { value: 'wallet',      label: '📱  Digital Wallet' },
];

export default function BookingPage({ config }: BookingPageProps) {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vehicle,  setVehicle]  = useState<Vehicle | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step,          setStep]          = useState<Step>('review');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [endDateTime, setEndDateTime] = useState<string>('');
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [rental,        setRental]        = useState<Rental | null>(null);

  // Fetch the vehicle for this ID
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchVehiclesByType(config.type as VehicleType)
      .then(vehicles => {
        const found = vehicles.find(v => v.id === Number(id));
        if (!found) { setNotFound(true); return; }
        if (found.status !== 'available') { setNotFound(true); return; }
        setVehicle(found);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, config.type]);

  // Strategy: resolve pricing context once vehicle is loaded
  const pricing = useMemo(() => {
    if (!vehicle) return null;
    return new PricingContext(
      getPricingStrategy(vehicle.type, vehicle.battery_level),
    );
  }, [vehicle]);

  async function handleConfirmPayment() {
    if (!vehicle) return;
    setSubmitting(true);
    setError(null);
    try {
      const newRental = await createRental(vehicle, {
        vehicle_id: vehicle.id,
        payment_method: paymentMethod,
        end_date_time: endDateTime,
      });
      setRental(newRental);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / not-found states ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col gap-4">
        <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (notFound || !vehicle || !pricing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
        <p className="text-2xl font-bold">Vehicle unavailable</p>
        <p className="text-muted-foreground text-sm">
          This vehicle is no longer available for booking.
        </p>
        <button
          onClick={() => navigate(config.bookingRoute)}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          Back to {config.label}s
        </button>
      </div>
    );
  }

  const minimumCost = pricing.getMinimumCost(vehicle.price_per_unit);

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Back link */}
      <button
        onClick={() => navigate(config.bookingRoute)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {config.label}s
      </button>

      {/* Step indicators */}
      <div className="flex items-center gap-2 text-xs">
        {(['review', 'payment', 'confirm'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-8 bg-border" />}
            <span
              className={`px-2.5 py-1 rounded-full capitalize font-medium ${
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* ── Step 1: Review ── */}
      {step === 'review' && (
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border bg-card p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-muted p-2.5">
                <img src={config.iconPath} alt={config.label} className="w-full h-full object-contain" />
              </div>
              <div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badgeColor}`}>
                  {config.label}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">#{vehicle.id}</p>
              </div>
            </div>

            <div className="divide-y text-sm">
              <Row label="Location"    value={vehicle.location} />
              <Row label="Rate"        value={`$${vehicle.price_per_unit.toFixed(2)} ${config.rateLabel}`} />
              <Row label="Min. charge" value={`$${minimumCost.toFixed(2)}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="end-time" className="text-sm text-muted-foreground font-medium">Select rental end time</label>
              <input
                id="end-time"
                type="datetime-local"
                value={endDateTime}
                onChange={e => setEndDateTime(e.target.value)}
                className="border rounded-xl bg-muted-foreground p-2 text-sm text-black"
              />
            </div>

            {/* Strategy: show vehicle-type-specific billing rule */}
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
              <span className="text-blue-400 mt-0.5 text-xs">ℹ</span>
              <p className="text-xs text-blue-700">{pricing.getDescription()}</p>
            </div>
          </div>

          <button
            onClick={() => setStep('payment')}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Continue to Payment
          </button>
        </div>
      )}

      {/* ── Step 2: Payment ── */}
      {step === 'payment' && (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-muted-foreground font-medium">Select a payment method</p>
          <div className="flex flex-col gap-2">
            {PAYMENT_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                  paymentMethod === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('review')}
              className="flex-1 py-3 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConfirmPayment}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
            >
              {submitting ? 'Processing…' : 'Confirm & Pay'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirmation ── */}
      {step === 'confirm' && rental && (
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <div>
            <p className="font-bold text-xl">You're all set!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Head to <span className="font-semibold text-foreground">{vehicle.location}</span> to pick up your {config.label.toLowerCase()}.
            </p>
          </div>

          <div className="rounded-2xl border bg-card w-full p-4 divide-y text-sm">
            <Row label="Rental ID" value={`#${rental.id}`} />
            <Row label="Started"   value={new Date(rental.start_date_time).toLocaleTimeString()} />
            {rental.end_date_time && (
              <Row label="Ends" value={new Date(rental.end_date_time).toLocaleString()} />
            )}
            <Row label="Billing"   value={pricing.getDescription()} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => navigate('/my-rentals')}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              View my rentals
            </button>
            <button
              onClick={() => navigate(config.bookingRoute)}
              className="flex-1 py-3 rounded-xl border font-medium text-sm hover:bg-muted transition-colors"
            >
              Back to {config.label}s
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}