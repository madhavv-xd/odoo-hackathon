"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { completeTrip, type ActionState } from "./actions";
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

export function CompleteTripDialog({
  tripId,
  startOdometer,
  regNumber,
}: {
  tripId: string;
  startOdometer: number | null;
  regNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    completeTrip,
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
        <Button variant="ghost" size="sm" className="gap-1.5 text-status-available">
          <CheckCircle2 className="size-3.5" /> Complete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Complete trip · <span className="data">{regNumber}</span>
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={tripId} />
          <div className="space-y-1.5">
            <Label htmlFor="endOdometer">
              End odometer (km){" "}
              {startOdometer !== null && (
                <span className="data text-xs text-muted-foreground">
                  start {startOdometer}
                </span>
              )}
            </Label>
            <Input
              id="endOdometer"
              name="endOdometer"
              type="number"
              min={startOdometer !== null ? startOdometer + 1 : 0}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fuelConsumedL">Fuel consumed (L)</Label>
              <Input
                id="fuelConsumedL"
                name="fuelConsumedL"
                type="number"
                step="0.1"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="revenue">Revenue (₹)</Label>
              <Input id="revenue" name="revenue" type="number" required />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button type="submit" disabled={pending}>
              {pending ? "Completing…" : "Complete trip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
