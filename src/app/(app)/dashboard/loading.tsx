export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded bg-secondary" />
          <div className="h-4 w-56 rounded bg-secondary" />
        </div>
        <div className="h-8 w-36 rounded bg-secondary" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 border-t-2 border-t-secondary"
          >
            <div className="h-4 w-4 rounded bg-secondary mb-2" />
            <div className="h-8 w-16 rounded bg-secondary mb-1" />
            <div className="h-3 w-24 rounded bg-secondary" />
          </div>
        ))}
      </div>

      {/* Utilization Bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="h-4 w-32 rounded bg-secondary mb-2" />
        <div className="h-3 w-full rounded-full bg-secondary" />
      </div>

      {/* Attention Panel */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="h-4 w-40 rounded bg-secondary mb-3" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded bg-secondary" />
              <div className="h-8 w-full rounded bg-secondary" />
              <div className="h-8 w-full rounded bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
