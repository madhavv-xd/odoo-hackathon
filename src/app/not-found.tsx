import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Compass className="size-5" />
        </div>
        <p className="data text-3xl font-semibold">404</p>
        <h1 className="mt-1 text-lg font-semibold">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          That route doesn&rsquo;t exist. It may have been moved or the link is
          wrong.
        </p>
        <Button asChild className="mt-5">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
