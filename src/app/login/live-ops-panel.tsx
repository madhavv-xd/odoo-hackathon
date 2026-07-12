"use client";

import { useEffect, useState } from "react";

// Illustrative sample telemetry shown on the login screen — the product's own
// "status transition is the magic moment" on display before you sign in.
const FEED = [
  { reg: "VAN-05", note: "Mumbai → Pune", tag: "ON TRIP", color: "var(--status-on-trip)" },
  { reg: "TRK-02", note: "maintenance closed", tag: "AVAILABLE", color: "var(--status-available)" },
  { reg: "MINI-07", note: "license expires in 18d", tag: "REVIEW", color: "var(--status-warning)" },
  { reg: "TRK-11", note: "Nagpur → Nashik", tag: "ON TRIP", color: "var(--status-on-trip)" },
];

const STATS = [
  { label: "Utilization", value: "68%" },
  { label: "Active trips", value: "5" },
  { label: "In shop", value: "1" },
];

export function LiveOpsPanel() {
  const [clock, setClock] = useState<string | null>(null);

  // Rendered client-side only to avoid an SSR/CSR hydration mismatch.
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-GB", { hour12: false }) + " IST",
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full max-w-md">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
        <span className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-available opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-status-available" />
          </span>
          <span className="data text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Live dispatch
          </span>
        </span>
        <span className="data text-[11px] text-muted-foreground tabular-nums">
          {clock ?? "—"}
        </span>
      </div>

      <ul className="space-y-2.5">
        {FEED.map((row, i) => (
          <li
            key={row.reg}
            className="flex items-center gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 fill-mode-both motion-reduce:animate-none"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: row.color }}
            />
            <span className="data text-xs font-medium">{row.reg}</span>
            <span className="truncate text-xs text-muted-foreground">
              {row.note}
            </span>
            <span
              className="data ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: row.color }}
            >
              {row.tag}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex gap-8">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="data text-lg font-semibold leading-none">{s.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
