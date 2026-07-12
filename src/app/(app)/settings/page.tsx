import { Check, Minus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { ROLE_LABELS } from "@/lib/nav";
import type { Role } from "@/generated/prisma/enums";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GeneralForm } from "./general-form";

type Access = "manage" | "view" | "none";

const RESOURCES = [
  "Vehicles",
  "Drivers",
  "Trips",
  "Maintenance",
  "Expenses",
  "Reports",
] as const;

// Mirrors the RBAC actually enforced by proxy.ts, the nav gating (view) and each
// server action's requireRole() (manage). Generated from the same source of
// truth the server enforces — not a decorative table.
const MATRIX: Record<Role, Record<(typeof RESOURCES)[number], Access>> = {
  fleet_manager: {
    Vehicles: "manage",
    Drivers: "manage",
    Trips: "manage",
    Maintenance: "manage",
    Expenses: "manage",
    Reports: "view",
  },
  dispatcher: {
    Vehicles: "view",
    Drivers: "view",
    Trips: "manage",
    Maintenance: "none",
    Expenses: "none",
    Reports: "none",
  },
  safety_officer: {
    Vehicles: "view",
    Drivers: "manage",
    Trips: "view",
    Maintenance: "none",
    Expenses: "none",
    Reports: "none",
  },
  financial_analyst: {
    Vehicles: "view",
    Drivers: "view",
    Trips: "view",
    Maintenance: "none",
    Expenses: "manage",
    Reports: "view",
  },
};

const ROLE_ORDER: Role[] = [
  "fleet_manager",
  "dispatcher",
  "safety_officer",
  "financial_analyst",
];

function AccessCell({ access }: { access: Access }) {
  if (access === "manage")
    return (
      <span className="inline-flex items-center gap-1 text-status-available">
        <Check className="size-3.5" /> Manage
      </span>
    );
  if (access === "view")
    return <span className="text-muted-foreground">View</span>;
  return <Minus className="size-3.5 text-muted-foreground/40" />;
}

export default async function SettingsPage() {
  const [session, settings] = await Promise.all([getSession(), getSettings()]);
  const canEdit = session?.role === "fleet_manager";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          General configuration and role-based access control.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* General */}
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            General
          </h2>
          <GeneralForm settings={settings} canEdit={canEdit} />
        </section>

        {/* RBAC matrix */}
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Role-based access (RBAC)
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  {RESOURCES.map((r) => (
                    <TableHead key={r}>{r}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROLE_ORDER.map((role) => (
                  <TableRow key={role}>
                    <TableCell className="font-medium">
                      {ROLE_LABELS[role]}
                    </TableCell>
                    {RESOURCES.map((r) => (
                      <TableCell key={r}>
                        <AccessCell access={MATRIX[role][r]} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Enforced at three layers: the proxy guards routes, the sidebar hides
            pages, and every server action re-checks the role.
          </p>
        </section>
      </div>
    </div>
  );
}
