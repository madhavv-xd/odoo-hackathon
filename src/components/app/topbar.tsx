import { LogOut } from "lucide-react";
import { logout } from "@/app/(app)/actions";
import { ROLE_LABELS } from "@/lib/nav";
import type { SessionUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Topbar({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
      <div className="text-sm text-muted-foreground">
        Signed in as <span className="text-foreground">{user.name}</span>
      </div>

      <div className="flex items-center gap-3">
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
