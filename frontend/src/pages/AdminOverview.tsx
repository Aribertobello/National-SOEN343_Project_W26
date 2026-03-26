import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiClient } from "@/utils/ApiClient";
import { parseUser } from "@/models/user";
import type { User } from "@/models/user";
import { Role } from "@/models/user";
import type { Vehicle } from "@/models/vehicle";


interface AdminOverview {
  total_customers: number;
  total_operators: number;
  active_rentals: number;
  completed_trips: number;

  customers: {
    id: number;
    email: string;
    name: string;
  }[];

  operators: {
    id: number;
    email: string;
    name: string;
  }[];

  active_rentals_list: {
    vehicle: Vehicle;
    user: User;
    start_date_time: string;
    end_date_time: string;
  }[];

  completed_trips_list: {
    vehicle: Vehicle;
    user: User;
    start_time: string;
    end_time: string;
  }[];
}

type LoadState = "loading" | "error" | "ready";

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────


export default function AdminOverview() {
  const navigate = useNavigate();
  const api = ApiClient.getInstance();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        
        /**
        // 1. Verify the logged-in user is an admin
        const rawUser = await api.get<unknown>("/api/auth/user");
        const user: User = parseUser(rawUser);

        if (user.role !== Role.ADMIN) {
          // Not an admin — send them away silently
          navigate("/", { replace: true });
          return;
        }
           */

        // 2. Fetch the data
        const data = await api.get<AdminOverview>("/api/admin/overview");
        setOverview(data);
        setLoadState("ready");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Unexpected error");
        setLoadState("error");
      }
    }

    load();
  }, []);


  if (loadState === "loading") {
    return (
      <div className="admin-overview__loading">
        <span className="admin-overview__spinner" />
        <p>Loading overview…</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="admin-overview__error">
        <h2>Something went wrong</h2>
        <p>{errorMsg}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  const metrics = [
    {
      label: "Total Customers",
      value: overview!.total_customers,
      description: "Registered customers",
    },
    {
      label: "Total Operators",
      value: overview!.total_operators,
      description: "Registered operators",
    },
    {
      label: "Active Rentals",
      value: overview!.active_rentals,
      description: "Currently in progress",
    },
    {
      label: "Completed Trips",
      value: overview!.completed_trips,
      description: "All time",
    },
  ];

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  return (
    <div className="admin-overview p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">Overall System Performance</p>
      </div>

      {/* Boxes for Totals*/}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-card border rounded-xl p-4 shadow-sm"
          >

            <div className="text-2xl font-bold">
              {metric.value.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      {/* Sections of list */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Customers List*/}
        <div className="bg-card border rounded-xl p-4">
          <h2 className="font-semibold mb-4">Customers</h2>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {overview!.customers.map((user) => (
              <div
                key={user.id}
                className="border rounded-lg p-3 text-sm shadow-sm"
              >
                <div className="font-medium">
                  {user.name}
                </div>
                <div className="text-muted-foreground">{user.email}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ID: {user.id}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operators list*/}
        <div className="bg-card border rounded-xl p-4">
          <h2 className="font-semibold mb-4">Operators</h2>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {overview!.operators.map((user) => (
              <div
                key={user.id}
                className="border rounded-lg p-3 text-sm shadow-sm"
              >
                <div className="font-medium">
                  {user.name}
                </div>
                <div className="text-muted-foreground">{user.email}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ID: {user.id}

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Rental List*/}
        <div className="bg-card border rounded-xl p-4">
          <h2 className="font-semibold mb-4">Active Rentals</h2>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {overview!.active_rentals_list.map((rental) => (
              <div
                key={rental.toString()}
                className="border rounded-lg p-3 text-sm shadow-sm"
              >
                <div className="font-medium">Rental</div>
                <div className="text-muted-foreground">
                  User ID: {rental.user.id}
                </div>
                <div className="text-muted-foreground">
                  Vehicle ID: {rental.vehicle.id}
                </div>
                <div className="text-xs mt-1">
                  Start: {new Date(rental.start_date_time).toLocaleString()}
                </div>
                <div className="text-xs">
                  End: {new Date(rental.end_date_time).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Finished Trips List*/}
        <div className="bg-card border rounded-xl p-4">
          <h2 className="font-semibold mb-4">Completed Trips</h2>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {overview!.completed_trips_list.map((trip) => (
              <div
                key={trip.toString()}
                className="border rounded-lg p-3 text-sm shadow-sm"
              >
                <div className="font-medium">Trip</div>
                <div className="text-muted-foreground">
                  User ID: {trip.user.id}
                </div>
                <div className="text-muted-foreground">
                  Vehicle ID: {trip.vehicle.id}
                </div>
                <div className="text-xs mt-1">
                  Start: {new Date(trip.start_time).toLocaleString()}
                </div>
                <div className="text-xs">
                  End: {new Date(trip.end_time).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
