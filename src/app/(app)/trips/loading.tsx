export default function TripsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-20 rounded bg-secondary" />
          <div className="h-4 w-48 rounded bg-secondary" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Form skeleton */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="h-5 w-32 rounded bg-secondary" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-secondary" />
              <div className="h-9 w-full rounded bg-secondary" />
            </div>
          ))}
          <div className="h-9 w-full rounded bg-secondary" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-secondary" />
          ))}
        </div>
      </div>
    </div>
  );
}
