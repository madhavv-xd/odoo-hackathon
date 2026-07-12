import type { VehicleStatus, DriverStatus } from "@/generated/prisma/enums";

export type StatusMeta = { label: string; dotClass: string };

// Dot colors follow context.md §8 status palette. off_duty isn't a §8 status
// color, so it uses a neutral/muted dot.
export const VEHICLE_STATUS_META: Record<VehicleStatus, StatusMeta> = {
  available: { label: "Available", dotClass: "bg-status-available" },
  on_trip: { label: "On Trip", dotClass: "bg-status-on-trip" },
  in_shop: { label: "In Shop", dotClass: "bg-status-warning" },
  retired: { label: "Retired", dotClass: "bg-status-error" },
};

export const DRIVER_STATUS_META: Record<DriverStatus, StatusMeta> = {
  available: { label: "Available", dotClass: "bg-status-available" },
  on_trip: { label: "On Trip", dotClass: "bg-status-on-trip" },
  off_duty: { label: "Off Duty", dotClass: "bg-muted-foreground" },
  suspended: { label: "Suspended", dotClass: "bg-status-error" },
};
