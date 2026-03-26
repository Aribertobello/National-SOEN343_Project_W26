import { useState, useEffect, useCallback } from "react";

export interface AnalyticsSummary {
  active_rentals: number;
  available_vehicles: number;
  trips_last_n_days: number;
  total_trips: number;
  days_window: number;
}

export interface CityUsage {
  city: string;
  trips: number;
}

export interface DailyTrip {
  date: string;
  trips: number;
}

export interface VehicleTypeBreakdown {
  vehicle_type: string;
  count: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  most_used_vehicle_type: string | null;
  usage_per_city: CityUsage[];
  daily_trips: DailyTrip[];
  vehicle_type_breakdown: VehicleTypeBreakdown[];
}

interface UseAnalyticsOptions {
  city?: string;
  days?: number;
}

export function useAnalytics({ city, days = 30 }: UseAnalyticsOptions = {}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ days: String(days) });
      if (city) params.set("city", city);

      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/analytics/?${params}`, {
        headers,
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AnalyticsData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [city, days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, loading, error, refresh: fetchAnalytics };
}