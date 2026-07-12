import { LogOut, Search } from "lucide-react";
import { logout } from "@/app/(app)/actions";
import { ROLE_LABELS } from "@/lib/nav";
import type { SessionUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopilotButton } from "@/components/app/copilot-button";
import { SidebarToggle } from "@/components/app/sidebar-toggle";

export function Topbar({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarToggle />
        <form action="/search" className="relative hidden w-full max-w-sm md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search vehicles, drivers, trips…"
            className="h-9 pl-8"
            autoComplete="off"
          />
        </form>
      </div>

      <div className="flex items-center gap-3">
        <CopilotButton />
        <Badge
          variant="outline"
          className="border-primary/40 text-primary"
        >
          {ROLE_LABELS[user.role]}
        </Badge>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm" className="gap-2">
            <LogOut className="size-4" />
            Logout
          </Button>
        </form>
      </div>
    </header>
  );
}
