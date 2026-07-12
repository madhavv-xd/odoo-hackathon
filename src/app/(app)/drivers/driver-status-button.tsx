"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, Ban } from "lucide-react";
import { suspendDriver, reinstateDriver, type ActionState } from "./actions";
import type { DriverStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/app/confirm-button";

export function DriverStatusButton({
  id,
  status,
}: {
  id: string;
  status: DriverStatus;
}) {
  const suspended = status === "suspended";
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    reinstateDriver,
    {},
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    else if (state.error) toast.error(state.error);
  }, [state]);

  if (suspended) {
    return (
      <form action={formAction} className="inline">
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={pending}
          className="gap-1.5 text-muted-foreground hover:text-status-available"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RotateCcw className="size-3.5" />
          )}{" "}
          Reinstate
        </Button>
      </form>
    );
  }

  return (
    <ConfirmButton
      id={id}
      action={suspendDriver}
      trigger={
        <>
          <Ban className="size-3.5" /> Suspend
        </>
      }
      triggerClassName="gap-1.5 text-muted-foreground hover:text-destructive"
      title="Suspend this driver?"
      description="They will be blocked from being assigned to any new trips until reinstated."
      confirmLabel="Suspend driver"
    />
  );
}
