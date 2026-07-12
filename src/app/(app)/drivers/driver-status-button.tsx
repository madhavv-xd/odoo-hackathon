"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Ban, RotateCcw } from "lucide-react";
import { suspendDriver, reinstateDriver, type ActionState } from "./actions";
import type { DriverStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";

export function DriverStatusButton({
  id,
  status,
}: {
  id: string;
  status: DriverStatus;
}) {
  const suspended = status === "suspended";
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    suspended ? reinstateDriver : suspendDriver,
    {},
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      {suspended ? (
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={pending}
          className="gap-1.5 text-muted-foreground hover:text-status-available"
        >
          <RotateCcw className="size-3.5" /> Reinstate
        </Button>
      ) : (
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={pending}
          className="gap-1.5 text-muted-foreground hover:text-destructive"
        >
          <Ban className="size-3.5" /> Suspend
        </Button>
      )}
    </form>
  );
}
