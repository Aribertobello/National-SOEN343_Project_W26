"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { MapPin } from "lucide-react";
import { RentalVehicleStatus, type RentalVehicle } from "@/models/vehicle";
import type { Rental } from "@/models/rental";
import { ApiClient } from "@/utils/ApiClient";
import { buildGoogleMapsSearchUrl } from "@/utils/googleMaps";

import bikeIcon from "@/assets/bicycle.svg";
import carIcon from "@/assets/carshare.svg";
import scooterIcon from "@/assets/scooter.svg";


interface VehicleDetailModalProps {
  vehicle: RentalVehicle | null;
  clientName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (vehicleId: number) => void;
}


function StatusBadge({ status }: { status: RentalVehicle["status"] }) {
  const variants: Record<string, string> = {
    [RentalVehicleStatus.AVAILABLE]:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    [RentalVehicleStatus.RENTEDOUT]:    "bg-blue-50 text-blue-700 border-blue-200",
    [RentalVehicleStatus.MAINTENANCE]: "bg-muted text-muted-foreground border-border",
  };
  const labels: Record<string, string> = {
    [RentalVehicleStatus.AVAILABLE]:    "Available",
    [RentalVehicleStatus.RENTEDOUT]:    "Rented out",
    [RentalVehicleStatus.MAINTENANCE]: "Out of service",
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${variants[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

function PaymentBadge({ status }: { status: "pending" | "failed" |"paid" }) {
  const variants: Record<string, string> = {
    pending:  "bg-amber-50 text-amber-700 border-amber-200",
    paid:     "bg-emerald-50 text-emerald-700 border-emerald-200",
    refunded: "bg-blue-50 text-blue-700 border-blue-200",
    failed:   "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${variants[status] ?? ""}`}>
      {status}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export default function VehicleDetailModal({
  vehicle,
  clientName,
  open,
  onOpenChange,
  onDelete
}: VehicleDetailModalProps) {
  if (!vehicle) return null;

  const rental: Rental | null = vehicle.rental ?? null;
  const mapsUrl = buildGoogleMapsSearchUrl(vehicle.location.address);
  const payment = rental?.payment ?? null;

  const startTime = rental?.start_date_time
    ? new Date(rental.start_date_time).toLocaleString("en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const endTime = rental?.end_date_time
    ? new Date(rental.end_date_time).toLocaleString("en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

    const iconPath = (() => {
      switch (vehicle.type) {
        case "bike":
          return bikeIcon;
        case "car":
          return carIcon;
        default:
          return scooterIcon;
      }
    })();

  const handleDelete = async () => {
    if (!vehicle) return;

    try {
      await ApiClient.getInstance().delete(
        `/api/rentals/op/vehicles/?id=${vehicle.id}`
      );

      onDelete(vehicle.id);   // notify parent
      onOpenChange(false);    // close modal
    } catch (err) {
      console.error("Failed to delete vehicle", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">

        {/* Accent stripe */}
        <div
          className={`h-1 w-full ${
            vehicle.status === RentalVehicleStatus.AVAILABLE
              ? "bg-emerald-500"
              : vehicle.status === RentalVehicleStatus.RENTEDOUT
              ? "bg-blue-500"
              : "bg-muted-foreground"
          }`}
        />

        <div className="px-6 pt-5 pb-1">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-medium">
              <img src={iconPath} className="w-10 h-10 object-contain"/>
              Vehicle #{vehicle.id}
              <StatusBadge status={vehicle.status} />
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-5 overflow-y-auto max-h-[70vh]">

          {/* Vehicle info */}
          <section>
            <SectionTitle>Vehicle info</SectionTitle>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Field label="Station">{vehicle.station.name}</Field>
              <Field label="Type">{vehicle.type}</Field>
              <Field label="Daily rate">${vehicle.rate.toFixed(2)}</Field>
              <Field label="Overtime rate">${vehicle.overtime_rate.toFixed(2)}/hr</Field>
              <Field label="Capacity">
                {vehicle.capacity} person{vehicle.capacity > 1 ? "s" : ""}
              </Field>
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {vehicle.location.address}
              </a>
            </div>
          </section>

          <Separator />

          {/* Rental info */}
          <section>
            <SectionTitle>Rental</SectionTitle>
            {rental ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Field label="Rental ID">#{rental.id}</Field>
                <Field label="Status">{rental.status}</Field>
                <Field label="Client">{clientName ?? "—"}</Field>
                <Field label="Started">{startTime ?? "—"}</Field>
                {endTime && <Field label="Returned">{endTime}</Field>}
                {rental.total_cost != null && (
                  <Field label="Total cost">${rental.total_cost.toFixed(2)}</Field>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active rental.</p>
            )}
          </section>

          {/* Payment info — only shown when there's a rental */}
          {payment && (
            <>
              <Separator />
              <section>
                <SectionTitle>Payment</SectionTitle>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Field label="Payment ID">#{payment.id}</Field>
                  <Field label="Status">
                    <PaymentBadge status={payment.status} />
                  </Field>
                  <Field label="Total charged">${payment.total.toFixed(2)}</Field>
                </div>
              </section>
            </>
          )}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleDelete}
            className="text-sm px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
          >
            Delete vehicle
          </button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
