export default function ShiftsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gray-200 rounded" />
            <div className="h-6 bg-gray-200 rounded w-40" />
            <div className="h-9 w-9 bg-gray-200 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
            <div className="h-8 w-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-2 mb-4">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex-1 h-16 bg-gray-100 rounded" />
          ))}
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100">
            <div className="h-8 w-8 bg-gray-200 rounded-full" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="flex-1 h-8 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
