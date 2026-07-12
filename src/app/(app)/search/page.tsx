import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { db } from "@/lib/db";
import {
  VEHICLE_STATUS_META,
  DRIVER_STATUS_META,
  TRIP_STATUS_META,
} from "@/lib/status";
import { StatusBadge } from "@/components/app/status-badge";

const num = new Intl.NumberFormat("en-IN");

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
        <Search className="mb-3 size-8" />
        <p>Type a query in the search bar above.</p>
      </div>
    );
  }

  const contains = { contains: query, mode: "insensitive" as const };

  const [vehicles, drivers, trips] = await Promise.all([
    db.vehicle.findMany({
      where: { OR: [{ regNumber: contains }, { name: contains }] },
      orderBy: { regNumber: "asc" },
      take: 20,
    }),
    db.driver.findMany({
      where: { OR: [{ name: contains }, { licenseNumber: contains }] },
      orderBy: { name: "asc" },
      take: 20,
    }),
    db.trip.findMany({
      where: { OR: [{ source: contains }, { destination: contains }] },
      orderBy: { createdAt: "desc" },
      include: { vehicle: { select: { regNumber: true } } },
      take: 20,
    }),
  ]);

  const total = vehicles.length + drivers.length + trips.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Search</h1>
        <p className="text-sm text-muted-foreground">
          {total} result{total === 1 ? "" : "s"} for{" "}
          <span className="text-foreground">“{query}”</span>
        </p>
      </div>

      {total === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Nothing matched. Try a reg number, driver name, or city.
        </div>
      )}

      {vehicles.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Vehicles ({vehicles.length})
          </h2>
          <div className="divide-y divide-border rounded-lg border border-border">
            {vehicles.map((v) => (
              <Link
                key={v.id}
                href={`/vehicles/${v.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <span className="flex items-center gap-3">
                  <span className="data font-medium">{v.regNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {v.name} · {v.type}
                  </span>
                </span>
                <StatusBadge meta={VEHICLE_STATUS_META[v.status]} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {drivers.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Drivers ({drivers.length})
          </h2>
          <div className="divide-y divide-border rounded-lg border border-border">
            {drivers.map((d) => (
              <Link
                key={d.id}
                href="/drivers"
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <span className="flex items-center gap-3">
                  <span className="font-medium">{d.name}</span>
                  <span className="data text-sm text-muted-foreground">
                    {d.licenseNumber}
                  </span>
                </span>
                <StatusBadge meta={DRIVER_STATUS_META[d.status]} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {trips.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Trips ({trips.length})
          </h2>
          <div className="divide-y divide-border rounded-lg border border-border">
            {trips.map((t) => (
              <Link
                key={t.id}
                href="/trips"
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <span className="flex items-center gap-2 text-sm">
                  {t.source}
                  <ArrowRight className="size-3 text-muted-foreground" />
                  {t.destination}
                  <span className="data ml-2 text-xs text-muted-foreground">
                    {t.vehicle.regNumber} · {num.format(t.plannedDistanceKm)} km
                  </span>
                </span>
                <StatusBadge meta={TRIP_STATUS_META[t.status]} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
