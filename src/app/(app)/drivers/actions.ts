"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export type ActionState = { error?: string; success?: string };

const driverSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  licenseNumber: z.string().trim().min(1, "License number is required"),
  licenseCategory: z.string().trim().min(1, "License category is required"),
  licenseExpiry: z.coerce.date(),
  phone: z.string().trim().min(1, "Phone is required"),
  safetyScore: z.coerce.number().int().min(0).max(100),
});

function parse(formData: FormData) {
  return driverSchema.safeParse({
    name: formData.get("name"),
    licenseNumber: formData.get("licenseNumber"),
    licenseCategory: formData.get("licenseCategory"),
    licenseExpiry: formData.get("licenseExpiry"),
    phone: formData.get("phone"),
    safetyScore: formData.get("safetyScore"),
  });
}

export async function createDriver(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["fleet_manager", "safety_officer"]);
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const driver = await db.driver.create({ data: parsed.data });
  revalidatePath("/drivers");
  return { success: `${driver.name} added` };
}

export async function updateDriver(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["fleet_manager", "safety_officer"]);
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing driver id" };
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const driver = await db.driver.update({ where: { id }, data: parsed.data });
  revalidatePath("/drivers");
  return { success: `${driver.name} updated` };
}

export async function suspendDriver(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["safety_officer"]);
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing driver id" };
  const driver = await db.driver.update({
    where: { id },
    data: { status: "suspended" },
  });
  revalidatePath("/drivers");
  return { success: `${driver.name} suspended` };
}

export async function reinstateDriver(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["safety_officer"]);
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing driver id" };
  const driver = await db.driver.update({
    where: { id },
    data: { status: "available" },
  });
  revalidatePath("/drivers");
  return { success: `${driver.name} reinstated` };
}
