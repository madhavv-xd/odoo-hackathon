export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 rounded bg-secondary" />
          <div className="h-4 w-64 rounded bg-secondary" />
        </div>
        <div className="h-8 w-28 rounded bg-secondary" />
      </div>

      {/* Stat Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 border-t-2 border-t-secondary"
          >
            <div className="h-4 w-4 rounded bg-secondary mb-2" />
            <div className="h-8 w-20 rounded bg-secondary mb-1" />
            <div className="h-3 w-28 rounded bg-secondary" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="h-4 w-48 rounded bg-secondary mb-4" />
          <div className="h-[280px] rounded bg-secondary/50" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="h-4 w-48 rounded bg-secondary mb-4" />
          <div className="h-[280px] rounded bg-secondary/50" />
        </div>
      </div>

      {/* Table */}
      <div>
        <div className="h-5 w-40 rounded bg-secondary mb-3" />
        <div className="rounded-lg border border-border p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-full rounded bg-secondary" />
          ))}
        </div>
      </div>
    </div>
  );
}
