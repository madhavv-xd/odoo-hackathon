"use server";

import { vehicleEconomics } from "@/lib/reports";
import { requireRole } from "@/lib/auth";

/**
 * Build CSV text from vehicleEconomics() — no library needed for ~10 rows.
 * Returns the raw CSV string; the client triggers the download.
 */
export async function exportReportsCsv(): Promise<string> {
  await requireRole([
    "fleet_manager",
    "financial_analyst",
    "safety_officer",
    "driver",
  ]);

  const data = await vehicleEconomics();

  const header = [
    "Reg Number",
    "Name",
    "Type",
    "Distance (km)",
    "Fuel (L)",
    "Fuel Efficiency (km/L)",
    "Fuel Cost (₹)",
    "Maintenance Cost (₹)",
    "Other Expenses (₹)",
    "Operational Cost (₹)",
    "Revenue (₹)",
    "ROI (%)",
  ].join(",");

  const rows = data.map((e) => {
    const fields = [
      csvField(e.regNumber),
      csvField(e.name),
      e.type,
      e.distanceKm,
      e.fuelL.toFixed(1),
      e.kmPerL != null ? e.kmPerL.toFixed(2) : "—",
      e.fuelCost,
      e.maintenanceCost,
      e.expenseCost,
      e.operationalCost,
      e.revenue,
      e.roiPct != null ? e.roiPct.toFixed(2) : "—",
    ];
    return fields.join(",");
  });

  return [header, ...rows].join("\n");
}

/** Wrap in quotes if the field contains a comma */
function csvField(value: string): string {
  return value.includes(",") ? `"${value}"` : value;
}
