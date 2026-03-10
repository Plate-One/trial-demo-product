export default function StaffDetailLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-gray-200 rounded-full" />
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b px-6 pt-4">
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded w-20 mb-2" />
            ))}
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-5 bg-gray-100 rounded w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
