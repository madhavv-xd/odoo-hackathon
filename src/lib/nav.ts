import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Receipt,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/generated/prisma/enums";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
};

const ALL: Role[] = [
  "fleet_manager",
  "driver",
  "safety_officer",
  "financial_analyst",
];

// Single source of truth for sidebar items and page-level role gating.
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL },
  { label: "Vehicles", href: "/vehicles", icon: Truck, roles: ALL },
  { label: "Drivers", href: "/drivers", icon: Users, roles: ALL },
  { label: "Trips", href: "/trips", icon: Route, roles: ALL },
  {
    label: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
    roles: ["fleet_manager"],
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: Receipt,
    roles: ["fleet_manager", "financial_analyst"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["fleet_manager", "financial_analyst"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["fleet_manager"],
  },
];

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export const ROLE_LABELS: Record<Role, string> = {
  fleet_manager: "Fleet Manager",
  driver: "Driver",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};
