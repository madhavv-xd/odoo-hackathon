import "server-only";
import { db } from "@/lib/db";

export type VehicleEcon = {
  vehicleId: string;
  regNumber: string;
  name: string;
  type: string;
  acquisitionCost: number;
  distanceKm: number;
  fuelL: number;
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  operationalCost: number;
  revenue: number;
  roiPct: number | null; // null when acquisitionCost=0
  kmPerL: number | null; // null when fuelL=0
};

/**
 * Per-vehicle economics computed from live data.
 * context.md §6 formulas:
 *   fuel efficiency = Σ distance / Σ fuel liters
 *   operational cost = Σ fuel cost + Σ maintenance cost + Σ expenses
 *   ROI % = (Σ revenue − (maintenance + fuel cost)) / acquisitionCost × 100
 *
 * Only completed trips count for distance & revenue.
 */
export async function vehicleEconomics(): Promise<VehicleEcon[]> {
  // Fetch all vehicles (including retired — they still have historical data)
  const vehicles = await db.vehicle.findMany({
    orderBy: { regNumber: "asc" },
    select: {
      id: true,
      regNumber: true,
      name: true,
      type: true,
      acquisitionCost: true,
    },
  });

  // Fetch completed trips grouped by vehicle for distance & revenue
  const trips = await db.trip.findMany({
    where: { status: "completed" },
    select: {
      vehicleId: true,
      startOdometer: true,
      endOdometer: true,
      revenue: true,
    },
  });

  // Fuel logs — all of them (not just trip-linked)
  const fuelLogs = await db.fuelLog.findMany({
    select: { vehicleId: true, liters: true, cost: true },
  });

  // Maintenance logs — all (cost is incurred regardless of open/closed)
  const maintenanceLogs = await db.maintenanceLog.findMany({
    select: { vehicleId: true, cost: true },
  });

  // Expenses
  const expenses = await db.expense.findMany({
    select: { vehicleId: true, amount: true },
  });

  // Aggregate per vehicle
  const tripsByVehicle = new Map<
    string,
    { distanceKm: number; revenue: number }
  >();
  for (const t of trips) {
    const acc = tripsByVehicle.get(t.vehicleId) ?? {
      distanceKm: 0,
      revenue: 0,
    };
    const distance =
      t.endOdometer != null && t.startOdometer != null
        ? t.endOdometer - t.startOdometer
        : 0;
    acc.distanceKm += distance;
    acc.revenue += t.revenue ?? 0;
    tripsByVehicle.set(t.vehicleId, acc);
  }

  const fuelByVehicle = new Map<string, { liters: number; cost: number }>();
  for (const f of fuelLogs) {
    const acc = fuelByVehicle.get(f.vehicleId) ?? { liters: 0, cost: 0 };
    acc.liters += f.liters;
    acc.cost += f.cost;
    fuelByVehicle.set(f.vehicleId, acc);
  }

  const maintByVehicle = new Map<string, number>();
  for (const m of maintenanceLogs) {
    maintByVehicle.set(
      m.vehicleId,
      (maintByVehicle.get(m.vehicleId) ?? 0) + m.cost,
    );
  }

  const expByVehicle = new Map<string, number>();
  for (const e of expenses) {
    expByVehicle.set(
      e.vehicleId,
      (expByVehicle.get(e.vehicleId) ?? 0) + e.amount,
    );
  }

  return vehicles.map((v) => {
    const trip = tripsByVehicle.get(v.id) ?? { distanceKm: 0, revenue: 0 };
    const fuel = fuelByVehicle.get(v.id) ?? { liters: 0, cost: 0 };
    const maint = maintByVehicle.get(v.id) ?? 0;
    const exp = expByVehicle.get(v.id) ?? 0;

    const operationalCost = fuel.cost + maint + exp;
    const kmPerL = fuel.liters > 0 ? trip.distanceKm / fuel.liters : null;
    const roiPct =
      v.acquisitionCost > 0
        ? ((trip.revenue - (maint + fuel.cost)) / v.acquisitionCost) * 100
        : null;

    return {
      vehicleId: v.id,
      regNumber: v.regNumber,
      name: v.name,
      type: v.type,
      acquisitionCost: v.acquisitionCost,
      distanceKm: trip.distanceKm,
      fuelL: fuel.liters,
      fuelCost: fuel.cost,
      maintenanceCost: maint,
      expenseCost: exp,
      operationalCost,
      revenue: trip.revenue,
      roiPct,
      kmPerL,
    };
  });
}
