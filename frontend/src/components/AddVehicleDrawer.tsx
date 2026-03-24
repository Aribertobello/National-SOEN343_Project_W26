"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { RentalVehicle, VehicleType } from "@/models/vehicle";
import type { RentalStation } from "@/models/rentalStation";

// ── Types ──────────────────────────────────────────────────────────────────

interface AddVehicleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stations: RentalStation[];
  onVehiclesAdded: (vehicles: Omit<RentalVehicle, "id" | "rental">[]) => void;
}

interface FormState {
  type: VehicleType | "";
  stationId: string;
  newStationName: string;
  address: string;
  rate: string;
  overtimeRate: string;
  capacity: string;
  quantity: string;
}

const VEHICLE_TYPES: { value: VehicleType; label: string; icon: string }[] = [
  { value: "bike",     label: "Bike",      icon: "🚲" },
  { value: "car",      label: "Car",       icon: "🚗" },
  { value: "escooter", label: "E-Scooter", icon: "🛴" },
];

const NEW_BIKE_STATION = "__new_bike__";
const NEW_CAR_LOT      = "__new_car__";

// ── Component ─────────────────────────────────────────────────────────────

export default function AddVehicleDrawer({
  open,
  onOpenChange,
  stations,
  onVehiclesAdded,
}: AddVehicleDrawerProps) {
  const [form, setForm] = useState<FormState>({
    type: "",
    stationId: "",
    newStationName: "",
    address: "",
    rate: "",
    overtimeRate: "",
    capacity: "1",
    quantity: "1",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const bikeStations  = stations.filter((s) => s.type === "bike");
  const carStations   = stations.filter((s) => s.type === "car");

  const isNewStation =
    form.stationId === NEW_BIKE_STATION || form.stationId === NEW_CAR_LOT;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.type)      next.type      = "Select a vehicle type.";
    if (!form.stationId) next.stationId = "Select a station.";
    if (isNewStation && !form.newStationName.trim())
                         next.newStationName = "Enter a station name.";
    if (!form.address.trim()) next.address = "Enter an address.";
    if (!form.rate || isNaN(Number(form.rate)) || Number(form.rate) <= 0)
                         next.rate = "Enter a valid rate.";
    if (!form.overtimeRate || isNaN(Number(form.overtimeRate)) || Number(form.overtimeRate) <= 0)
                         next.overtimeRate = "Enter a valid overtime rate.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const stationName = isNewStation
      ? form.newStationName.trim()
      : stations.find((s) => String(s.id) === form.stationId)?.name ?? "";

    const qty = Math.max(1, parseInt(form.quantity) || 1);

    const newVehicles = Array.from({ length: qty }, () => ({
      type: form.type as VehicleType,
      status: "available" as const,
      location: { id: 0, adress: form.address.trim(), logitude: 0, lattitude: 0 },
      station: {
        id: isNewStation ? 0 : parseInt(form.stationId),
        name: stationName,
        type: form.type as VehicleType,
        location: { id: 0, adress: form.address.trim(), logitude: 0, lattitude: 0 },
      },
      rate: parseFloat(form.rate),
      overtime_rate: parseFloat(form.overtimeRate),
      operatorName: "string",
      capacity: parseInt(form.capacity) || 1,
    }));

    onVehiclesAdded(newVehicles);
    toast.success(`${qty} vehicle${qty > 1 ? "s" : ""} registered successfully.`);
    onOpenChange(false);
    resetForm();
  }

  function resetForm() {
    setForm({
      type: "", stationId: "", newStationName: "",
      address: "", rate: "", overtimeRate: "",
      capacity: "1", quantity: "1",
    });
    setErrors({});
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <SheetContent className="flex flex-col w-[400px] sm:w-[420px] gap-0 p-0">

        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-base font-medium">
            Register vehicles for rental
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Vehicle type */}
          <div className="space-y-1.5">
            <Label>Vehicle type</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v as VehicleType)}>
              <SelectTrigger className={errors.type ? "border-destructive" : ""}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map(({ value, label, icon }) => (
                  <SelectItem key={value} value={value}>
                    {icon} {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
          </div>

          {/* Station */}
          <div className="space-y-1.5">
            <Label>Station</Label>
            <Select value={form.stationId} onValueChange={(v) => set("stationId", v)}>
              <SelectTrigger className={errors.stationId ? "border-destructive" : ""}>
                <SelectValue placeholder="Select station" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Bike stations</SelectLabel>
                  {bikeStations.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                  <SelectItem value={NEW_BIKE_STATION}>
                    + Register new bike station
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Car lots</SelectLabel>
                  {carStations.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                  <SelectItem value={NEW_CAR_LOT}>
                    + Register new car lot
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.stationId && <p className="text-xs text-destructive">{errors.stationId}</p>}
          </div>

          {/* New station name — shown conditionally */}
          {isNewStation && (
            <div className="space-y-1.5">
              <Label>New station name</Label>
              <Input
                placeholder="e.g. Mile End Bike Hub"
                value={form.newStationName}
                onChange={(e) => set("newStationName", e.target.value)}
                className={errors.newStationName ? "border-destructive" : ""}
              />
              {errors.newStationName && (
                <p className="text-xs text-destructive">{errors.newStationName}</p>
              )}
            </div>
          )}

          {/* Address */}
          <div className="space-y-1.5">
            <Label>Address / location</Label>
            <Input
              placeholder="123 Rue Example, Montreal"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={errors.address ? "border-destructive" : ""}
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
          </div>

          {/* Rate + overtime */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Daily rate ($)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                placeholder="12"
                value={form.rate}
                onChange={(e) => set("rate", e.target.value)}
                className={errors.rate ? "border-destructive" : ""}
              />
              {errors.rate && <p className="text-xs text-destructive">{errors.rate}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Overtime rate ($/hr)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                placeholder="5"
                value={form.overtimeRate}
                onChange={(e) => set("overtimeRate", e.target.value)}
                className={errors.overtimeRate ? "border-destructive" : ""}
              />
              {errors.overtimeRate && (
                <p className="text-xs text-destructive">{errors.overtimeRate}</p>
              )}
            </div>
          </div>

          {/* Capacity + quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Capacity (persons)</Label>
              <Input
                type="number"
                min={1}
                max={9}
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity to add</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </div>
          </div>

        </div>

        <SheetFooter className="px-6 py-4 border-t flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add vehicles
          </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}
