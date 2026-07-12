import { db } from "@/lib/db";

// The dispatch pool = vehicles/drivers eligible to be assigned to a new trip.
// Used both to populate the trip form's selects AND re-checked inside the
// dispatch transaction (context.md §5 rules 2 & 3). Keep the where-clauses here
// so the UI and the server-side enforcement can never drift apart.

export function availableVehicles() {
  return db.vehicle.findMany({
    where: { status: "available" },
    orderBy: { regNumber: "asc" },
  });
}

export function availableDrivers() {
  return db.driver.findMany({
    where: { status: "available", licenseExpiry: { gt: new Date() } },
    orderBy: { name: "asc" },
  });
}
