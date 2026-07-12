"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Send, XCircle } from "lucide-react";
import { dispatchTrip, cancelTrip, type ActionState } from "./actions";
import type { TripStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { CompleteTripDialog } from "./complete-trip-dialog";

function BoundActionButton({
  id,
  action,
  children,
  className,
}: {
  id: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
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
        className={className}
      >
        {children}
      </Button>
    </form>
  );
}

export function TripRowActions({
  id,
  status,
  startOdometer,
  regNumber,
}: {
  id: string;
  status: TripStatus;
  startOdometer: number | null;
  regNumber: string;
}) {
  if (status === "draft") {
    return (
      <div className="flex items-center justify-end gap-1">
        <BoundActionButton
          id={id}
          action={dispatchTrip}
          className="gap-1.5 text-status-on-trip"
        >
          <Send className="size-3.5" /> Dispatch
        </BoundActionButton>
        <BoundActionButton
          id={id}
          action={cancelTrip}
          className="gap-1.5 text-muted-foreground hover:text-destructive"
        >
          <XCircle className="size-3.5" /> Cancel
        </BoundActionButton>
      </div>
    );
  }
  if (status === "dispatched") {
    return (
      <div className="flex items-center justify-end gap-1">
        <CompleteTripDialog
          tripId={id}
          startOdometer={startOdometer}
          regNumber={regNumber}
        />
        <BoundActionButton
          id={id}
          action={cancelTrip}
          className="gap-1.5 text-muted-foreground hover:text-destructive"
        >
          <XCircle className="size-3.5" /> Cancel
        </BoundActionButton>
      </div>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}
