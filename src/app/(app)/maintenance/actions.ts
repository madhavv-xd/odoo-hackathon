"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export type ActionState = { error?: string; success?: string };

function revalidateAll() {
  for (const p of ["/dashboard", "/vehicles", "/drivers", "/trips", "/maintenance"]) {
    revalidatePath(p);
  }
}

const openSchema = z.object({
  vehicleId: z.string().trim().min(1, "Select a vehicle"),
  description: z.string().trim().min(1, "Description is required"),
  cost: z.coerce.number().int().nonnegative(),
});

export async function openMaintenanceLog(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["fleet_manager"]);
  const parsed = openSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    description: formData.get("description"),
    cost: formData.get("cost"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const regNumber = await db.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: parsed.data.vehicleId },
      });
      if (!vehicle) throw new Error("Vehicle not found");
      if (vehicle.status === "retired") {
        throw new Error("Cannot open maintenance on a retired vehicle");
      }
      await tx.maintenanceLog.create({
        data: {
          vehicleId: parsed.data.vehicleId,
          description: parsed.data.description,
          cost: parsed.data.cost,
          status: "open",
        },
      });
      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { status: "in_shop" },
      });
      return vehicle.regNumber;
    });

    revalidateAll();
    return { success: `Opened — ${regNumber} → In Shop` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not open log" };
  }
}

export async function closeMaintenanceLog(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["fleet_manager"]);
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing log id" };

  try {
    const result = await db.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findUnique({ where: { id } });
      if (!log) throw new Error("Log not found");
      if (log.status === "closed") throw new Error("Log is already closed");

      await tx.maintenanceLog.update({
        where: { id },
        data: { status: "closed", closedAt: new Date() },
      });

      const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
      if (!vehicle) throw new Error("Vehicle not found");
      // Rule 10: back to available UNLESS retired.
      if (vehicle.status !== "retired") {
        await tx.vehicle.update({
          where: { id: vehicle.id },
          data: { status: "available" },
        });
      }
      return { regNumber: vehicle.regNumber, retired: vehicle.status === "retired" };
    });

    revalidateAll();
    return {
      success: result.retired
        ? `Closed — ${result.regNumber} stays Retired`
        : `Closed — ${result.regNumber} → Available`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not close log" };
  }
}
