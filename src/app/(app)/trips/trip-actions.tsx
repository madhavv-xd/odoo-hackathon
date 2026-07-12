"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Send, XCircle } from "lucide-react";
import { dispatchTrip, cancelTrip, type ActionState } from "./actions";
import type { TripStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { CompleteTripDialog } from "./complete-trip-dialog";
import { ConfirmButton } from "@/components/app/confirm-button";

function BoundActionButton({
  id,
  action,
  icon,
  children,
  className,
}: {
  id: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  icon: React.ReactNode;
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
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : icon}
        {children}
      </Button>
    </form>
  );
}

function CancelTripButton({
  id,
  status,
}: {
  id: string;
  status: TripStatus;
}) {
  return (
    <ConfirmButton
      id={id}
      action={cancelTrip}
      trigger={
        <>
          <XCircle className="size-3.5" /> Cancel
        </>
      }
      triggerClassName="gap-1.5 text-muted-foreground hover:text-destructive"
      title="Cancel this trip?"
      description={
        status === "dispatched"
          ? "The trip will be marked cancelled and its vehicle and driver return to the available pool."
          : "This draft trip will be marked cancelled."
      }
      confirmLabel="Cancel trip"
    />
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
          icon={<Send className="size-3.5" />}
          className="gap-1.5 text-status-on-trip"
        >
          Dispatch
        </BoundActionButton>
        <CancelTripButton id={id} status={status} />
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
        <CancelTripButton id={id} status={status} />
      </div>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}
