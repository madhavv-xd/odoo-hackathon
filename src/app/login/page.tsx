import { Truck } from "lucide-react";
import { LoginForm } from "./login-form";

const ROLES = [
  { name: "Fleet Manager", desc: "Vehicles, maintenance, full visibility" },
  { name: "Dispatcher", desc: "Create, dispatch & complete trips" },
  { name: "Safety Officer", desc: "Driver profiles & license validity" },
  { name: "Financial Analyst", desc: "Fuel, expenses, reports & analytics" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between bg-sidebar p-10 lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Truck className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            TransitOps
          </span>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold leading-tight">
              Smart transport
              <br />
              operations console
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Vehicles, drivers, dispatch, maintenance and expenses — with every
              business rule enforced in the database, not the UI.
            </p>
          </div>

          <ul className="space-y-3">
            {ROLES.map((r) => (
              <li key={r.name} className="flex items-start gap-3">
                <span className="mt-1.5 size-1.5 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Built on Bun · Next.js · Neon
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8">
        <LoginForm />
      </div>
    </div>
  );
}
