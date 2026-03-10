export default function DemandForecastLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-9 bg-gray-200 rounded" />
            <div className="h-9 w-24 bg-gray-200 rounded" />
            <div className="h-9 w-9 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-5">
            <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-28 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-5 bg-gray-200 rounded w-36 mb-4" />
        <div className="h-[280px] bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6">
            <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-12 bg-gray-100 rounded mb-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
