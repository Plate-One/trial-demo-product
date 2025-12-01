export default function Loading() {
  return (
    <div className="container py-8">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="rounded-lg border h-96 bg-muted animate-pulse" />
          <div className="rounded-lg border h-40 bg-muted animate-pulse" />
        </div>
        <div className="lg:col-span-2">
          <div className="h-12 bg-muted animate-pulse rounded-lg mb-4" />
          <div className="rounded-lg border h-[500px] bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}
