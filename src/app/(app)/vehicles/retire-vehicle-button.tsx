"use client";

import { Ban } from "lucide-react";
import { retireVehicle } from "./actions";
import { ConfirmButton } from "@/components/app/confirm-button";

export function RetireVehicleButton({ id }: { id: string }) {
  return (
    <ConfirmButton
      id={id}
      action={retireVehicle}
      trigger={
        <>
          <Ban className="size-3.5" /> Retire
        </>
      }
      triggerClassName="gap-1.5 text-muted-foreground hover:text-destructive"
      title="Retire this vehicle?"
      description="It will be removed from the dispatch pool permanently and can no longer be assigned to trips."
      confirmLabel="Retire vehicle"
    />
  );
}
