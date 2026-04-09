import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Route } from "lucide-react";

import { fetchCities, type City } from "@/services/cityService";
import type { VehicleType } from "@/models/vehicle";
import { fetchVehiclesByType } from "@/services/vehicleService";
import { fetchLocations, type TripLocation } from "@/services/locationService";
import { startTrip } from "@/services/tripService";

type VehicleTypeOption = {
  value: VehicleType;
  label: string;
};

type TravelMode = "driving" | "bicycling" | "walking";

type PickupPoint = {
  vehicleId: number;
  locationId: number;
  address: string;
  latitude: number;
  longitude: number;
};

const VEHICLE_OPTIONS: VehicleTypeOption[] = [
  { value: "car", label: "Car" },
  { value: "bike", label: "Bike" },
  { value: "escooter", label: "E-Scooter" },
];

const TRAVEL_MODE_BY_TYPE: Record<VehicleType, TravelMode> = {
  car: "driving",
  bike: "bicycling",
  escooter: "bicycling",
};

function uniqueByCoordinates(locations: PickupPoint[]): PickupPoint[] {
  const seen = new Set<string>();
  const unique: PickupPoint[] = [];

  for (const location of locations) {
    const key = `${location.latitude}:${location.longitude}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(location);
  }

  return unique;
}

function isInCity(
  location: Pick<TripLocation, "latitude" | "longitude">,
  city: City,
): boolean {
  return (
    location.latitude >= city.min_lat &&
    location.latitude <= city.max_lat &&
    location.longitude >= city.min_lng &&
    location.longitude <= city.max_lng
  );
}

function buildGoogleMapsDirectionsUrl(
  fromLocation: PickupPoint,
  toLocation: TripLocation,
  travelMode: TravelMode,
): string {
  const origin = `${fromLocation.latitude},${fromLocation.longitude}`;
  const destination = `${toLocation.latitude},${toLocation.longitude}`;

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${travelMode}`;
}

export default function StartTripPage() {
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [fromOptions, setFromOptions] = useState<PickupPoint[]>([]);
  const [toOptions, setToOptions] = useState<TripLocation[]>([]);
  const [fromVehicleId, setFromVehicleId] = useState<number | null>(null);
  const [toId, setToId] = useState<number | null>(null);
  const [tripStarted, setTripStarted] = useState(false);
  const [startedTripId, setStartedTripId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pendingStart, setPendingStart] = useState<{
    mapsUrl: string;
    vehicleId: number;
    startLocationId: number;
    endLocationId: number;
  } | null>(null);
  const [startingTrip, setStartingTrip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) ?? null,
    [cities, selectedCityId]
  );

  useEffect(() => {
    fetchCities()
      .then((data) => {
        setCities(data);
        if (data.length > 0) setSelectedCityId(data[0].id);
      })
      .catch(() => setError('Could not load cities.'));
  }, []);

  useEffect(() => {
    let mounted = true;

    const chooseInitialVehicleType = async () => {
      try {
        const checks = await Promise.all(
          VEHICLE_OPTIONS.map(async (option) => {
            const vehicles = await fetchVehiclesByType(option.value);
            const hasAvailable = vehicles.some(
              (vehicle) => vehicle.status === "available",
            );
            return { type: option.value, hasAvailable };
          }),
        );

        if (!mounted) return;
        const firstAvailableType = checks.find(
          (entry) => entry.hasAvailable,
        )?.type;
        setVehicleType(firstAvailableType ?? VEHICLE_OPTIONS[0].value);
      } catch {
        if (!mounted) return;
        setVehicleType(VEHICLE_OPTIONS[0].value);
      }
    };

    chooseInitialVehicleType();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setTripStarted(false);
    setCountdown(null);
    setPendingStart(null);
  }, [vehicleType]);

  useEffect(() => {
    if (!vehicleType) return;

    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [vehicles, allLocations] = await Promise.all([
          fetchVehiclesByType(vehicleType),
          fetchLocations(),
        ]);

        if (!mounted) return;

        const availableVehicleLocations: PickupPoint[] = (() => {
        const step1 = vehicles.filter((vehicle) => vehicle.status === "available");
        console.log("step1 - available vehicles:", step1);

        const step2 = step1.map((vehicle) => ({
          vehicleId: vehicle.id,
          locationId: vehicle.location_id ?? 0,
          address: vehicle.location,
          latitude: vehicle.latitude,
          longitude: vehicle.longitude,
        }));
        console.log("step2 - mapped to pickup points:", step2);

        const step3 = step2.filter((location) => location.locationId > 0);
        console.log("step3 - after locationId > 0 filter:", step3);

        const step4 = step3.filter(
          (location) =>
            Number.isFinite(location.latitude) &&
            Number.isFinite(location.longitude),
        );
        console.log("step4 - after finite coords filter:", step4);

        const step5 = step4.filter((location) =>
          selectedCity ? isInCity(location, selectedCity) : true,
        );
        console.log("step5 - after city filter (selectedCity:", selectedCity, "):", step5);

        return step5;
      })();

        const validDestinations = allLocations.filter((location) => selectedCity ? isInCity(location, selectedCity) : true);

        const uniqueFrom = uniqueByCoordinates(availableVehicleLocations);
        setFromOptions(uniqueFrom);
        setToOptions(validDestinations);

        setFromVehicleId((previousVehicleId) => {
          if (!uniqueFrom.length) return null;
          if (
            uniqueFrom.some(
              (location) => location.vehicleId === previousVehicleId,
            )
          ) {
            return previousVehicleId;
          }
          return uniqueFrom[0].vehicleId;
        });

        setToId((previousToId) => {
          if (!validDestinations.length) return null;
          if (
            validDestinations.some((location) => location.id === previousToId)
          ) {
            return previousToId;
          }
          return validDestinations[0].id;
        });
      } catch {
        if (!mounted) return;
        setError("Could not load trip locations right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [vehicleType, selectedCity]);

  const fromLocation = useMemo(() => {
    return (
      fromOptions.find((location) => location.vehicleId === fromVehicleId) ??
      null
    );
  }, [fromOptions, fromVehicleId]);

  const filteredDestinations = useMemo(() => {
    if (!fromLocation) return toOptions;

    return toOptions.filter(
      (location) =>
        location.latitude !== fromLocation.latitude ||
        location.longitude !== fromLocation.longitude,
    );
  }, [toOptions, fromLocation]);

  const toLocation = useMemo(
    () =>
      filteredDestinations.find((location) => location.id === toId) ??
      filteredDestinations[0] ??
      null,
    [filteredDestinations, toId],
  );

  useEffect(() => {
    if (!toLocation) {
      setToId(null);
      return;
    }

    if (toId !== toLocation.id) {
      setToId(toLocation.id);
    }
  }, [toLocation, toId]);

  const travelMode = useMemo<TravelMode>(() => {
    if (!vehicleType) return "driving";
    return TRAVEL_MODE_BY_TYPE[vehicleType];
  }, [vehicleType]);

  const mapsUrl = useMemo(() => {
    if (!fromLocation || !toLocation || !vehicleType) return null;
    return buildGoogleMapsDirectionsUrl(fromLocation, toLocation, travelMode);
  }, [fromLocation, toLocation, vehicleType, travelMode]);

  useEffect(() => {
    if (countdown == null || pendingStart == null) return;

    if (countdown === 0) {
      const commitTripStart = async () => {
        try {
          setStartingTrip(true);
          setError(null);
          const createdTrip = await startTrip({
            vehicle_id: pendingStart.vehicleId,
            start_location_id: pendingStart.startLocationId,
            end_location_id: pendingStart.endLocationId,
          });
          setStartedTripId(createdTrip.id);
          window.open(pendingStart.mapsUrl, "_blank", "noopener,noreferrer");
          setTripStarted(true);
        } catch (err) {
          setTripStarted(false);
          setStartedTripId(null);
          setError(
            err instanceof Error ? err.message : "Could not start trip.",
          );
        } finally {
          setStartingTrip(false);
          setCountdown(null);
          setPendingStart(null);
        }
      };

      void commitTripStart();
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((previous) => (previous == null ? previous : previous - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, pendingStart]);

  async function handleStartTrip(): Promise<void> {
    if (!mapsUrl || !fromLocation || !toLocation) return;
    setError(null);
    setTripStarted(false);
    setPendingStart({
      mapsUrl,
      vehicleId: fromLocation.vehicleId,
      startLocationId: fromLocation.locationId,
      endLocationId: toLocation.id,
    });
    setCountdown(3);
  }

  function handleCancelStart(): void {
    setCountdown(null);
    setPendingStart(null);
    setStartingTrip(false);
  }

  if (loading || !vehicleType) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
        <div className="h-72 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
          <Route className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Plan a trip</h1>
          <p className="text-sm text-muted-foreground">
            Pick a vehicle type, choose your route, then open Google Maps.
          </p>
        </div>
      </div>

      {error && (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </section>
      )}

      <section className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols- gap-4">
          <div className="space-y-1.5">
            <label htmlFor="city" className="text-sm font-medium">
              City
            </label>
            <select
              id="city"
              value={selectedCityId ?? ''}
              onChange={(e) => setSelectedCityId(Number(e.target.value))}
              className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
              disabled={!cities.length}
            >
              {!cities.length && <option value="">Loading cities...</option>}
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="vehicle-type" className="text-sm font-medium">
              Vehicle type
            </label>
            <select
              id="vehicle-type"
              value={vehicleType}
              onChange={(event) =>
                setVehicleType(event.target.value as VehicleType)
              }
              className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
            >
              {VEHICLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="trip-from" className="text-sm font-medium">
              From
            </label>
            <select
              id="trip-from"
              value={fromVehicleId ?? ""}
              onChange={(event) => setFromVehicleId(Number(event.target.value))}
              className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
              disabled={!fromOptions.length}
            >
              {!fromOptions.length && (
                <option value="">No available pickup points</option>
              )}
              {fromOptions.map((location) => (
                <option key={location.vehicleId} value={location.vehicleId}>
                  {location.address}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="trip-to" className="text-sm font-medium">
              To
            </label>
            <select
              id="trip-to"
              value={toLocation?.id ?? ""}
              onChange={(event) => setToId(Number(event.target.value))}
              className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
              disabled={!filteredDestinations.length}
            >
              {!filteredDestinations.length && (
                <option value="">No destination available</option>
              )}
              {filteredDestinations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.address}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Transport method (auto):{" "}
          <span className="font-semibold text-foreground">{travelMode}</span>
        </div>

        {countdown != null && pendingStart && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>
              Trip will start in <span className="font-bold">{countdown}</span>{" "}
              second{countdown === 1 ? "" : "s"}. Redirecting to Google Maps.
            </span>
            <button
              type="button"
              onClick={handleCancelStart}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-900 text-xs font-semibold hover:bg-amber-100"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleStartTrip}
            disabled={countdown != null || startingTrip}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
              mapsUrl && countdown == null && !startingTrip
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground pointer-events-none"
            }`}
          >
            {startingTrip ? "Starting..." : "Start trip"}
          </button>
          <a
            href={mapsUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
              mapsUrl
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground pointer-events-none"
            }`}
          >
            Preview in Google Maps
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-xs text-muted-foreground flex items-center">
            No API key required. This opens a regular Google Maps directions
            link.
          </p>
        </div>

        {tripStarted && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Trip started{startedTripId ? ` (#${startedTripId})` : ""}.
            Navigation opened in Google Maps.
          </div>
        )}
      </section>
    </div>
  );
}
