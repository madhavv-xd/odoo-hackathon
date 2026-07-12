/**
 * TransitOps demo seed (context.md §10). Run: `bun run seed`.
 *
 * Seeds 4 users, 8 vehicles, 6 drivers, 6 trips (draft, 2 dispatched,
 * 2 completed, cancelled), 3 maintenance logs,
 * ~12 fuel logs, ~8 expenses, with revenue on completed trips (non-zero ROI).
 *
 * NOTE: Van-05 and driver Alex are intentionally NOT seeded — the live pitch
 * registers them fresh, so leaving them out avoids a reg-number conflict.
 */
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const DAY = 86_400_000;
const daysFromNow = (d: number) => new Date(Date.now() + d * DAY);

async function main() {
  // Clear in FK-safe order.
  await db.fuelLog.deleteMany();
  await db.expense.deleteMany();
  await db.maintenanceLog.deleteMany();
  await db.trip.deleteMany();
  await db.vehicle.deleteMany();
  await db.driver.deleteMany();
  await db.user.deleteMany();

  // --- Users -----------------------------------------------------------------
  const passwordHash = await bcrypt.hash("demo1234", 10);
  await db.user.createMany({
    data: [
      { email: "manager@transitops.dev", name: "Priya Nair", role: "fleet_manager", passwordHash },
      { email: "dispatcher@transitops.dev", name: "Ravi Kumar", role: "dispatcher", passwordHash },
      { email: "safety@transitops.dev", name: "Anjali Menon", role: "safety_officer", passwordHash },
      { email: "finance@transitops.dev", name: "Karan Shah", role: "financial_analyst", passwordHash },
    ],
  });

  // --- Vehicles --------------------------------------------------------------
  const trk01 = await db.vehicle.create({ data: { regNumber: "MH-04-AB-1101", name: "Ashok Leyland Ecomet", type: "truck", maxLoadKg: 12000, odometerKm: 45000, acquisitionCost: 2500000, status: "available" } });
  const trk02 = await db.vehicle.create({ data: { regNumber: "MH-04-AB-1102", name: "Tata LPT 1613", type: "truck", maxLoadKg: 15000, odometerKm: 88000, acquisitionCost: 3200000, status: "on_trip" } });
  const van01 = await db.vehicle.create({ data: { regNumber: "MH-12-CD-2201", name: "Force Traveller", type: "van", maxLoadKg: 1200, odometerKm: 32000, acquisitionCost: 1400000, status: "available" } });
  const van02 = await db.vehicle.create({ data: { regNumber: "MH-12-CD-2202", name: "Mahindra Supro", type: "van", maxLoadKg: 800, odometerKm: 61000, acquisitionCost: 900000, status: "in_shop" } });
  const min01 = await db.vehicle.create({ data: { regNumber: "MH-14-EF-3301", name: "Tata Ace Gold", type: "mini", maxLoadKg: 750, odometerKm: 21000, acquisitionCost: 550000, status: "available" } });
  const min02 = await db.vehicle.create({ data: { regNumber: "MH-14-EF-3302", name: "Ashok Leyland Dost", type: "mini", maxLoadKg: 1000, odometerKm: 152000, acquisitionCost: 700000, status: "retired" } });
  const bik01 = await db.vehicle.create({ data: { regNumber: "MH-01-GH-4401", name: "Hero Courier 100", type: "bike", maxLoadKg: 150, odometerKm: 18000, acquisitionCost: 90000, status: "available" } });
  const bik02 = await db.vehicle.create({ data: { regNumber: "MH-01-GH-4402", name: "Honda Delivery 110", type: "bike", maxLoadKg: 120, odometerKm: 9000, acquisitionCost: 85000, status: "on_trip" } });

  // --- Drivers ---------------------------------------------------------------
  const ravi = await db.driver.create({ data: { name: "Ravi Kumar", licenseNumber: "MH0420110012345", licenseCategory: "HMV", licenseExpiry: daysFromNow(730), phone: "+91 98200 11223", safetyScore: 88, status: "available" } });
  const suresh = await db.driver.create({ data: { name: "Suresh Patel", licenseNumber: "MH1420080067890", licenseCategory: "HMV", licenseExpiry: daysFromNow(400), phone: "+91 98200 44556", safetyScore: 92, status: "on_trip" } });
  const amit = await db.driver.create({ data: { name: "Amit Sharma", licenseNumber: "MH0120150034512", licenseCategory: "LMV", licenseExpiry: daysFromNow(-30), phone: "+91 98200 77889", safetyScore: 70, status: "available" } });
  const deepak = await db.driver.create({ data: { name: "Deepak Singh", licenseNumber: "MH1220120098765", licenseCategory: "LMV", licenseExpiry: daysFromNow(20), phone: "+91 98200 33221", safetyScore: 81, status: "available" } });
  const vikram = await db.driver.create({ data: { name: "Vikram Rao", licenseNumber: "MH0420100011224", licenseCategory: "HMV", licenseExpiry: daysFromNow(1000), phone: "+91 98200 66554", safetyScore: 58, status: "suspended" } });
  const manoj = await db.driver.create({ data: { name: "Manoj Gupta", licenseNumber: "MH0120160055667", licenseCategory: "MCWG", licenseExpiry: daysFromNow(500), phone: "+91 98200 99001", safetyScore: 95, status: "on_trip" } });

  // --- Trips -----------------------------------------------------------------
  // Two dispatched (match on_trip vehicles/drivers).
  await db.trip.create({ data: { source: "Mumbai", destination: "Pune", vehicleId: trk02.id, driverId: suresh.id, cargoWeightKg: 8000, plannedDistanceKm: 150, status: "dispatched", startOdometer: 88000, dispatchedAt: new Date(Date.now() - 2 * 3_600_000) } });
  await db.trip.create({ data: { source: "Andheri", destination: "Bandra", vehicleId: bik02.id, driverId: manoj.id, cargoWeightKg: 80, plannedDistanceKm: 15, status: "dispatched", startOdometer: 9000, dispatchedAt: new Date(Date.now() - 45 * 60_000) } });

  // Two completed (revenue + fuel; endOdometer == current vehicle odo).
  const tripC = await db.trip.create({ data: { source: "Mumbai", destination: "Nashik", vehicleId: trk01.id, driverId: ravi.id, cargoWeightKg: 9000, plannedDistanceKm: 170, status: "completed", startOdometer: 44830, endOdometer: 45000, fuelConsumedL: 42, revenue: 45000, dispatchedAt: daysFromNow(-2), completedAt: daysFromNow(-1) } });
  const tripD = await db.trip.create({ data: { source: "Pune", destination: "Mumbai", vehicleId: van01.id, driverId: deepak.id, cargoWeightKg: 900, plannedDistanceKm: 150, status: "completed", startOdometer: 31850, endOdometer: 32000, fuelConsumedL: 18, revenue: 22000, dispatchedAt: daysFromNow(-3), completedAt: daysFromNow(-2) } });

  // One draft (pending dispatch).
  await db.trip.create({ data: { source: "Thane", destination: "Kalyan", vehicleId: min01.id, driverId: ravi.id, cargoWeightKg: 600, plannedDistanceKm: 40, status: "draft" } });

  // One cancelled (vehicle + driver were released back to available).
  await db.trip.create({ data: { source: "Mumbai", destination: "Lonavala", vehicleId: bik01.id, driverId: deepak.id, cargoWeightKg: 100, plannedDistanceKm: 65, status: "cancelled", cancelledAt: new Date(Date.now() - 6 * 3_600_000) } });

  // --- Maintenance logs (3) --------------------------------------------------
  await db.maintenanceLog.create({ data: { vehicleId: van02.id, description: "Clutch assembly replacement", cost: 18000, status: "open" } }); // keeps VAN-02 in_shop
  await db.maintenanceLog.create({ data: { vehicleId: min02.id, description: "Engine overhaul (pre-retirement)", cost: 45000, status: "closed", closedAt: daysFromNow(-40) } });
  await db.maintenanceLog.create({ data: { vehicleId: trk01.id, description: "Oil change + filter replacement", cost: 4500, status: "closed", closedAt: daysFromNow(-10) } });

  // --- Fuel logs (~12) -------------------------------------------------------
  await db.fuelLog.createMany({
    data: [
      // Auto-created equivalents for completed trips (with tripId).
      { vehicleId: trk01.id, tripId: tripC.id, liters: 42, cost: 4032, date: daysFromNow(-1) },
      { vehicleId: van01.id, tripId: tripD.id, liters: 18, cost: 1728, date: daysFromNow(-2) },
      // Historical standalone fills.
      { vehicleId: trk01.id, liters: 60, cost: 5760, date: daysFromNow(-8) },
      { vehicleId: trk02.id, liters: 75, cost: 7200, date: daysFromNow(-5) },
      { vehicleId: trk02.id, liters: 68, cost: 6528, date: daysFromNow(-12) },
      { vehicleId: van01.id, liters: 22, cost: 2112, date: daysFromNow(-9) },
      { vehicleId: van02.id, liters: 20, cost: 1920, date: daysFromNow(-15) },
      { vehicleId: min01.id, liters: 15, cost: 1440, date: daysFromNow(-6) },
      { vehicleId: min01.id, liters: 14, cost: 1344, date: daysFromNow(-18) },
      { vehicleId: bik01.id, liters: 6, cost: 576, date: daysFromNow(-4) },
      { vehicleId: bik02.id, liters: 5, cost: 480, date: daysFromNow(-3) },
      { vehicleId: min02.id, liters: 16, cost: 1536, date: daysFromNow(-50) },
    ],
  });

  // --- Expenses (~8) ---------------------------------------------------------
  await db.expense.createMany({
    data: [
      { vehicleId: trk01.id, category: "toll", amount: 850, note: "Mumbai-Nashik expressway toll", date: daysFromNow(-1) },
      { vehicleId: trk02.id, category: "toll", amount: 620, note: "Mumbai-Pune expressway toll", date: daysFromNow(-2) },
      { vehicleId: van01.id, category: "misc", amount: 300, note: "Parking + cleaning", date: daysFromNow(-2) },
      { vehicleId: van02.id, category: "maintenance", amount: 2500, note: "Brake pads (external)", date: daysFromNow(-14) },
      { vehicleId: min01.id, category: "toll", amount: 120, note: "City toll", date: daysFromNow(-6) },
      { vehicleId: bik01.id, category: "misc", amount: 150, note: "Delivery bags", date: daysFromNow(-4) },
      { vehicleId: trk01.id, category: "misc", amount: 500, note: "Driver allowance", date: daysFromNow(-8) },
      { vehicleId: trk02.id, category: "maintenance", amount: 3200, note: "Tyre rotation", date: daysFromNow(-11) },
    ],
  });

  const counts = {
    users: await db.user.count(),
    vehicles: await db.vehicle.count(),
    drivers: await db.driver.count(),
    trips: await db.trip.count(),
    maintenance: await db.maintenanceLog.count(),
    fuelLogs: await db.fuelLog.count(),
    expenses: await db.expense.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
