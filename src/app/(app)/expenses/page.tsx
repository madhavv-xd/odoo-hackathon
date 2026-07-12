import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { vehicleEconomics } from "@/lib/reports";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FuelLogDialog } from "./fuel-log-dialog";
import { ExpenseDialog } from "./expense-dialog";

const rupees = new Intl.NumberFormat("en-IN");
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function ExpensesPage() {
  const session = await getSession();
  const canWrite =
    session?.role === "fleet_manager" || session?.role === "financial_analyst";

  const [vehicles, fuelLogs, expenses, economics] = await Promise.all([
    db.vehicle.findMany({
      where: { status: { not: "retired" } },
      orderBy: { regNumber: "asc" },
      select: { id: true, regNumber: true, name: true },
    }),
    db.fuelLog.findMany({
      orderBy: { date: "desc" },
      include: { vehicle: { select: { regNumber: true, name: true } } },
    }),
    db.expense.findMany({
      orderBy: { date: "desc" },
      include: { vehicle: { select: { regNumber: true, name: true } } },
    }),
    vehicleEconomics(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Fuel logs, expenses, and per-vehicle operational cost rollup.
          </p>
        </div>
        {canWrite && (
          <div className="flex items-center gap-2">
            <FuelLogDialog vehicles={vehicles} />
            <ExpenseDialog vehicles={vehicles} />
          </div>
        )}
      </div>

      <Tabs defaultValue="fuel-logs">
        <TabsList>
          <TabsTrigger value="fuel-logs">
            Fuel Logs ({fuelLogs.length})
          </TabsTrigger>
          <TabsTrigger value="expenses">
            Other Expenses ({expenses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fuel-logs" className="mt-4">
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Liters</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No fuel logs yet — add one to start tracking.
                    </TableCell>
                  </TableRow>
                ) : (
                  fuelLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <span className="data font-medium">
                          {log.vehicle.regNumber}
                        </span>{" "}
                        <span className="text-muted-foreground text-sm">
                          {log.vehicle.name}
                        </span>
                      </TableCell>
                      <TableCell className="data text-right">
                        {log.liters.toFixed(1)} L
                      </TableCell>
                      <TableCell className="data text-right">
                        ₹{rupees.format(log.cost)}
                      </TableCell>
                      <TableCell className="data text-sm">
                        {dateFmt.format(log.date)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No expenses yet — add one to start tracking.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>
                        <span className="data font-medium">
                          {exp.vehicle.regNumber}
                        </span>{" "}
                        <span className="text-muted-foreground text-sm">
                          {exp.vehicle.name}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize">{exp.category}</TableCell>
                      <TableCell className="data text-right">
                        ₹{rupees.format(exp.amount)}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {exp.note}
                      </TableCell>
                      <TableCell className="data text-sm">
                        {dateFmt.format(exp.date)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Per-vehicle operational cost rollup */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Per-Vehicle Operational Cost
        </h2>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Fuel Cost</TableHead>
                <TableHead className="text-right">Maintenance</TableHead>
                <TableHead className="text-right">Other Expenses</TableHead>
                <TableHead className="text-right">Total Op. Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {economics.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
                      ₹{rupees.format(e.fuelCost)}
                    </TableCell>
                    <TableCell className="data text-right">
                      ₹{rupees.format(e.maintenanceCost)}
                    </TableCell>
                    <TableCell className="data text-right">
                      ₹{rupees.format(e.expenseCost)}
                    </TableCell>
                    <TableCell className="data text-right font-medium">
                      ₹{rupees.format(e.operationalCost)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
