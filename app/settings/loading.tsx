export default function SettingsLoading() {
  return (
    <div className="bg-white rounded-lg shadow-sm animate-pulse">
      <div className="border-b p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-6 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-40" />
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="p-6 space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-5 bg-gray-200 rounded" />
              <div className="h-5 bg-gray-200 rounded w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((j) => (
                <div key={j}>
                  <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                  <div className="h-9 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
