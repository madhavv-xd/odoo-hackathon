"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck } from "lucide-react";
import { navForRole } from "@/lib/nav";
import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-border bg-sidebar">
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
  );
}
