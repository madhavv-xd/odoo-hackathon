"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { createDriver, updateDriver, type ActionState } from "./actions";
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

type DriverRow = {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string; // YYYY-MM-DD
  phone: string;
  safetyScore: number;
};

export function DriverDialog({ driver }: { driver?: DriverRow }) {
  const isEdit = !!driver;
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    isEdit ? updateDriver : createDriver,
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
            <Plus className="size-4" /> Add Driver
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit driver" : "Add driver"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          {isEdit && <input type="hidden" name="id" value={driver.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={driver?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="licenseNumber">License number</Label>
              <Input
                id="licenseNumber"
                name="licenseNumber"
                defaultValue={driver?.licenseNumber}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="licenseCategory">Category</Label>
              <Input
                id="licenseCategory"
                name="licenseCategory"
                defaultValue={driver?.licenseCategory}
                placeholder="HMV / LMV / MCWG"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="licenseExpiry">License expiry</Label>
              <Input
                id="licenseExpiry"
                name="licenseExpiry"
                type="date"
                defaultValue={driver?.licenseExpiry}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="safetyScore">Safety score</Label>
              <Input
                id="safetyScore"
                name="safetyScore"
                type="number"
                min={0}
                max={100}
                defaultValue={driver?.safetyScore ?? 100}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={driver?.phone}
              placeholder="+91 98200 00000"
              required
            />
          </div>
          <DialogFooter showCloseButton>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add driver"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
