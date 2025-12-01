"use client"

import { useState } from "react"
import { format, addDays, getDaysInMonth, startOfMonth, getDay } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ShiftTime {
  start: string
  end: string
}

interface EmployeeShift {
  employeeId: string
  employeeName: string
  shifts: Record<string, ShiftTime[]> // key is date in format "YYYY-MM-DD"
  totalHours: number
}

// Add a new function to generate mock shifts data
function generateMockShifts(month: Date): EmployeeShift[] {
  const daysInMonth = getDaysInMonth(month)
  const startDay = startOfMonth(month)

  return [
    {
      employeeId: "1",
      employeeName: "田中 花子",
      shifts: Array.from({ length: daysInMonth }, (_, i) => {
        const day = addDays(startDay, i)
        const isWeekend = getDay(day) === 0 || getDay(day) === 6
        return isWeekend ? [] : [{ start: "09:00", end: "17:00" }]
      }).reduce(
        (acc, shifts, idx) => {
          const dateKey = format(addDays(startDay, idx), "yyyy-MM-dd")
          acc[dateKey] = shifts
          return acc
        },
        {} as Record<string, ShiftTime[]>,
      ),
      totalHours: daysInMonth * 8,
    },
    {
      employeeId: "2",
      employeeName: "佐藤 一郎",
      shifts: Array.from({ length: daysInMonth }, (_, i) => {
        const day = addDays(startDay, i)
        const isWeekend = getDay(day) === 0 || getDay(day) === 6
        return isWeekend ? [] : [{ start: "13:00", end: "21:00" }]
      }).reduce(
        (acc, shifts, idx) => {
          const dateKey = format(addDays(startDay, idx), "yyyy-MM-dd")
          acc[dateKey] = shifts
          return acc
        },
        {} as Record<string, ShiftTime[]>,
      ),
      totalHours: daysInMonth * 8,
    },
    {
      employeeId: "3",
      employeeName: "山田 太郎",
      shifts: Array.from({ length: daysInMonth }, (_, i) => {
        const day = addDays(startDay, i)
        const isWeekend = getDay(day) === 0 || getDay(day) === 6
        return isWeekend ? [{ start: "18:00", end: "23:00" }] : [{ start: "10:00", end: "18:00" }]
      }).reduce(
        (acc, shifts, idx) => {
          const dateKey = format(addDays(startDay, idx), "yyyy-MM-dd")
          acc[dateKey] = shifts
          return acc
        },
        {} as Record<string, ShiftTime[]>,
      ),
      totalHours: daysInMonth * 8,
    },
    {
      employeeId: "4",
      employeeName: "鈴木 美咲",
      shifts: Array.from({ length: daysInMonth }, (_, i) => {
        const day = addDays(startDay, i)
        const isWeekend = getDay(day) === 0 || getDay(day) === 6
        const dayOfMonth = i + 1
        // 週3日勤務パターン
        if (dayOfMonth % 3 === 0) return []
        return isWeekend ? [{ start: "17:00", end: "22:00" }] : [{ start: "11:00", end: "16:00" }]
      }).reduce(
        (acc, shifts, idx) => {
          const dateKey = format(addDays(startDay, idx), "yyyy-MM-dd")
          acc[dateKey] = shifts
          return acc
        },
        {} as Record<string, ShiftTime[]>,
      ),
      totalHours: Math.floor(daysInMonth * 5.5),
    },
    {
      employeeId: "5",
      employeeName: "高橋 健太",
      shifts: Array.from({ length: daysInMonth }, (_, i) => {
        const day = addDays(startDay, i)
        const isWeekend = getDay(day) === 0 || getDay(day) === 6
        const dayOfMonth = i + 1
        // 週4日勤務パターン
        if (dayOfMonth % 4 === 0) return []
        return isWeekend ? [{ start: "16:00", end: "23:00" }] : [{ start: "14:00", end: "22:00" }]
      }).reduce(
        (acc, shifts, idx) => {
          const dateKey = format(addDays(startDay, idx), "yyyy-MM-dd")
          acc[dateKey] = shifts
          return acc
        },
        {} as Record<string, ShiftTime[]>,
      ),
      totalHours: Math.floor(daysInMonth * 7),
    },
    {
      employeeId: "6",
      employeeName: "伊藤 真理",
      shifts: Array.from({ length: daysInMonth }, (_, i) => {
        const day = addDays(startDay, i)
        const isWeekend = getDay(day) === 0 || getDay(day) === 6
        const dayOfMonth = i + 1
        // 平日のみ勤務
        if (isWeekend) return []
        return [{ start: "08:00", end: "16:00" }]
      }).reduce(
        (acc, shifts, idx) => {
          const dateKey = format(addDays(startDay, idx), "yyyy-MM-dd")
          acc[dateKey] = shifts
          return acc
        },
        {} as Record<string, ShiftTime[]>,
      ),
      totalHours: Math.floor(daysInMonth * 5.7), // 平日のみなので少し少なめ
    },
  ]
}

