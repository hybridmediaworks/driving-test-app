"use client";

import { useEffect, useState } from "react";
import type { VehicleType } from "@driving-test-app/shared";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api } from "@/lib/api";

export default function PlanVehicleSelect({
  value,
  onChange,
  disabled = false,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);

  useEffect(() => {
    api.get<{ data: VehicleType[] }>("/vehicle-types").then((res) => setVehicleTypes(res.data));
  }, []);

  return (
    <div className="grid gap-2">
      <Label htmlFor="vehicle_type_id">Vehicle</Label>
      <select
        id="vehicle_type_id"
        className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All vehicles</option>
        {vehicleTypes.map((vehicle) => (
          <option key={vehicle.id} value={String(vehicle.id)}>
            {vehicle.title}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        The vehicle this plan unlocks. Pricing shows it under that vehicle&apos;s tab.
      </p>
      <InputError message={error} />
    </div>
  );
}
