"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck } from "lucide-react";
import { navForRole } from "@/lib/nav";
import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navForRole(role);
  const [open, setOpen] = useState(false);

  // Opened from the topbar hamburger (mobile only), decoupled via event.
  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    window.addEventListener("transitops:toggle-sidebar", toggle);
    return () => window.removeEventListener("transitops:toggle-sidebar", toggle);
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-sidebar transition-transform duration-200 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Truck className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">TransitOps</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  active &&
                    "border-primary bg-accent text-foreground [&_svg]:text-primary",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