// Add a new function to generate mock metrics data
function generateMockMetrics(month: Date) {
  const daysInMonth = getDaysInMonth(month)
  const startDay = startOfMonth(month)

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = addDays(startDay, i)
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    const multiplier = isWeekend ? 1.3 : 1.0

    const forecastSales = Math.floor((Math.random() * 300000 + 500000) * multiplier)
    const actualSales = i < 15 ? Math.floor(forecastSales * (Math.random() * 0.3 + 0.85)) : null

    const forecastCustomers = Math.floor((Math.random() * 50 + 100) * multiplier)
    const actualCustomers = i < 15 ? Math.floor(forecastCustomers * (Math.random() * 0.3 + 0.85)) : null

    const laborCost = Math.floor(forecastSales * (Math.random() * 0.1 + 0.25))
    const laborRatio = ((laborCost / forecastSales) * 100).toFixed(1)

    return {
      date: format(day, "yyyy-MM-dd"),
      forecastSales,
      actualSales,
      forecastCustomers,
      actualCustomers,
      laborCost,
      laborRatio,
    }
  })
}

// Modify the MonthlyShiftTable function to include the metrics section
export function MonthlyShiftTable() {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Generate mock data for the current month
  const employeeShifts = generateMockShifts(currentMonth)
  const metricsData = generateMockMetrics(currentMonth)

  const daysInMonth = getDaysInMonth(currentMonth)
  const startDay = startOfMonth(currentMonth)
  const firstDayOfWeek = getDay(startDay) // 0 = Sunday, 1 = Monday, etc.

  // Days of the week in Japanese
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"]

  // Generate array of days for the month
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = addDays(startDay, i)
    return {
      date: day,
      dayOfWeek: weekdays[getDay(day)],
      isWeekend: getDay(day) === 0 || getDay(day) === 6, // Sunday or Saturday
    }
  })

  const handlePrevMonth = () => {
    const prevMonth = new Date(currentMonth)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    setCurrentMonth(prevMonth)
  }

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    setCurrentMonth(nextMonth)
  }

  // Helper function to render shift cells
  const renderShiftCell = (employee: EmployeeShift, day: { date: Date; dayOfWeek: string; isWeekend: boolean }) => {
    const dateKey = format(day.date, "yyyy-MM-dd")
    const shifts = employee.shifts[dateKey] || []

    return (
      <td key={`${employee.employeeId}-${dateKey}`} className={`p-2 ${day.isWeekend ? "bg-red-50" : ""}`}>
        <div className="flex flex-col gap-1">
          {shifts.map((shift, idx) => (
            <div key={idx} className="text-xs bg-blue-100 rounded px-2 py-1 text-center">
              <div className="font-medium">{shift.start}</div>
              <div className="text-gray-600">{shift.end}</div>
            </div>
          ))}
        </div>
      </td>
    )
  }

  // Calculate monthly totals
  const monthlyTotals = {
    forecastSales: metricsData.reduce((sum, day) => sum + day.forecastSales, 0),
    actualSales: metricsData.reduce((sum, day) => sum + (day.actualSales || 0), 0),
    forecastCustomers: metricsData.reduce((sum, day) => sum + day.forecastCustomers, 0),
    actualCustomers: metricsData.reduce((sum, day) => sum + (day.actualCustomers || 0), 0),
    laborCost: metricsData.reduce((sum, day) => sum + day.laborCost, 0),
  }

  // Calculate average labor ratio
  const avgLaborRatio = ((monthlyTotals.laborCost / monthlyTotals.forecastSales) * 100).toFixed(1)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">月間シフト表</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[120px] text-center">
            {format(currentMonth, "yyyy年M月", { locale: ja })}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Monthly summary metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">月間売上予測/実績</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">
            ¥{(monthlyTotals.forecastSales / 10000).toFixed(1)}万 / ¥{(monthlyTotals.actualSales / 10000).toFixed(1)}万
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">月間客数予測/実績</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">
            {monthlyTotals.forecastCustomers}人 /{monthlyTotals.actualCustomers}人
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">月間人件費/人件費率</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">
            ¥{(monthlyTotals.laborCost / 10000).toFixed(1)}万 /{avgLaborRatio}%
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th
                  className="sticky left-0 z-10 text-left p-3 font-medium text-gray-700 min-w-[120px] text-sm bg-gray-50"
                  rowSpan={2}
                >
                  項目
                </th>
                {days.map((day) => (
                  <th
                    key={format(day.date, "d")}
                    className={`p-3 text-center font-medium min-w-[60px] text-sm ${
                      day.isWeekend ? "text-red-600 bg-red-50" : "text-gray-700"
                    }`}
                  >
                    {format(day.date, "d")}日
                  </th>
                ))}
                <th className="text-center p-3 font-medium text-gray-700 text-sm" rowSpan={2}>
                  合計
                </th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                {days.map((day) => (
                  <th
                    key={`dow-${format(day.date, "d")}`}
                    className={`p-3 text-center text-xs font-medium ${
                      day.isWeekend ? "text-red-600 bg-red-50" : "text-gray-600"
                    }`}
                  >
                    {day.dayOfWeek}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Metrics rows */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="sticky left-0 z-10 p-3 font-medium text-gray-700 bg-blue-50 text-sm">売上予測</td>
                {metricsData.map((day, idx) => (
                  <td
                    key={`forecast-${day.date}`}
                    className={`p-3 text-center text-sm ${days[idx].isWeekend ? "bg-red-50" : ""}`}
                  >
                    {(day.forecastSales / 10000).toFixed(1)}万
                  </td>
                ))}
                <td className="p-3 text-center font-medium bg-blue-50 text-sm">
                  {(monthlyTotals.forecastSales / 10000).toFixed(1)}万
                </td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="sticky left-0 z-10 p-3 font-medium text-gray-700 bg-blue-50 text-sm">売上実績</td>
                {metricsData.map((day, idx) => (
                  <td
                    key={`actual-${day.date}`}
                    className={`p-3 text-center text-sm ${days[idx].isWeekend ? "bg-red-50" : ""}`}
                  >
                    {day.actualSales ? (day.actualSales / 10000).toFixed(1) + "万" : "-"}
                  </td>
                ))}
                <td className="p-3 text-center font-medium bg-blue-50 text-sm">
                  {(monthlyTotals.actualSales / 10000).toFixed(1)}万
                </td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="sticky left-0 z-10 p-3 font-medium text-gray-700 bg-green-50 text-sm">客数予測</td>
                {metricsData.map((day, idx) => (
                  <td
                    key={`cust-forecast-${day.date}`}
                    className={`p-3 text-center text-sm ${days[idx].isWeekend ? "bg-red-50" : ""}`}
                  >
                    {day.forecastCustomers}人
                  </td>
                ))}
                <td className="p-3 text-center font-medium bg-green-50 text-sm">{monthlyTotals.forecastCustomers}人</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="sticky left-0 z-10 p-3 font-medium text-gray-700 bg-green-50 text-sm">客数実績</td>
                {metricsData.map((day, idx) => (
                  <td
                    key={`cust-actual-${day.date}`}
                    className={`p-3 text-center text-sm ${days[idx].isWeekend ? "bg-red-50" : ""}`}
                  >
                    {day.actualCustomers ? day.actualCustomers + "人" : "-"}
                  </td>
                ))}
                <td className="p-3 text-center font-medium bg-green-50 text-sm">{monthlyTotals.actualCustomers}人</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="sticky left-0 z-10 p-3 font-medium text-gray-700 bg-amber-50 text-sm">人件費</td>
                {metricsData.map((day, idx) => (
                  <td
                    key={`labor-${day.date}`}
                    className={`p-3 text-center text-sm ${days[idx].isWeekend ? "bg-red-50" : ""}`}
                  >
                    {(day.laborCost / 10000).toFixed(1)}万
                  </td>
                ))}
                <td className="p-3 text-center font-medium bg-amber-50 text-sm">
                  {(monthlyTotals.laborCost / 10000).toFixed(1)}万
                </td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="sticky left-0 z-10 p-3 font-medium text-gray-700 bg-amber-50 text-sm">人件費率</td>
                {metricsData.map((day, idx) => (
                  <td
                    key={`ratio-${day.date}`}
                    className={`p-3 text-center text-sm ${days[idx].isWeekend ? "bg-red-50" : ""}`}
                  >
                    {day.laborRatio}%
                  </td>
                ))}
                <td className="p-3 text-center font-medium bg-amber-50 text-sm">{avgLaborRatio}%</td>
              </tr>

              {/* Separator row */}
              <tr>
                <td colSpan={daysInMonth + 2} className="p-2 bg-gray-100"></td>
              </tr>

              {/* Employee shift rows */}
              {employeeShifts.map((employee) => (
                <tr key={employee.employeeId} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="sticky left-0 z-10 p-3 font-medium text-gray-700 bg-gray-50 text-sm">
                    {employee.employeeName}
                  </td>
                  {days.map((day) => renderShiftCell(employee, day))}
                  <td className="p-3 font-medium text-center bg-gray-50 text-sm">{employee.totalHours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
