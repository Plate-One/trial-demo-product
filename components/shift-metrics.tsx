"use client"

import { useState, useEffect } from "react"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { ja } from "date-fns/locale"

export function ShiftMetrics({
  viewMode,
  currentDate,
}: { viewMode: "daily" | "weekly" | "monthly"; currentDate: Date }) {
  const [isModelShiftOpen, setIsModelShiftOpen] = useState(true)
  const [isActualStaffOpen, setIsActualStaffOpen] = useState(true)
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  useEffect(() => {
    if (viewMode === "weekly") {
      const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekData = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(startDate, i)
        return {
          date: format(date, "MM/dd (E)", { locale: ja }),
          sales: Math.floor(Math.random() * 1000000) + 500000,
          staffCost: Math.floor(Math.random() * 100000) + 50000,
          staffRatio: (Math.random() * 10 + 25).toFixed(1),
        }
      })
      setWeeklyData(weekData)
    }
  }, [viewMode, currentDate])

  useEffect(() => {
    if (viewMode === "monthly") {
      const startDate = startOfMonth(currentDate)
      const endDate = endOfMonth(currentDate)
      const days = eachDayOfInterval({ start: startDate, end: endDate })

      const monthData = days.map((date) => ({
        date: format(date, "MM/dd (E)", { locale: ja }),
        sales: Math.floor(Math.random() * 1000000) + 500000,
        staffCost: Math.floor(Math.random() * 100000) + 50000,
        staffRatio: (Math.random() * 10 + 25).toFixed(1),
      }))
      setMonthlyData(monthData)
    }
  }, [viewMode, currentDate])

  const renderWeeklyView = () => (
    <div className="mt-6 space-y-6 rounded-lg bg-white p-6 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left text-sm font-semibold text-gray-600 border-b">指標</th>
              {weeklyData.map((day) => (
                <th key={day.date} className="p-3 text-center text-sm font-semibold text-gray-600 border-b">
                  {day.date}
                </th>
              ))}
              <th className="p-3 text-center text-sm font-semibold text-gray-600 border-b">週合計</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 text-left text-sm">売上予測</td>
              {weeklyData.map((day) => (
                <td key={day.date} className="p-3 text-right text-sm">
                  {day.sales.toLocaleString()}円
                </td>
              ))}
              <td className="p-3 text-right text-sm">
                {weeklyData.reduce((sum, day) => sum + day.sales, 0).toLocaleString()}円
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-3 text-left text-sm">人件費</td>
              {weeklyData.map((day) => (
                <td key={day.date} className="p-3 text-right text-sm">
                  {day.staffCost.toLocaleString()}円
                </td>
              ))}
              <td className="p-3 text-right text-sm">
                {weeklyData.reduce((sum, day) => sum + day.staffCost, 0).toLocaleString()}円
              </td>
            </tr>
            <tr>
              <td className="p-3 text-left text-sm">人件費率</td>
              {weeklyData.map((day) => (
                <td key={day.date} className="p-3 text-right text-sm">
                  {day.staffRatio}%
                </td>
              ))}
              <td className="p-3 text-right text-sm">
                {(
                  (weeklyData.reduce((sum, day) => sum + day.staffCost, 0) /
                    weeklyData.reduce((sum, day) => sum + day.sales, 0)) *
                  100
                ).toFixed(1)}
                %
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderMonthlyView = () => (
    <div className="mt-6 space-y-6 rounded-lg bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-gray-50 p-4 border-gray-200">
          <div className="text-sm font-medium text-gray-600">月間売上予測</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            ¥{monthlyData.reduce((sum, day) => sum + day.sales, 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-gray-50 p-4 border-gray-200">
          <div className="text-sm font-medium text-gray-600">月間人件費</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            ¥{monthlyData.reduce((sum, day) => sum + day.staffCost, 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-gray-50 p-4 border-gray-200">
          <div className="text-sm font-medium text-gray-600">平均人件費率</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {monthlyData.length > 0
              ? (
                  monthlyData.reduce((sum, day) => sum + Number.parseFloat(day.staffRatio), 0) / monthlyData.length
                ).toFixed(1)
              : 0}
            %
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">日付</th>
              <th className="p-3 text-center text-sm font-semibold text-gray-600 border-b border-gray-200">売上予測</th>
              <th className="p-3 text-center text-sm font-semibold text-gray-600 border-b border-gray-200">人件費</th>
              <th className="p-3 text-center text-sm font-semibold text-gray-600 border-b border-gray-200">人件費率</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((day, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                <td className="p-3 text-left text-sm">{day.date}</td>
                <td className="p-3 text-right text-sm">{day.sales.toLocaleString()}円</td>
                <td className="p-3 text-right text-sm">{day.staffCost.toLocaleString()}円</td>
                <td className="p-3 text-right text-sm">{day.staffRatio}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return viewMode === "daily" ? (
    <div className="mt-6 space-y-6 rounded-lg bg-white p-6 shadow-sm">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "売り上げ予測", value: "¥1,200,000" },
          { label: "人時売上高", value: "¥3,500" },
          { label: "人件比率", value: "28.5%" },
          { label: "人件費(合計)", value: "¥120,000" },
          { label: "人件費(時給)", value: "¥120,000" },
          { label: "人件費(月給)", value: "¥3,600,000" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border bg-gray-50 p-4 transition-colors hover:bg-gray-100 border-gray-200"
          >
            <div className="text-sm font-medium text-gray-600">{item.label}</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="border-b bg-gray-50 border-gray-200">
              <th className="p-3 text-left text-sm font-medium text-gray-600"></th>
              {Array.from({ length: 16 }, (_, i) => i + 8).map((hour) => (
                <th key={hour} className="border-l p-3 text-center text-sm font-medium text-gray-600 border-gray-200">
                  {hour}時
                </th>
              ))}
              <th className="border-l p-3 text-center text-sm font-medium text-gray-600 border-gray-200">合計</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b bg-gray-50 border-gray-200">
              <td
                colSpan={18}
                className="p-3 font-medium text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors text-sm"
                onClick={() => setIsModelShiftOpen(!isModelShiftOpen)}
              >
                <div className="flex items-center gap-2">
                  {isModelShiftOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                  モデルシフト
                </div>
              </td>
            </tr>
            {isModelShiftOpen &&
              [
                {
                  label: "キッチン",
                  values: [0, 0, 1, 1, 2, 2, 1, 1, 0, 1, 1, 2, 2, 1, 1, 0],
                  total: 16,
                },
                {
                  label: "ホール",
                  values: [0, 0, 1, 1, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                  total: 17,
                },
                {
                  label: "ドリンク",
                  values: [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0],
                  total: 8,
                },
              ].map((row) => (
                <tr key={row.label} className="border-b border-gray-200">
                  <td className="p-3 font-medium text-gray-900 text-sm">{row.label}</td>
                  {row.values.map((value, i) => (
                    <td key={i} className="border-l p-3 text-center text-sm border-gray-200">
                      {value}
                    </td>
                  ))}
                  <td className="border-l p-3 text-center font-bold text-gray-900 text-sm border-gray-200">
                    {row.total}
                  </td>
                </tr>
              ))}
            <tr className="border-b bg-gray-50 border-gray-200">
              <td
                colSpan={18}
                className="p-3 font-medium text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors text-sm"
                onClick={() => setIsActualStaffOpen(!isActualStaffOpen)}
              >
                <div className="flex items-center gap-2">
                  {isActualStaffOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                  実員数
                </div>
              </td>
            </tr>
            {isActualStaffOpen &&
              [
                {
                  label: "キッチン",
                  values: [0, 0, 1, 1, 2, 2, 1, 1, 0, 1, 1, 2, 2, 1, 1, 0],
                  total: 16,
                  modelValues: [0, 0, 1, 1, 2, 2, 1, 1, 0, 1, 1, 2, 2, 1, 1, 0],
                },
                {
                  label: "ホール",
                  values: [0, 0, 1, 1, 3, 3, 2, 1, 1, 1, 2, 2, 2, 1, 1, 0],
                  total: 21,
                  modelValues: [0, 0, 1, 1, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                },
                {
                  label: "ドリンク",
                  values: [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0],
                  total: 8,
                  modelValues: [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0],
                },
              ].map((row) => (
                <tr key={row.label} className="border-b border-gray-200">
                  <td className="p-3 font-medium text-gray-900 text-sm">{row.label}</td>
                  {row.values.map((value, i) => {
                    const diff = value - row.modelValues[i]
                    return (
                      <td key={i} className="border-l p-3 text-center text-sm border-gray-200">
                        {diff < 0 ? (
                          <div className="bg-[#fff2f2] -m-3 p-3">
                            <span className="text-[#dc2626]">{diff}</span>
                          </div>
                        ) : (
                          value
                        )}
                      </td>
                    )
                  })}
                  <td className="border-l p-3 text-center font-bold text-gray-900 text-sm border-gray-200">
                    {row.total}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : viewMode === "weekly" ? (
    renderWeeklyView()
  ) : (
    renderMonthlyView()
  )
}

// Export a simplified version of metrics for integrated display
export function IntegratedShiftMetrics({
  viewMode,
  currentDate,
}: { viewMode: "daily" | "weekly" | "monthly"; currentDate: Date }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        { label: "売り上げ予測", value: "¥1,200,000" },
        { label: "人件費(合計)", value: "¥120,000" },
        { label: "人件費率", value: "28.5%" },
      ].map((item) => (
        <div
          key={item.label}
          className="rounded-lg border bg-gray-50 p-4 transition-colors hover:bg-gray-100 border-gray-200"
        >
          <div className="text-sm font-medium text-gray-600">{item.label}</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{item.value}</div>
        </div>
      ))}
    </div>
  )
}
