export default function ReportsLoading() {
  return (
    <div className="bg-white rounded-lg shadow-sm animate-pulse">
      <div className="border-b p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-56" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-5">
              <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-5">
              <div className="h-5 bg-gray-200 rounded w-28 mb-3" />
              <div className="h-[180px] bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
