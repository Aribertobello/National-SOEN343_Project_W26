import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchX, SlidersHorizontal, SquareParking } from "lucide-react";

import { useAuth } from "@/auth/AuthContext";
import type { ParkingReservation, ParkingSpot } from "@/models/parking";
import {
  fetchParkingSpots,
  releaseParkingReservation,
  reserveParkingSpot,
} from "@/services/parkingService";

const REFRESH_INTERVAL_MS = 10000;
const DURATION_OPTIONS = [30, 60, 120];

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    if (error.message.includes("active or upcoming parking reservation")) {
      return "You already have a reserved spot. Release your current spot before reserving another one.";
    }
    return error.message;
  }
  return fallback;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRemainingLabel(value: string): string {
  const remainingMs = new Date(value).getTime() - Date.now();
  if (remainingMs <= 0) {
    return "expires shortly";
  }

  const remainingMinutes = Math.ceil(remainingMs / 60000);
  if (remainingMinutes < 60) {
    return `${remainingMinutes} min left`;
  }

  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  return minutes === 0 ? `${hours}h left` : `${hours}h ${minutes}m left`;
}

export default function ParkingPage() {
  const { user } = useAuth();

  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [submittingSpotId, setSubmittingSpotId] = useState<number | null>(null);
  const [reservationResult, setReservationResult] =
    useState<ParkingReservation | null>(null);

  const availableCount = useMemo(
    () => spots.filter((spot) => spot.is_available).length,
    [spots],
  );

  const loadSpots = useCallback(async () => {
    try {
      const data = await fetchParkingSpots();
      setSpots(data);
      setError(null);
    } catch {
      setError("Unable to load parking spots right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpots();
    const interval = window.setInterval(loadSpots, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [loadSpots]);

  const handleReserve = async (spot: ParkingSpot) => {
    if (!user) {
      setError("Please log in before reserving a parking spot.");
      return;
    }

    setSubmittingSpotId(spot.id);
    setError(null);

    try {
      const reservation = await reserveParkingSpot({
        parking_spot_id: spot.id,
        user_id: user.id,
        duration_minutes: durationMinutes,
      });
      setReservationResult(reservation);
      await loadSpots();
    } catch (error: unknown) {
      setError(
        getErrorMessage(
          error,
          "Could not reserve this spot. It may no longer be available.",
        ),
      );
    } finally {
      setSubmittingSpotId(null);
    }
  };

  const handleRelease = async (spot: ParkingSpot) => {
    if (!user) {
      setError("Please log in before releasing a parking spot.");
      return;
    }

    setSubmittingSpotId(spot.id);
    setError(null);

    try {
      await releaseParkingReservation({
        user_id: user.id,
        reservation_id: spot.my_reservation_id ?? undefined,
        parking_spot_id: spot.my_reservation_id ? undefined : spot.id,
      });
      setReservationResult(null);
      await loadSpots();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Could not release this spot right now."));
    } finally {
      setSubmittingSpotId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted p-3 flex items-center justify-center">
          <SquareParking className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Parking Availability</h1>
          <p className="text-muted-foreground text-sm">
            {availableCount} available near you
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <SlidersHorizontal className="w-4 h-4" />
          </span>
          <div className="w-full pl-9 pr-4 h-10 rounded-xl border bg-background text-sm text-muted-foreground flex items-center">
            Reservation duration
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {DURATION_OPTIONS.map((minutes) => (
            <button
              key={minutes}
              onClick={() => setDurationMinutes(minutes)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                durationMinutes === minutes
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {minutes}m
            </button>
          ))}
        </div>
      </div>

      {reservationResult && (
        <section className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Reservation #{reservationResult.reservation_id} confirmed for Spot #
          {reservationResult.parking_spot_id} at {reservationResult.location}.
          Starts now. Duration: {reservationResult.duration_minutes}m. Expires:{" "}
          {formatDateTime(reservationResult.end_at)}. Total: $
          {reservationResult.total.toFixed(2)}
        </section>
      )}

      {error && (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </section>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-64 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      ) : spots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <SearchX className="w-10 h-10 text-muted-foreground" />
          <p className="font-semibold text-lg">No parking spots found</p>
          <p className="text-muted-foreground text-sm">
            Parking inventory is currently empty.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spots.map((spot) => {
            const estimatedTotal = (spot.rate * durationMinutes) / 60;
            const reservationExpiry = spot.reserved_until
              ? formatDateTime(spot.reserved_until)
              : null;
            const remainingLabel = spot.reserved_until
              ? getRemainingLabel(spot.reserved_until)
              : null;

            return (
              <article
                key={spot.id}
                className="group relative bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
              >
                <div
                  className={`h-1 w-full ${spot.is_available ? "bg-green-500/70" : "bg-yellow-500/70"}`}
                />
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">Spot #{spot.id}</h2>
                      <p className="text-sm text-muted-foreground">
                        {spot.location}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        spot.is_available
                          ? "bg-green-100 text-green-700"
                          : spot.is_reserved_by_me
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {spot.is_available
                        ? "Available"
                        : spot.is_reserved_by_me
                          ? "Reserved by you"
                          : "Reserved"}
                    </span>
                  </div>

                  <div className="divide-y text-sm">
                    <div className="flex justify-between gap-4 py-2.5 first:pt-0">
                      <p className="text-muted-foreground">Rate</p>
                      <p className="text-right font-medium">
                        ${spot.rate.toFixed(2)} / hour
                      </p>
                    </div>
                    <div className="flex justify-between gap-4 py-2.5">
                      <p className="text-muted-foreground">Address</p>
                      <p className="text-right">{spot.location}</p>
                    </div>
                    {spot.is_available ? (
                      <div className="flex justify-between gap-4 py-2.5 last:pb-0">
                        <p className="text-muted-foreground">Estimated total</p>
                        <p className="text-right font-medium">
                          ${estimatedTotal.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-between gap-4 py-2.5 last:pb-0">
                        <p className="text-muted-foreground">Reserved until</p>
                        <p className="text-right font-medium">
                          {reservationExpiry
                            ? `${reservationExpiry} (${remainingLabel})`
                            : "Reserved"}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      spot.is_available
                        ? handleReserve(spot)
                        : spot.is_reserved_by_me
                          ? handleRelease(spot)
                          : null
                    }
                    disabled={
                      (!spot.is_available && !spot.is_reserved_by_me) ||
                      submittingSpotId === spot.id ||
                      !user
                    }
                    className={`w-full px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      (spot.is_available || spot.is_reserved_by_me) &&
                      submittingSpotId !== spot.id &&
                      user
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {submittingSpotId === spot.id
                      ? spot.is_available
                        ? "Reserving..."
                        : "Releasing..."
                      : spot.is_available
                        ? "Reserve Spot"
                        : spot.is_reserved_by_me
                          ? "Release Spot"
                          : "Unavailable"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
