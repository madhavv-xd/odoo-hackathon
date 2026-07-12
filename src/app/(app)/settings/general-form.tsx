"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateSettings, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Settings = {
  depotName: string;
  currency: string;
  distanceUnit: string;
};

export function GeneralForm({
  settings,
  canEdit,
}: {
  settings: Settings;
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateSettings,
    {},
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="depotName">Depot name</Label>
        <Input
          id="depotName"
          name="depotName"
          defaultValue={settings.depotName}
          disabled={!canEdit}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Currency</Label>
        <Select name="currency" defaultValue={settings.currency} disabled={!canEdit}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INR">INR (₹)</SelectItem>
            <SelectItem value="USD">USD ($)</SelectItem>
            <SelectItem value="EUR">EUR (€)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Distance unit</Label>
        <Select
          name="distanceUnit"
          defaultValue={settings.distanceUnit}
          disabled={!canEdit}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="km">Kilometers</SelectItem>
            <SelectItem value="mi">Miles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {canEdit ? (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only Fleet Managers can change these settings.
        </p>
      )}
    </form>
  );
}
