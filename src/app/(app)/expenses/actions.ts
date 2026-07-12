"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export type ActionState = { error?: string; success?: string };

const fuelLogSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  liters: z.coerce.number().positive("Liters must be > 0"),
  cost: z.coerce.number().int().nonnegative("Cost must be ≥ 0"),
  date: z.coerce.date(),
});

const expenseSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  category: z.enum(["toll", "maintenance", "misc"]),
  amount: z.coerce.number().int().positive("Amount must be > 0"),
  note: z.string().trim().min(1, "Note is required"),
  date: z.coerce.date(),
});

export async function createFuelLog(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["fleet_manager", "financial_analyst"]);
  const parsed = fuelLogSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    liters: formData.get("liters"),
    cost: formData.get("cost"),
    date: formData.get("date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const vehicle = await db.vehicle.findUnique({
    where: { id: parsed.data.vehicleId },
    select: { regNumber: true },
  });
  if (!vehicle) return { error: "Vehicle not found" };

  await db.fuelLog.create({ data: parsed.data });
  revalidatePath("/expenses");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { success: `Fuel log added for ${vehicle.regNumber}` };
}

export async function createExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["fleet_manager", "financial_analyst"]);
  const parsed = expenseSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    note: formData.get("note"),
    date: formData.get("date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const vehicle = await db.vehicle.findUnique({
    where: { id: parsed.data.vehicleId },
    select: { regNumber: true },
  });
  if (!vehicle) return { error: "Vehicle not found" };

  await db.expense.create({ data: parsed.data });
  revalidatePath("/expenses");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { success: `Expense added for ${vehicle.regNumber}` };
}
