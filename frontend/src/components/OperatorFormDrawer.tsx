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
import type { RentalStation } from "@/models/RentalStation";
import { ApiClient } from "@/utils/ApiClient";
import { useEffect } from "react";

interface VehicleFormState {
    type: VehicleType | "";
    stationId: string;
    rate: string;
    overtimeRate: string;
    capacity: string;
    quantity: string;
}

interface StationFormState {
    type: VehicleType | "";
    name: string;
    location_id: number | null;
}

const VEHICLE_TYPES: { value: VehicleType; label: string}[] = [
    { value: "bike",     label: "Bike"},
    { value: "car",      label: "Car"},
    { value: "escooter", label: "E-Scooter"},
];


function VehicleForm({ stations, onRegisterStation, onSuccess}: { 
    stations: RentalStation[];
    onRegisterStation: () => void;
    onSuccess: () => void;
}){
    const [vehicleForm, setVehicleForm] = useState<VehicleFormState>({
        type: "",
        stationId: "",
        rate: "",
        overtimeRate: "",
        capacity: "1",
        quantity: "1",
    });
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string>("");

    const filteredStations = stations.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.type.toLowerCase().includes(search.toLowerCase())
    );

    function resetForm() {
        setVehicleForm({ type: "", stationId: "", rate: "", overtimeRate: "", capacity: "1", quantity: "1" });
        setSearch("");
        setError("");
    }

    function validateNewVehicle(): boolean {
        if (!vehicleForm.type) { setError("Please select a vehicle type."); return false; }
        if (!vehicleForm.stationId) { setError("Please select a station."); return false; }
        if (!vehicleForm.rate || isNaN(Number(vehicleForm.rate)) || Number(vehicleForm.rate) <= 0) { setError("Please enter a valid rate."); return false; }
        if (!vehicleForm.overtimeRate || isNaN(Number(vehicleForm.overtimeRate)) || Number(vehicleForm.overtimeRate) <= 0) { setError("Please enter a valid overtime rate."); return false; }
        return true;
    }

