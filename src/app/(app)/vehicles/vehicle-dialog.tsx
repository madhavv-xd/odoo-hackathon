"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { createVehicle, updateVehicle, type ActionState } from "./actions";
import type { VehicleType } from "@/generated/prisma/enums";
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

type VehicleRow = {
  id: string;
  regNumber: string;
  name: string;
  type: VehicleType;
  maxLoadKg: number;
  odometerKm: number;
  acquisitionCost: number;
};

const TYPES: VehicleType[] = ["truck", "van", "mini", "bike"];

export function VehicleDialog({ vehicle }: { vehicle?: VehicleRow }) {
  const isEdit = !!vehicle;
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    isEdit ? updateVehicle : createVehicle,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Pencil className="size-3.5" /> Edit
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" /> Add Vehicle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          {isEdit && <input type="hidden" name="id" value={vehicle.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="regNumber">Reg number</Label>
            <Input
              id="regNumber"
              name="regNumber"
              defaultValue={vehicle?.regNumber}
              placeholder="MH-04-AB-1234"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={vehicle?.name}
              placeholder="Tata Ace Gold"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={vehicle?.type ?? "truck"}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxLoadKg">Capacity (kg)</Label>
              <Input
                id="maxLoadKg"
                name="maxLoadKg"
                type="number"
                defaultValue={vehicle?.maxLoadKg}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="odometerKm">Odometer (km)</Label>
              <Input
                id="odometerKm"
                name="odometerKm"
                type="number"
                defaultValue={vehicle?.odometerKm ?? 0}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acquisitionCost">Cost (₹)</Label>
              <Input
                id="acquisitionCost"
                name="acquisitionCost"
                type="number"
                defaultValue={vehicle?.acquisitionCost}
                required
              />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
