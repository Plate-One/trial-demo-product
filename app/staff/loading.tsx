export default function StaffLoading() {
  return (
    <div className="bg-white rounded-lg shadow-sm animate-pulse">
      <div className="border-b p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-6 bg-gray-200 rounded w-36 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
          <div className="h-9 w-28 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-7 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="h-9 flex-1 bg-gray-100 rounded" />
          <div className="h-9 w-28 bg-gray-100 rounded" />
          <div className="h-9 w-28 bg-gray-100 rounded" />
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100">
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded" />
            <div className="h-6 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