async function handleVehicleSubmit() {
    if (!validateNewVehicle()) return;
    try {
        const qty = Math.max(1, parseInt(vehicleForm.quantity) || 1);
        const selectedStation = stations.find(s => String(s.id) === vehicleForm.stationId)!;

        await ApiClient.getInstance().post("/api/rentals/op/vehicles/", {
            type: vehicleForm.type,
            station_id: parseInt(vehicleForm.stationId),
            rate: parseFloat(vehicleForm.rate),
            overtime_rate: parseFloat(vehicleForm.overtimeRate),
            capacity: parseInt(vehicleForm.capacity),
            quantity: qty,
        });
        toast.success(`${qty} vehicle${qty > 1 ? "s" : ""} registered successfully.`);
        onSuccess();
        resetForm();
    } catch {
        setError("Failed to register vehicles.");
    }
}

    const selectedStation = stations.find(s => String(s.id) === vehicleForm.stationId);

	return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <Label>Vehicle type</Label>
            <Select value={vehicleForm.type} onValueChange={ (val) => setVehicleForm((prev) => ({ ...prev, type: val as VehicleType }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map(({ value, label}) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          
            <div className="space-y-1.5">
                <Label>Station</Label>
                <Input
                    placeholder="Search stations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="border rounded-md max-h-40 overflow-y-auto">
                    {filteredStations.length === 0 ? (
                        <div className="p-2 space-y-1">
                            <p className="text-sm text-muted-foreground">No stations found.</p>
                            <button
                                onClick={onRegisterStation}
                                className="text-sm text-primary hover:underline cursor-pointer"
                            >
                                + Register a new station
                            </button>
                        </div>
                    ) : (
                        <>
                            {filteredStations.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => setVehicleForm((prev) => ({ ...prev, stationId: String(s.id) }))}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted flex justify-between ${vehicleForm.stationId === String(s.id) ? "bg-muted font-medium" : ""}`}
                                >
                                    <span>{s.name}</span>
                                    <span className="text-muted-foreground text-xs">{s.type}</span>
                                </div>
                            ))}
                            <button
                                onClick={onRegisterStation}
                                className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-muted cursor-pointer border-t"
                            >
                                + Register a new station
                            </button>
                        </>
                    )}
                </div>
                {selectedStation && (
                    <p className="text-xs text-muted-foreground">
                        Selected: {selectedStation.name} ({selectedStation.type})
                    </p>
                )}
            </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Daily rate ($)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                placeholder="12"
                value={vehicleForm.rate}
				onChange={ (e) => setVehicleForm((prev) => ({ ...prev, rate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Overtime rate ($/hr)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                placeholder="5"
                value={vehicleForm.overtimeRate} 
				onChange={ (e) => setVehicleForm((prev) => ({ ...prev, overtimeRate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Capacity (persons)</Label>
              <Input
                type="number"
                min={1}
                max={9}
                value={vehicleForm.capacity}
				onChange={ (e) => setVehicleForm((prev) => ({ ...prev, capacity: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity to add</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={vehicleForm.quantity}
				onChange={ (e) => setVehicleForm((prev) => ({ ...prev, quantity: e.target.value }))}
              />
            </div>
          </div>
              {error && 
              <span className="text-red-300">
                {error}
              </span>}
			<Button onClick={handleVehicleSubmit}>Add vehicles</Button>
        </div>
		);
}

interface StationFormState {
    type: VehicleType | "";
    name: string;
    location_id: number | null;
}

function StationForm({ onSuccess, onBack }: {
    onSuccess: () => void;
    onBack: () => void;
}) {
    const [stationForm, setStationForm] = useState<StationFormState>({
        type: "",
        name: "",
        location_id: null,
    });
    const [locations, setLocations] = useState<{ id: number; address: string }[]>([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string>("");

    useEffect(() => {
        ApiClient.getInstance().get<{ id: number; address: string }[]>("/api/core/locations/")
            .then(setLocations)
            .catch(() => setError("Failed to load locations."));
    }, []);

    const filteredLocations = locations.filter(l =>
        l.address.toLowerCase().includes(search.toLowerCase())
    );

    function resetForm() {
        setStationForm({ type: "", name: "", location_id: null });
        setSearch("");
        setError("");
    }

    function validateNewStation(): boolean {
        if (!stationForm.type) { setError("Please select a station type."); return false; }
        if (!stationForm.name.trim()) { setError("Please enter a station name."); return false; }
        if (!stationForm.location_id) { setError("Please select a location."); return false; }
        return true;
    }

    async function handleStationSubmit() {
        if (!validateNewStation()) return;
        try {
            await ApiClient.getInstance().post("/api/rentals/op/stations/", {
                name: stationForm.name.trim(),
                type: stationForm.type,
                location_id: stationForm.location_id,
            });
            toast.success(`Station "${stationForm.name}" registered successfully.`);
            onSuccess();
            resetForm();
        } catch {
            setError("Failed to register station.");
        }
    }

    return (
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                ← Back to vehicle form
            </button>

            <div className="space-y-1.5">
                <Label>Station type</Label>
                <Select value={stationForm.type} onValueChange={(val) => setStationForm((prev) => ({ ...prev, type: val as VehicleType }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                        {VEHICLE_TYPES.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label>Station name</Label>
                <Input
                    placeholder="e.g. Mile End Bike Hub"
                    value={stationForm.name}
                    onChange={(e) => setStationForm((prev) => ({ ...prev, name: e.target.value }))}
                />
            </div>

            <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                    placeholder="Search locations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="border rounded-md max-h-40 overflow-y-auto">
                    {filteredLocations.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-2">No locations found.</p>
                    ) : (
                        filteredLocations.map((loc) => (
                            <div
                                key={loc.id}
                                onClick={() => setStationForm((prev) => ({ ...prev, location_id: loc.id }))}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted ${stationForm.location_id === loc.id ? "bg-muted font-medium" : ""}`}
                            >
                                {loc.address}
                            </div>
                        ))
                    )}
                </div>
                {stationForm.location_id && (
                    <p className="text-xs text-muted-foreground">
                        Selected: {locations.find(l => l.id === stationForm.location_id)?.address}
                    </p>
                )}
            </div>

            {error && <span className="text-red-300 text-sm">{error}</span>}
            <Button onClick={handleStationSubmit}>Register station</Button>
        </div>
    );
}


export default function AddVehicleDrawer({ open, onOpenChange, initialView = "vehicle" }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialView?: "vehicle" | "station";
}) {
    const [viewAddVehicle, setViewAddVehicle] = useState(initialView === "vehicle");
    const [stations, setStations] = useState<RentalStation[]>([]);
    useEffect(() => {
        if (!open) return;
        ApiClient.getInstance().get<RentalStation[]>("/api/rentals/op/stations/")
            .then(setStations)
            .catch(() => console.error("Failed to load stations."));
    }, [open]);

    // refetch after a new station is registered
    function refreshStations() {
        ApiClient.getInstance().get<RentalStation[]>("/api/rentals/op/stations/")
            .then(setStations)
            .catch(() => console.error("Failed to refresh stations."));
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col w-[400px] sm:w-[420px] gap-0 p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle className="text-base font-medium">
                        {viewAddVehicle ? "Register vehicles for rental" : "Register a new station"}
                    </SheetTitle>
                </SheetHeader>

                {viewAddVehicle ? (
                    <VehicleForm
                        stations={stations}
                        onRegisterStation={() => setViewAddVehicle(false)}
                        onSuccess={() => onOpenChange(false)}
                    />
                ) : (
                    <StationForm
                        onSuccess={() => onOpenChange(false)}
                        onBack={() => setViewAddVehicle(true)}
                    />
                )}

                <div className="px-6 py-3 border-t flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        {viewAddVehicle ? "Need to add a station first?" : "Want to add a vehicle instead?"}
                    </span>
                    <Button
                        variant="link"
                        className="p-0 h-auto cursor-pointer"
                        onClick={() => setViewAddVehicle(v => !v)}
                    >
                        {viewAddVehicle ? "Register a station →" : "← Register a vehicle"}
                    </Button>
                </div>

                <SheetFooter className="px-6 py-4 border-t flex gap-2 sm:justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                </SheetFooter>

            </SheetContent>
        </Sheet>
    );
}
