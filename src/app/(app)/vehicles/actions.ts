"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export type ActionState = { error?: string; success?: string };

const vehicleSchema = z.object({
  regNumber: z.string().trim().min(1, "Reg number is required"),
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(["truck", "van", "mini", "bike"]),
  maxLoadKg: z.coerce.number().int().positive("Capacity must be > 0"),
  odometerKm: z.coerce.number().int().nonnegative(),
  acquisitionCost: z.coerce.number().int().nonnegative(),
});

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

function parse(formData: FormData) {
  return vehicleSchema.safeParse({
    regNumber: formData.get("regNumber"),
    name: formData.get("name"),
    type: formData.get("type"),
    maxLoadKg: formData.get("maxLoadKg"),
    odometerKm: formData.get("odometerKm"),
    acquisitionCost: formData.get("acquisitionCost"),
  });
}

export async function createVehicle(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["fleet_manager"]);
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    await db.vehicle.create({ data: parsed.data });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: `${parsed.data.regNumber} is already registered` };
    }
    return { error: "Could not create vehicle" };
  }
  revalidatePath("/vehicles");
  return { success: `${parsed.data.regNumber} added` };
}

export async function updateVehicle(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["fleet_manager"]);
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing vehicle id" };
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    await db.vehicle.update({ where: { id }, data: parsed.data });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: `${parsed.data.regNumber} is already registered` };
    }
    return { error: "Could not update vehicle" };
  }
  revalidatePath("/vehicles");
  return { success: `${parsed.data.regNumber} updated` };
}

export async function retireVehicle(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["fleet_manager"]);
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing vehicle id" };
  const vehicle = await db.vehicle.update({
    where: { id },
    data: { status: "retired" },
  });
  revalidatePath("/vehicles");
  return { success: `${vehicle.regNumber} retired` };
}
