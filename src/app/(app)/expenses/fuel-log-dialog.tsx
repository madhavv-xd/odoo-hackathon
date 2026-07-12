"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createFuelLog, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type VehicleOption = { id: string; regNumber: string; name: string };

export function FuelLogDialog({
  vehicles,
}: {
  vehicles: VehicleOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createFuelLog,
    {},
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" /> Add Fuel Log
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add fuel log</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="fl-vehicle">Vehicle</Label>
            <Select name="vehicleId">
              <SelectTrigger id="fl-vehicle" className="w-full">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    <span className="data">{v.regNumber}</span>{" "}
                    <span className="text-muted-foreground">— {v.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fl-liters">Liters</Label>
              <Input
                id="fl-liters"
                name="liters"
                type="number"
                step="0.1"
                placeholder="45.5"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fl-cost">Cost (₹)</Label>
              <Input
                id="fl-cost"
                name="cost"
                type="number"
                placeholder="4368"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fl-date">Date</Label>
            <Input
              id="fl-date"
              name="date"
              type="date"
              defaultValue={today}
              required
            />
          </div>
          <DialogFooter showCloseButton>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Add fuel log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
