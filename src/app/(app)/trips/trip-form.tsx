"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { createTrip, type ActionState } from "./actions";
import { smartDispatch } from "./smart-dispatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type VehicleOption = {
  id: string;
  regNumber: string;
  name: string;
  maxLoadKg: number;
};
type DriverOption = { id: string; name: string };

export function TripForm({
  vehicles,
  drivers,
}: {
  vehicles: VehicleOption[];
  drivers: DriverOption[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createTrip,
    {},
  );
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [cargo, setCargo] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const cargoNum = Number(cargo);

  // Live validation panel (context.md §5 rule 5) — UX only; the server
  // re-checks inside the transaction.
  const validationError = useMemo(() => {
    if (selectedVehicle && cargoNum > 0 && cargoNum > selectedVehicle.maxLoadKg) {
      return `Cargo ${cargoNum} kg exceeds ${selectedVehicle.name} capacity ${selectedVehicle.maxLoadKg} kg`;
    }
    return null;
  }, [selectedVehicle, cargoNum]);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      // reset the form
      setVehicleId("");
      setDriverId("");
      setCargo("");
      setSuggestion(null);
      setFormKey((k) => k + 1);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const poolEmpty = vehicles.length === 0 || drivers.length === 0;

  async function handleSuggest() {
    const fd = new FormData(formRef.current!);
    setSuggesting(true);
    try {
      const result = await smartDispatch({
        source: String(fd.get("source") ?? ""),
        destination: String(fd.get("destination") ?? ""),
        cargoWeightKg: Number(fd.get("cargoWeightKg") ?? 0),
        plannedDistanceKm: Number(fd.get("plannedDistanceKm") ?? 0),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.vehicleId) setVehicleId(result.vehicleId);
      if (result.driverId) setDriverId(result.driverId);
      setSuggestion(result.reason);
      toast.success("Copilot picked an assignment");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <form ref={formRef} action={formAction} key={formKey} className="space-y-4">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="driverId" value={driverId} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="source">Source</Label>
          <Input id="source" name="source" placeholder="Mumbai" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="destination">Destination</Label>
          <Input id="destination" name="destination" placeholder="Pune" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Vehicle</Label>
        <Select value={vehicleId} onValueChange={setVehicleId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an available vehicle" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                <span className="data">{v.regNumber}</span> · {v.name} (
                {v.maxLoadKg} kg)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Driver</Label>
        <Select value={driverId} onValueChange={setDriverId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an eligible driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cargoWeightKg">Cargo weight (kg)</Label>
          <Input
            id="cargoWeightKg"
            name="cargoWeightKg"
            type="number"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plannedDistanceKm">Planned distance (km)</Label>
          <Input
            id="plannedDistanceKm"
            name="plannedDistanceKm"
            type="number"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Button
          type="button"
          variant="secondary"
          className="w-full gap-1.5"
          onClick={handleSuggest}
          disabled={suggesting || poolEmpty}
        >
          {suggesting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {suggesting ? "Asking Copilot…" : "Suggest assignment"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Enter the route, cargo and distance — Copilot picks the best-fit
          vehicle and driver.
        </p>
      </div>

      {suggestion && (
        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{suggestion}</span>
        </div>
      )}

      {validationError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={pending || poolEmpty || !!validationError}
      >
        {pending ? "Creating…" : "Create draft trip"}
      </Button>

      {poolEmpty && (
        <p className="text-center text-xs text-muted-foreground">
          Need at least one available vehicle and one eligible driver to create a
          trip.
        </p>
      )}
    </form>
  );
}
