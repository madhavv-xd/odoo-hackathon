"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export type ActionState = { error?: string; success?: string };

// context.md §5 rule 7: fuel cost estimated at ₹96/L.
const FUEL_PRICE_PER_L = 96;

// Trip actions are usable by drivers (their core job) and fleet managers.
const TRIP_ROLES = ["dispatcher", "fleet_manager"] as const;

function revalidateAll() {
  // A single trip mutation changes vehicle + driver status shown elsewhere.
  for (const p of ["/dashboard", "/vehicles", "/drivers", "/trips", "/maintenance"]) {
    revalidatePath(p);
  }
}

const createSchema = z.object({
  source: z.string().trim().min(1, "Source is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  vehicleId: z.string().trim().min(1, "Select a vehicle"),
  driverId: z.string().trim().min(1, "Select a driver"),
  cargoWeightKg: z.coerce.number().int().positive("Cargo must be > 0"),
  plannedDistanceKm: z.coerce.number().int().positive("Distance must be > 0"),
});

export async function createTrip(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole([...TRIP_ROLES]);
  const parsed = createSchema.safeParse({
    source: formData.get("source"),
    destination: formData.get("destination"),
    vehicleId: formData.get("vehicleId"),
    driverId: formData.get("driverId"),
    cargoWeightKg: formData.get("cargoWeightKg"),
    plannedDistanceKm: formData.get("plannedDistanceKm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { vehicleId, driverId, cargoWeightKg } = parsed.data;

  const [vehicle, driver] = await Promise.all([
    db.vehicle.findUnique({ where: { id: vehicleId } }),
    db.driver.findUnique({ where: { id: driverId } }),
  ]);
  if (!vehicle || vehicle.status !== "available") {
    return { error: "Selected vehicle is no longer available" };
  }
  if (!driver || driver.status !== "available") {
    return { error: "Selected driver is no longer available" };
  }
  if (driver.licenseExpiry <= new Date()) {
    return {
      error: `${driver.name}'s license expired on ${driver.licenseExpiry
        .toISOString()
        .slice(0, 10)}`,
    };
  }
  if (cargoWeightKg > vehicle.maxLoadKg) {
    return {
      error: `Cargo ${cargoWeightKg} kg exceeds ${vehicle.name} capacity ${vehicle.maxLoadKg} kg`,
    };
  }

  await db.trip.create({ data: { ...parsed.data, status: "draft" } });
  revalidateAll();
  return { success: `Draft trip ${vehicle.regNumber} → ${parsed.data.destination} created` };
}

export async function dispatchTrip(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole([...TRIP_ROLES]);
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing trip id" };

  try {
    const regNumber = await db.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id } });
      if (!trip) throw new Error("Trip not found");
      if (trip.status !== "draft") throw new Error("Only draft trips can be dispatched");

      const vehicle = await tx.vehicle.findUnique({ where: { id: trip.vehicleId } });
      const driver = await tx.driver.findUnique({ where: { id: trip.driverId } });
      if (!vehicle || vehicle.status !== "available") {
        throw new Error("Vehicle is no longer available");
      }
      if (!driver || driver.status !== "available") {
        throw new Error("Driver is no longer available");
      }
      if (driver.licenseExpiry <= new Date()) {
        throw new Error(
          `${driver.name}'s license expired on ${driver.licenseExpiry
            .toISOString()
            .slice(0, 10)}`,
        );
      }
      if (trip.cargoWeightKg > vehicle.maxLoadKg) {
        throw new Error(
          `Cargo ${trip.cargoWeightKg} kg exceeds ${vehicle.name} capacity ${vehicle.maxLoadKg} kg`,
        );
      }

      await tx.trip.update({
        where: { id },
        data: {
          status: "dispatched",
          dispatchedAt: new Date(),
          startOdometer: vehicle.odometerKm,
        },
      });
      await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: "on_trip" } });
      await tx.driver.update({ where: { id: driver.id }, data: { status: "on_trip" } });
      return vehicle.regNumber;
    });

    revalidateAll();
    return { success: `${regNumber} → On Trip` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not dispatch trip" };
  }
}

const completeSchema = z.object({
  endOdometer: z.coerce.number().int().nonnegative(),
  fuelConsumedL: z.coerce.number().positive("Fuel must be > 0"),
  revenue: z.coerce.number().int().nonnegative(),
});

export async function completeTrip(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole([...TRIP_ROLES]);
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing trip id" };
  const parsed = completeSchema.safeParse({
    endOdometer: formData.get("endOdometer"),
    fuelConsumedL: formData.get("fuelConsumedL"),
    revenue: formData.get("revenue"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { endOdometer, fuelConsumedL, revenue } = parsed.data;

  try {
    const regNumber = await db.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id } });
      if (!trip) throw new Error("Trip not found");
      if (trip.status !== "dispatched") throw new Error("Only dispatched trips can be completed");
      if (trip.startOdometer !== null && endOdometer <= trip.startOdometer) {
        throw new Error(
          `End odometer ${endOdometer} must be greater than start ${trip.startOdometer}`,
        );
      }

      await tx.trip.update({
        where: { id },
        data: {
          status: "completed",
          completedAt: new Date(),
          endOdometer,
          fuelConsumedL,
          revenue,
        },
      });
      const vehicle = await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "available", odometerKm: endOdometer },
      });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "available" } });
      await tx.fuelLog.create({
        data: {
          vehicleId: trip.vehicleId,
          tripId: trip.id,
          liters: fuelConsumedL,
          cost: Math.round(fuelConsumedL * FUEL_PRICE_PER_L),
        },
      });
      return vehicle.regNumber;
    });

    revalidateAll();
    return { success: `${regNumber} → Available · trip completed` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not complete trip" };
  }
}

export async function cancelTrip(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole([...TRIP_ROLES]);
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing trip id" };

  try {
    await db.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id } });
      if (!trip) throw new Error("Trip not found");
      if (trip.status === "dispatched") {
        await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "available" } });
        await tx.driver.update({ where: { id: trip.driverId }, data: { status: "available" } });
      } else if (trip.status !== "draft") {
        throw new Error("Only draft or dispatched trips can be cancelled");
      }
      await tx.trip.update({ where: { id }, data: { status: "cancelled" } });
    });

    revalidateAll();
    return { success: "Trip cancelled" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not cancel trip" };
  }
}
