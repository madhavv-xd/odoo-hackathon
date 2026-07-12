import { Truck, Sparkles } from "lucide-react";
import { LoginForm } from "./login-form";
import { LiveOpsPanel } from "./live-ops-panel";

const ROLES = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — a live ops console, not a marketing splash */}
      <div className="hidden flex-col justify-between bg-sidebar p-12 lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Truck className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">TransitOps</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <span className="data text-xs uppercase tracking-[0.2em] text-primary">
              Fleet Operations Console
            </span>
            <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight">
              The console your
              <br />
              fleet runs on.
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Vehicles, drivers, dispatch, maintenance and expenses — every
              business rule enforced in the database, not just the UI.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Now with an AI dispatch copilot
            </span>
          </div>

          <LiveOpsPanel />
        </div>

        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="data tracking-wide">{ROLES.join("  ·  ")}</span>
          <span>Bun · Next.js · Neon</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8">
        <LoginForm />
      </div>
    </div>
  );
}
