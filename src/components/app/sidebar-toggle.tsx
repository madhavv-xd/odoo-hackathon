"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Mobile-only hamburger that opens the sidebar drawer. */
export function SidebarToggle() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="md:hidden"
      aria-label="Open navigation"
      onClick={() => window.dispatchEvent(new Event("transitops:toggle-sidebar"))}
    >
      <Menu className="size-5" />
    </Button>
  );
}
