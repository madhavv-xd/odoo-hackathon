"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export type ActionState = { error?: string; success?: string };

const schema = z.object({
  depotName: z.string().trim().min(1, "Depot name is required"),
  currency: z.enum(["INR", "USD", "EUR"]),
  distanceUnit: z.enum(["km", "mi"]),
});

export async function updateSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["fleet_manager"]);

  const parsed = schema.safeParse({
    depotName: formData.get("depotName"),
    currency: formData.get("currency"),
    distanceUnit: formData.get("distanceUnit"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.appSettings.upsert({
    where: { id: "app" },
    update: parsed.data,
    create: { id: "app", ...parsed.data },
  });

  revalidatePath("/settings");
  return { success: "Settings saved" };
}
