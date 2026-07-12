"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import { retireVehicle, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";

export function RetireVehicleButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    retireVehicle,
    {},
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        className="gap-1.5 text-muted-foreground hover:text-destructive"
      >
        <Ban className="size-3.5" /> Retire
      </Button>
    </form>
  );
}
