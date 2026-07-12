import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MaintenanceDialog } from "./maintenance-dialog";
import { CloseLogButton } from "./close-log-button";

const rupees = new Intl.NumberFormat("en-IN");
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function MaintenancePage() {
  const session = await getSession();
  const canManage = session?.role === "fleet_manager";

  const [logs, vehicles] = await Promise.all([
    db.maintenanceLog.findMany({
      orderBy: { openedAt: "desc" },
      include: { vehicle: { select: { regNumber: true, name: true } } },
    }),
    // Only non-retired vehicles can enter the shop.
    db.vehicle.findMany({
      where: { status: { not: "retired" } },
      orderBy: { regNumber: "asc" },
      select: { id: true, regNumber: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            {logs.filter((l) => l.status === "open").length} open ·{" "}
            {logs.length} total
          </p>
        </div>
        {canManage && <MaintenanceDialog vehicles={vehicles} />}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Opened</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 6 : 5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No maintenance logs yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <span className="data">{l.vehicle.regNumber}</span>
                    <span className="ml-2 text-muted-foreground">
                      {l.vehicle.name}
                    </span>
                  </TableCell>
                  <TableCell>{l.description}</TableCell>
                  <TableCell className="data text-right">
                    ₹{rupees.format(l.cost)}
                  </TableCell>
                  <TableCell className="data text-muted-foreground">
                    {dateFmt.format(l.openedAt)}
                  </TableCell>
                  <TableCell>
                    {l.status === "open" ? (
                      <Badge className="bg-status-warning/15 text-status-warning">
                        OPEN
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        CLOSED
                      </Badge>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {l.status === "open" ? (
                        <CloseLogButton id={l.id} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
