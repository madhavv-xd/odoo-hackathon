import { vehicleEconomics } from "@/lib/reports";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OperationalCostChart, FuelEfficiencyChart } from "./charts";
import { ExportCsvButton } from "./export-csv-button";
import { InsightsCard } from "./insights-card";
import { Fuel, Gauge, DollarSign, TrendingUp } from "lucide-react";

const rupees = new Intl.NumberFormat("en-IN");

export default async function ReportsPage() {
  const economics = await vehicleEconomics();

  // Fleet-wide aggregates for the stat row
  const totalDistance = economics.reduce((s, e) => s + e.distanceKm, 0);
  const totalFuel = economics.reduce((s, e) => s + e.fuelL, 0);
  const totalOpCost = economics.reduce((s, e) => s + e.operationalCost, 0);
  const totalRevenue = economics.reduce((s, e) => s + e.revenue, 0);

  const avgFuelEfficiency = totalFuel > 0 ? totalDistance / totalFuel : null;

  // Fleet utilization — use the count of vehicles with at least one completed trip
  const vehiclesWithTrips = economics.filter((e) => e.distanceKm > 0).length;
  const fleetUtilization =
    economics.length > 0 ? (vehiclesWithTrips / economics.length) * 100 : 0;

  // Average ROI across vehicles that have a valid ROI
  const roiVehicles = economics.filter((e) => e.roiPct !== null);
  const avgRoi =
    roiVehicles.length > 0
      ? roiVehicles.reduce((s, e) => s + (e.roiPct ?? 0), 0) /
        roiVehicles.length
      : null;

  const stats = [
    {
      label: "Avg Fuel Efficiency",
      value: avgFuelEfficiency != null ? `${avgFuelEfficiency.toFixed(1)} km/L` : "—",
      icon: <Fuel className="size-4 text-muted-foreground" />,
      border: "border-t-[var(--chart-3)]",
    },
    {
      label: "Fleet Utilization",
      value: `${fleetUtilization.toFixed(1)}%`,
      icon: <Gauge className="size-4 text-muted-foreground" />,
      border: "border-t-[var(--chart-2)]",
    },
    {
      label: "Total Operational Cost",
      value: `₹${rupees.format(totalOpCost)}`,
      icon: <DollarSign className="size-4 text-muted-foreground" />,
      border: "border-t-[var(--chart-1)]",
    },
    {
      label: "Avg ROI",
      value: avgRoi != null ? `${avgRoi.toFixed(1)}%` : "—",
      icon: <TrendingUp className="size-4 text-muted-foreground" />,
      border: "border-t-[var(--chart-4)]",
    },
  ];

  // Chart data
  const chartData = economics.map((e) => ({
    regNumber: e.regNumber,
    name: e.name,
    operationalCost: e.operationalCost,
    kmPerL: e.kmPerL,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Fuel efficiency, utilization, operational cost, and ROI analysis.
          </p>
        </div>
        <ExportCsvButton />
      </div>

      {/* Stat Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg border border-border bg-card p-4 border-t-2 ${stat.border}`}
          >
            <div className="flex items-center justify-between mb-2">
              {stat.icon}
            </div>
            <p className="data text-2xl font-semibold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <OperationalCostChart data={chartData} />
        <FuelEfficiencyChart data={chartData} />
      </div>

      {/* AI Insights */}
      <InsightsCard />

      {/* Per-Vehicle Table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Per-Vehicle Breakdown</h2>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Distance (km)</TableHead>
                <TableHead className="text-right">Fuel (L)</TableHead>
                <TableHead className="text-right">km/L</TableHead>
                <TableHead className="text-right">Op. Cost (₹)</TableHead>
                <TableHead className="text-right">Revenue (₹)</TableHead>
                <TableHead className="text-right">ROI %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {economics.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No vehicle data available.
                  </TableCell>
                </TableRow>
              ) : (
                economics.map((e) => (
                  <TableRow key={e.vehicleId}>
                    <TableCell>
                      <span className="data font-medium">{e.regNumber}</span>{" "}
                      <span className="text-muted-foreground text-sm">
                        {e.name}
                      </span>
                    </TableCell>
                    <TableCell className="data text-right">
                      {rupees.format(e.distanceKm)}
                    </TableCell>
                    <TableCell className="data text-right">
                      {e.fuelL > 0 ? e.fuelL.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell className="data text-right">
                      {e.kmPerL != null ? e.kmPerL.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="data text-right">
                      ₹{rupees.format(e.operationalCost)}
                    </TableCell>
                    <TableCell className="data text-right">
                      ₹{rupees.format(e.revenue)}
                    </TableCell>
                    <TableCell
                      className={`data text-right font-medium ${
                        e.roiPct != null && e.roiPct >= 0
                          ? "text-status-available"
                          : e.roiPct != null
                            ? "text-status-error"
                            : ""
                      }`}
                    >
                      {e.roiPct != null ? `${e.roiPct.toFixed(1)}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {economics.length > 0 && (
              <tfoot>
                <TableRow className="border-t-2 border-border font-medium">
                  <TableCell>Fleet Total</TableCell>
                  <TableCell className="data text-right">
                    {rupees.format(totalDistance)}
                  </TableCell>
                  <TableCell className="data text-right">
                    {totalFuel.toFixed(1)}
                  </TableCell>
                  <TableCell className="data text-right">
                    {avgFuelEfficiency != null
                      ? avgFuelEfficiency.toFixed(2)
                      : "—"}
                  </TableCell>
                  <TableCell className="data text-right">
                    ₹{rupees.format(totalOpCost)}
                  </TableCell>
                  <TableCell className="data text-right">
                    ₹{rupees.format(totalRevenue)}
                  </TableCell>
                  <TableCell className="data text-right">
                    {avgRoi != null ? `${avgRoi.toFixed(1)}%` : "—"}
                  </TableCell>
                </TableRow>
              </tfoot>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}
