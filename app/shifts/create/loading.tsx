export default function ShiftCreateLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-lg shadow-sm px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="h-7 w-7 bg-gray-200 rounded-full" />
                <div className="h-3 bg-gray-100 rounded w-10 hidden sm:block" />
                {i < 5 && <div className="h-0.5 w-6 bg-gray-200 rounded" />}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-72 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded" />
          ))}
        </div>
        <div className="h-[200px] bg-gray-100 rounded" />
      </div>
    </div>
  )
}
