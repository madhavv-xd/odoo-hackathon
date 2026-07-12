import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DRIVER_STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/app/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DriverDialog } from "./driver-dialog";
import { DriverStatusButton } from "./driver-status-button";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const DAY = 86_400_000;

function ExpiryCell({ expiry }: { expiry: Date }) {
  const days = Math.ceil((expiry.getTime() - Date.now()) / DAY);
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="data text-status-error">{dateFmt.format(expiry)}</span>
        <span className="data rounded bg-status-error/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-status-error">
          Expired
        </span>
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="data text-status-error">{dateFmt.format(expiry)}</span>
        <span className="data rounded bg-status-error/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-status-error">
          Expires in {days}d
        </span>
      </span>
    );
  }
  return <span className="data">{dateFmt.format(expiry)}</span>;
}

function SafetyBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-status-available"
      : score >= 50
        ? "bg-status-warning"
        : "bg-status-error";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="data text-xs text-muted-foreground">{score}</span>
    </div>
  );
}

export default async function DriversPage() {
  const session = await getSession();
  const canManage =
    session?.role === "fleet_manager" || session?.role === "safety_officer";
  const canSuspend = session?.role === "safety_officer";
  const showActions = canManage || canSuspend;

  const drivers = await db.driver.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Drivers</h1>
          <p className="text-sm text-muted-foreground">
            {drivers.length} driver{drivers.length === 1 ? "" : "s"} on record
          </p>
        </div>
        {canManage && <DriverDialog />}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>License No.</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Safety</TableHead>
              <TableHead>Status</TableHead>
              {showActions && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="data">{d.licenseNumber}</TableCell>
                <TableCell>{d.licenseCategory}</TableCell>
                <TableCell>
                  <ExpiryCell expiry={d.licenseExpiry} />
                </TableCell>
                <TableCell className="data text-muted-foreground">
                  {d.phone}
                </TableCell>
                <TableCell>
                  <SafetyBar score={d.safetyScore} />
                </TableCell>
                <TableCell>
                  <StatusBadge meta={DRIVER_STATUS_META[d.status]} />
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canManage && (
                        <DriverDialog
                          driver={{
                            id: d.id,
                            name: d.name,
                            licenseNumber: d.licenseNumber,
                            licenseCategory: d.licenseCategory,
                            licenseExpiry: d.licenseExpiry
                              .toISOString()
                              .slice(0, 10),
                            phone: d.phone,
                            safetyScore: d.safetyScore,
                          }}
                        />
                      )}
                      {canSuspend && (
                        <DriverStatusButton id={d.id} status={d.status} />
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
