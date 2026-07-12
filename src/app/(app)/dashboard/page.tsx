import { getSimpleDashboardKPIs, getAttentionPanel } from "@/lib/dashboard";
import type { VehicleType } from "@/generated/prisma/enums";
import { DashboardFilters } from "./filters";
import { BriefingCard } from "./briefing-card";
import { ActivityTimeline } from "./activity-timeline";
import {
  Truck,
  CheckCircle,
  Wrench,
  Navigation,
  FileText,
  Users,
  Gauge,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from "lucide-react";

const VEHICLE_TYPES = ["truck", "van", "mini", "bike"];

type KpiCard = {
  label: string;
  value: string;
  borderColor: string;
  icon: React.ReactNode;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const filters: { type?: VehicleType } = {};
  if (type && VEHICLE_TYPES.includes(type)) filters.type = type as VehicleType;

  const [kpis, attention] = await Promise.all([
    getSimpleDashboardKPIs(filters),
    getAttentionPanel(),
  ]);

  const cards: KpiCard[] = [
    {
      label: "Active Vehicles",
      value: String(kpis.activeVehicles),
      borderColor: "border-t-[var(--status-on-trip)]",
      icon: <Truck className="size-4 text-muted-foreground" />,
    },
    {
      label: "Available Vehicles",
      value: String(kpis.availableVehicles),
      borderColor: "border-t-[var(--status-available)]",
      icon: <CheckCircle className="size-4 text-muted-foreground" />,
    },
    {
      label: "In Maintenance",
      value: String(kpis.inMaintenance),
      borderColor: "border-t-[var(--status-warning)]",
      icon: <Wrench className="size-4 text-muted-foreground" />,
    },
    {
      label: "Active Trips",
      value: String(kpis.activeTrips),
      borderColor: "border-t-[var(--status-on-trip)]",
      icon: <Navigation className="size-4 text-muted-foreground" />,
    },
    {
      label: "Pending Trips",
      value: String(kpis.pendingTrips),
      borderColor: "border-t-[var(--chart-5)]",
      icon: <FileText className="size-4 text-muted-foreground" />,
    },
    {
      label: "Drivers On Duty",
      value: String(kpis.driversOnDuty),
      borderColor: "border-t-[var(--status-on-trip)]",
      icon: <Users className="size-4 text-muted-foreground" />,
    },
    {
      label: "Fleet Utilization",
      value: `${kpis.fleetUtilization.toFixed(1)}%`,
      borderColor: "border-t-[var(--primary)]",
      icon: <Gauge className="size-4 text-muted-foreground" />,
    },
  ];

  const hasAttention =
    attention.expiringLicenses.length > 0 ||
    attention.inShopVehicles.length > 0 ||
    attention.draftTrips.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Fleet KPIs, utilization, and attention items.
          </p>
        </div>
        <DashboardFilters />
      </div>

      {/* AI Ops Briefing */}
      <BriefingCard />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border border-border bg-card p-4 border-t-2 ${card.borderColor}`}
          >
            <div className="flex items-center justify-between mb-2">
              {card.icon}
            </div>
            <p className="data text-2xl font-semibold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Utilization Bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">Fleet Utilization</h2>
          <span className="data text-sm text-muted-foreground">
            {kpis.fleetUtilization.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(kpis.fleetUtilization, 100)}%`,
              background:
                kpis.fleetUtilization > 80
                  ? "var(--status-error)"
                  : kpis.fleetUtilization > 50
                    ? "var(--status-warning)"
                    : "var(--status-available)",
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0%</span>
          <span>On Trip / (Total − Retired)</span>
          <span>100%</span>
        </div>
      </div>

      {/* Attention Panel */}
      {hasAttention && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-status-warning" />
            Attention Required
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Expiring / Expired Licenses */}
            {attention.expiringLicenses.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5" />
                  License Alerts ({attention.expiringLicenses.length})
                </h3>
                <ul className="space-y-1.5">
                  {attention.expiringLicenses.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-sm"
                    >
                      <span>{item.label}</span>
                      <span
                        className={`data text-xs font-medium ${
                          item.detail.startsWith("Expired")
                            ? "text-status-error"
                            : "text-status-warning"
                        }`}
                      >
                        {item.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Vehicles In Shop */}
            {attention.inShopVehicles.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Wrench className="size-3.5" />
                  In Shop ({attention.inShopVehicles.length})
                </h3>
                <ul className="space-y-1.5">
                  {attention.inShopVehicles.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-sm"
                    >
                      <span className="data font-medium">{item.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {item.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Draft Trips */}
            {attention.draftTrips.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  Pending Dispatch ({attention.draftTrips.length})
                </h3>
                <ul className="space-y-1.5">
                  {attention.draftTrips.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-sm"
                    >
                      <span className="text-xs">{item.label}</span>
                      <span className="data text-xs text-muted-foreground">
                        {item.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live activity timeline */}
      <ActivityTimeline />
    </div>
  );
}
