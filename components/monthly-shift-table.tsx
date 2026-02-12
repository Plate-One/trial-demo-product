"use client"

import { useState, useRef } from "react"
import { format, addDays, getDaysInMonth, startOfMonth, getDay } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Printer } from "lucide-react"

interface ShiftTime {
  start: string
  end: string
}

interface EmployeeShift {
  employeeId: string
  employeeName: string
  position: "ホール" | "キッチン"
  type: "社員" | "アルバイト"
  shifts: Record<string, ShiftTime[]> // key is date in format "YYYY-MM-DD"
  totalHours: number
}

// Add a new function to generate mock shifts data
function generateMockShifts(month: Date): EmployeeShift[] {
  const daysInMonth = getDaysInMonth(month)
  const startDay = startOfMonth(month)

  // ヘルパー関数：シフトデータを生成し、合計時間も計算
  const generateShifts = (pattern: (day: Date, dayIndex: number) => ShiftTime[]) => {
    let totalHours = 0
    const shifts = Array.from({ length: daysInMonth }, (_, i) => {
      const day = addDays(startDay, i)
      const dayShifts = pattern(day, i)
      // 合計時間を計算
      dayShifts.forEach((shift) => {
        const [startHour, startMinute] = shift.start.split(":").map(Number)
        const [endHour, endMinute] = shift.end.split(":").map(Number)
        const hours = endHour - startHour + (endMinute - startMinute) / 60
        totalHours += hours
      })
      return dayShifts
    }).reduce(
      (acc, shifts, idx) => {
        const dateKey = format(addDays(startDay, idx), "yyyy-MM-dd")
        acc[dateKey] = shifts
        return acc
      },
      {} as Record<string, ShiftTime[]>,
    )
    return { shifts, totalHours }
  }

  // ホール - 社員5名
  const h1Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "10:00", end: "19:00" }]
  })
  const hallEmployees = [
    {
      employeeId: "h1",
      employeeName: "鈴木一郎",
      position: "ホール" as const,
      type: "社員" as const,
      shifts: h1Data.shifts,
      totalHours: h1Data.totalHours,
    },
    (() => {
      const h2Data = generateShifts((day, i) => {
        const isWeekend = getDay(day) === 0 || getDay(day) === 6
        return isWeekend ? [] : [{ start: "10:00", end: "22:00" }]
      })
      return {
        employeeId: "h2",
        employeeName: "山田三郎",
        position: "ホール" as const,
        type: "社員" as const,
        shifts: h2Data.shifts,
        totalHours: h2Data.totalHours,
      }
    })(),
    (() => {
      const h3Data = generateShifts((day, i) => {
        const isWeekend = getDay(day) === 0 || getDay(day) === 6
        return isWeekend ? [] : [{ start: "10:00", end: "16:00" }]
      })
      return {
        employeeId: "h3",
        employeeName: "佐藤四郎",
        position: "ホール" as const,
        type: "社員" as const,
        shifts: h3Data.shifts,
        totalHours: h3Data.totalHours,
      }
    })(),
    (() => {
      const h4Data = generateShifts((day, i) => {
        const isWeekend = getDay(day) === 0 || getDay(day) === 6
        return isWeekend ? [] : [{ start: "10:00", end: "16:00" }]
      })
      return {
        employeeId: "h4",
        employeeName: "大倉栄一",
        position: "ホール" as const,
        type: "社員" as const,
        shifts: h4Data.shifts,
        totalHours: h4Data.totalHours,
      }
    })(),
    (() => {
      const h5Data = generateShifts((day, i) => {
        const isWeekend = getDay(day) === 0 || getDay(day) === 6
        return isWeekend ? [] : [{ start: "09:00", end: "13:00" }]
      })
      return {
        employeeId: "h5",
        employeeName: "中村翔太",
        position: "ホール" as const,
        type: "社員" as const,
        shifts: h5Data.shifts,
        totalHours: h5Data.totalHours,
      }
    })(),
  ]

  // ホール - アルバイト10名
  const h6Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [{ start: "17:00", end: "23:00" }] : []
  })
  const h7Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "10:00", end: "15:00" }]
  })
  const h8Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "15:00", end: "20:00" }]
  })
  const h9Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "11:00", end: "19:00" }]
  })
  const h10Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [{ start: "14:00", end: "23:00" }] : []
  })
  const h11Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [{ start: "18:00", end: "23:00" }] : []
  })
  const h12Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "12:00", end: "18:00" }]
  })
  const h13Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [{ start: "16:00", end: "22:00" }] : []
  })
  const h14Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "11:00", end: "17:00" }]
  })
  const h15Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "13:00", end: "20:00" }]
  })
  const hallPartTimers = [
    {
      employeeId: "h6",
      employeeName: "小林陽子",
      position: "ホール" as const,
      type: "アルバイト" as const,
      shifts: h6Data.shifts,
      totalHours: h6Data.totalHours,
    },
    {
      employeeId: "h7",
      employeeName: "伊藤真理",
      position: "ホール" as const,
      type: "アルバイト" as const,
      shifts: h7Data.shifts,
      totalHours: h7Data.totalHours,
    },
    {
      employeeId: "h8",
      employeeName: "木村達也",
      position: "ホール" as const,
      type: "アルバイト" as const,
      shifts: h8Data.shifts,
      totalHours: h8Data.totalHours,
    },
    {
      employeeId: "h9",
      employeeName: "山本浩二",
      position: "ホール" as const,
      type: "アルバイト" as const,
      shifts: h9Data.shifts,
      totalHours: h9Data.totalHours,
    },
    {
      employeeId: "h10",
      employeeName: "佐々木健太",
      position: "ホール" as const,
      type: "アルバイト" as const,
      shifts: h10Data.shifts,
      totalHours: h10Data.totalHours,
    },
    {
      employeeId: "h11",
      employeeName: "中島龍太",
      position: "ホール" as const,
      type: "アルバイト" as const,
      shifts: h11Data.shifts,
      totalHours: h11Data.totalHours,
    },
    {
      employeeId: "h12",
      employeeName: "田中美咲",
      position: "ホール" as const,
      type: "アルバイト" as const,
      shifts: h12Data.shifts,
      totalHours: h12Data.totalHours,
    },
    {
      employeeId: "h13",
      employeeName: "佐藤花子",
      position: "ホール" as const,
      type: "アルバイト" as const,
      shifts: h13Data.shifts,
      totalHours: h13Data.totalHours,
    },
    {
      employeeId: "h14",
      employeeName: "高橋太郎",
      position: "ホール" as const,
      type: "アルバイト" as const,
      shifts: h14Data.shifts,
      totalHours: h14Data.totalHours,
    },
    {
      employeeId: "h15",
      employeeName: "鈴木次郎",
      position: "ホール" as const,
      type: "アルバイト" as const,
      shifts: h15Data.shifts,
      totalHours: h15Data.totalHours,
    },
  ]

  // キッチン - 社員5名
  const k1Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "10:00", end: "23:00" }]
  })
  const k2Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "12:00", end: "16:00" }]
  })
  const k3Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "11:00", end: "20:00" }]
  })
  const k4Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "13:00", end: "22:00" }]
  })
  const k5Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "14:00", end: "18:00" }]
  })
  const kitchenEmployees = [
    {
      employeeId: "k1",
      employeeName: "田中二郎",
      position: "キッチン" as const,
      type: "社員" as const,
      shifts: k1Data.shifts,
      totalHours: k1Data.totalHours,
    },
    {
      employeeId: "k2",
      employeeName: "渡辺直子",
      position: "キッチン" as const,
      type: "社員" as const,
      shifts: k2Data.shifts,
      totalHours: k2Data.totalHours,
    },
    {
      employeeId: "k3",
      employeeName: "高橋美咲",
      position: "キッチン" as const,
      type: "社員" as const,
      shifts: k3Data.shifts,
      totalHours: k3Data.totalHours,
    },
    {
      employeeId: "k4",
      employeeName: "加藤健一",
      position: "キッチン" as const,
      type: "社員" as const,
      shifts: k4Data.shifts,
      totalHours: k4Data.totalHours,
    },
    {
      employeeId: "k5",
      employeeName: "中村翔太",
      position: "キッチン" as const,
      type: "社員" as const,
      shifts: k5Data.shifts,
      totalHours: k5Data.totalHours,
    },
  ]

  // キッチン - アルバイト10名
  const k6Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "09:00", end: "14:00" }]
  })
  const k7Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [{ start: "16:00", end: "23:00" }] : []
  })
  const k8Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "12:00", end: "21:00" }]
  })
  const k9Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [{ start: "16:00", end: "23:00" }] : []
  })
  const k10Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "10:00", end: "17:00" }]
  })
  const k11Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "14:00", end: "21:00" }]
  })
  const k12Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "11:00", end: "19:00" }]
  })
  const k13Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "13:00", end: "20:00" }]
  })
  const k14Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [{ start: "15:00", end: "22:00" }] : []
  })
  const k15Data = generateShifts((day, i) => {
    const isWeekend = getDay(day) === 0 || getDay(day) === 6
    return isWeekend ? [] : [{ start: "12:00", end: "18:00" }]
  })
  const kitchenPartTimers = [
    {
      employeeId: "k6",
      employeeName: "木村達也",
      position: "キッチン" as const,
      type: "アルバイト" as const,
      shifts: k6Data.shifts,
      totalHours: k6Data.totalHours,
    },
    {
      employeeId: "k7",
      employeeName: "斎藤美穂",
      position: "キッチン" as const,
      type: "アルバイト" as const,
      shifts: k7Data.shifts,
      totalHours: k7Data.totalHours,
    },
    {
      employeeId: "k8",
      employeeName: "松田聡子",
      position: "キッチン" as const,
      type: "アルバイト" as const,
      shifts: k8Data.shifts,
      totalHours: k8Data.totalHours,
    },
    {
      employeeId: "k9",
      employeeName: "吉田美香",
      position: "キッチン" as const,
      type: "アルバイト" as const,
      shifts: k9Data.shifts,
      totalHours: k9Data.totalHours,
    },
    {
      employeeId: "k10",
      employeeName: "山田花子",
      position: "キッチン" as const,
      type: "アルバイト" as const,
      shifts: k10Data.shifts,
      totalHours: k10Data.totalHours,
    },
    {
      employeeId: "k11",
      employeeName: "佐々木健",
      position: "キッチン" as const,
      type: "アルバイト" as const,
      shifts: k11Data.shifts,
      totalHours: k11Data.totalHours,
    },
    {
      employeeId: "k12",
      employeeName: "鈴木三郎",
      position: "キッチン" as const,
      type: "アルバイト" as const,
      shifts: k12Data.shifts,
      totalHours: k12Data.totalHours,
    },
    {
      employeeId: "k13",
      employeeName: "高橋四郎",
      position: "キッチン" as const,
      type: "アルバイト" as const,
      shifts: k13Data.shifts,
      totalHours: k13Data.totalHours,
    },
    {
      employeeId: "k14",
      employeeName: "田中五郎",
      position: "キッチン" as const,
      type: "アルバイト" as const,
      shifts: k14Data.shifts,
      totalHours: k14Data.totalHours,
    },
    {
      employeeId: "k15",
      employeeName: "佐藤六郎",
      position: "キッチン" as const,
      type: "アルバイト" as const,
      shifts: k15Data.shifts,
      totalHours: k15Data.totalHours,
    },
  ]

  return [...hallEmployees, ...hallPartTimers, ...kitchenEmployees, ...kitchenPartTimers]
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
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

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

  const hallEmployees = employeeShifts.filter((emp) => emp.position === "ホール" && emp.type === "社員")
  const hallPartTimers = employeeShifts.filter((emp) => emp.position === "ホール" && emp.type === "アルバイト")
  const kitchenEmployees = employeeShifts.filter((emp) => emp.position === "キッチン" && emp.type === "社員")
  const kitchenPartTimers = employeeShifts.filter((emp) => emp.position === "キッチン" && emp.type === "アルバイト")
  
  const hallHours = [...hallEmployees, ...hallPartTimers].reduce((sum, emp) => sum + emp.totalHours, 0)
  const kitchenHours = [...kitchenEmployees, ...kitchenPartTimers].reduce((sum, emp) => sum + emp.totalHours, 0)

  // Helper function to render shift cells
  const renderShiftCell = (employee: EmployeeShift, day: { date: Date; dayOfWeek: string; isWeekend: boolean }) => {
    const dateKey = format(day.date, "yyyy-MM-dd")
    const shifts = employee.shifts[dateKey] || []

    return (
      <td key={`${employee.employeeId}-${dateKey}`} className={`p-2 ${day.isWeekend ? "bg-red-50 weekend-cell" : ""}`}>
        <div className="flex flex-col gap-1">
          {shifts.map((shift, idx) => (
            <div key={idx} className="text-xs bg-blue-100 rounded px-2 py-1 text-center shift-cell-blue print:px-1 print:py-0">
              <div className="font-medium print:text-[8px]">{shift.start}</div>
              <div className="text-gray-600 print:text-[8px]">{shift.end}</div>
            </div>
          ))}
        </div>
      </td>
    )
  }

  // Calculate daily labor hours and costs
  const HOURLY_WAGE = 1200
  const calculateDayLaborMetrics = (dayIndex: number) => {
    const dateKey = format(days[dayIndex].date, "yyyy-MM-dd")
    let totalHours = 0

    employeeShifts.forEach((employee) => {
      const shifts = employee.shifts[dateKey] || []
      shifts.forEach((shift) => {
        const [startHour, startMinute] = shift.start.split(":").map(Number)
        const [endHour, endMinute] = shift.end.split(":").map(Number)
        const hours = endHour - startHour + (endMinute - startMinute) / 60
        totalHours += hours
      })
    })

    const laborCost = totalHours * HOURLY_WAGE
    const dayMetrics = metricsData[dayIndex]
    const sales = dayMetrics?.forecastSales || 0
    const laborCostRatio = sales > 0 ? (laborCost / sales) * 100 : 0

    return { totalHours, laborCost, laborCostRatio, sales }
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
    <div className="space-y-4" ref={printRef}>
      {/* 印刷用ヘッダー（画面では非表示） */}
      <div className="print-header hidden print:block">
        <h1>月間シフト表</h1>
        <p>{format(currentMonth, "yyyy年M月", { locale: ja })} - キリンシティ 横浜ベイクォーター店</p>
      </div>

      <div className="flex justify-between items-center no-print">
        <h2 className="text-xl font-semibold text-gray-800">月間シフト表</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            印刷
          </Button>
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
      <div className="grid grid-cols-3 gap-4 print-summary">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">月間売上予測/実績</div>
          <div className="mt-1 text-xl font-semibold text-gray-900 print:text-base">
            {monthlyTotals.forecastSales.toLocaleString()}円 / {monthlyTotals.actualSales.toLocaleString()}円
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">月間客数予測/実績</div>
          <div className="mt-1 text-xl font-semibold text-gray-900 print:text-base">
            {monthlyTotals.forecastCustomers}人 /{monthlyTotals.actualCustomers}人
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">月間人件費/人件費率</div>
          <div className="mt-1 text-xl font-semibold text-gray-900 print:text-base">
            {monthlyTotals.laborCost.toLocaleString()}円 /{avgLaborRatio}%
          </div>
        </div>
      </div>

      {/* 日別指標テーブル */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">日別指標</h3>
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50 text-left text-xs font-medium text-gray-600 min-w-[100px] whitespace-nowrap">指標</th>
              {days.map((day, index) => (
                <th
                  key={index}
                  className={`border p-2 text-center text-xs font-medium min-w-[60px] ${
                    day.isWeekend ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <div>{format(day.date, "d")}</div>
                  <div className="text-[10px]">{day.dayOfWeek}</div>
                </th>
              ))}
              <th className="border p-2 bg-gray-100 text-center text-xs font-medium text-gray-600 min-w-[100px]">月合計</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2 text-xs font-medium text-gray-700 whitespace-nowrap">売上予測</td>
              {days.map((_, index) => {
                const dayMetrics = metricsData[index]
                return (
                  <td
                    key={index}
                    className={`border p-2 text-center text-xs ${days[index].isWeekend ? "bg-red-50/30" : ""}`}
                  >
                    {dayMetrics?.forecastSales.toLocaleString()}円
                  </td>
                )
              })}
              <td className="border p-2 text-center text-xs font-bold bg-gray-50">
                {metricsData.reduce((sum, day) => sum + day.forecastSales, 0).toLocaleString()}円
              </td>
            </tr>
            <tr>
              <td className="border p-2 text-xs font-medium text-gray-700 whitespace-nowrap">売上実績</td>
              {days.map((_, index) => {
                const dayMetrics = metricsData[index]
                return (
                  <td
                    key={index}
                    className={`border p-2 text-center text-xs ${days[index].isWeekend ? "bg-red-50/30" : ""}`}
                  >
                    {dayMetrics?.actualSales ? dayMetrics.actualSales.toLocaleString() + "円" : "-"}
                  </td>
                )
              })}
              <td className="border p-2 text-center text-xs font-bold bg-gray-50">
                {metricsData.reduce((sum, day) => sum + (day.actualSales || 0), 0).toLocaleString()}円
              </td>
            </tr>
            <tr>
              <td className="border p-2 text-xs font-medium text-gray-700 whitespace-nowrap">投入労働時間</td>
              {days.map((_, index) => {
                const metrics = calculateDayLaborMetrics(index)
                return (
                  <td
                    key={index}
                    className={`border p-2 text-center text-xs ${days[index].isWeekend ? "bg-red-50/30" : ""}`}
                  >
                    {metrics.totalHours.toFixed(1)}h
                  </td>
                )
              })}
              <td className="border p-2 text-center text-xs font-bold bg-gray-50">
                {days.reduce((sum, _, index) => sum + calculateDayLaborMetrics(index).totalHours, 0).toFixed(1)}h
              </td>
            </tr>
            <tr>
              <td className="border p-2 text-xs font-medium text-gray-700 whitespace-nowrap">人件費</td>
              {days.map((_, index) => {
                const metrics = calculateDayLaborMetrics(index)
                return (
                  <td
                    key={index}
                    className={`border p-2 text-center text-xs ${days[index].isWeekend ? "bg-red-50/30" : ""}`}
                  >
                    {metrics.laborCost.toLocaleString()}円
                  </td>
                )
              })}
              <td className="border p-2 text-center text-xs font-bold bg-gray-50">
                {days.reduce((sum, _, index) => sum + calculateDayLaborMetrics(index).laborCost, 0).toLocaleString()}円
              </td>
            </tr>
            <tr>
              <td className="border p-2 text-xs font-medium text-gray-700 whitespace-nowrap">人件費率</td>
              {days.map((_, index) => {
                const metrics = calculateDayLaborMetrics(index)
                return (
                  <td
                    key={index}
                    className={`border p-2 text-center text-xs ${days[index].isWeekend ? "bg-red-50/30" : ""}`}
                  >
                    {metrics.laborCostRatio.toFixed(1)}%
                  </td>
                )
              })}
              <td className="border p-2 text-center text-xs font-bold bg-gray-50">
                {(() => {
                  const totalLaborCost = days.reduce((sum, _, index) => sum + calculateDayLaborMetrics(index).laborCost, 0)
                  const totalSales = metricsData.reduce((sum, day) => sum + day.forecastSales, 0)
                  return totalSales > 0 ? ((totalLaborCost / totalSales) * 100).toFixed(1) : "0.0"
                })()}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ポジション別表示（ホール／キッチン） */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary" className="text-sm">
          ホール 社員{hallEmployees.length}名 / アルバイト{hallPartTimers.length}名 / {hallHours}h
        </Badge>
        <Badge variant="secondary" className="text-sm">
          キッチン 社員{kitchenEmployees.length}名 / アルバイト{kitchenPartTimers.length}名 / {kitchenHours}h
        </Badge>
      </div>

      <div className="space-y-6">
        {[
          { 
            title: "ホール", 
            employees: hallEmployees, 
            partTimers: hallPartTimers,
            totalHours: hallHours 
          },
          { 
            title: "キッチン", 
            employees: kitchenEmployees, 
            partTimers: kitchenPartTimers,
            totalHours: kitchenHours 
          },
        ].map((section) => (
          <div key={section.title} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
                <Badge variant="secondary">
                  社員{section.employees.length}名 / アルバイト{section.partTimers.length}名 / {section.totalHours}h
                </Badge>
              </div>
            </div>
            
            {/* 社員セクション */}
            <div className="border-b border-gray-200">
              <div className="px-4 py-2 bg-blue-50 border-b border-gray-200">
                <Badge variant="outline" className="text-blue-700 border-blue-300 text-xs">
                  社員 {section.employees.length}名
                </Badge>
              </div>
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full print-table">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th
                        className="sticky left-0 z-10 text-left p-3 font-medium text-gray-700 min-w-[120px] text-sm bg-gray-50"
                        rowSpan={2}
                      >
                        スタッフ
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
                    {section.employees.map((employee) => (
                      <tr key={employee.employeeId} className="border-b border-gray-200 hover:bg-gray-50 avoid-break">
                        <td className="sticky left-0 z-10 p-3 font-medium text-gray-700 bg-white text-sm print:bg-white">
                          {employee.employeeName}
                        </td>
                        {days.map((day) => renderShiftCell(employee, day))}
                        <td className="p-3 font-medium text-center bg-gray-50 text-sm">{Math.round(employee.totalHours)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* アルバイトセクション */}
            <div>
              <div className="px-4 py-2 bg-purple-50 border-b border-gray-200">
                <Badge variant="outline" className="text-purple-700 border-purple-300 text-xs">
                  アルバイト {section.partTimers.length}名
                </Badge>
              </div>
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full print-table">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th
                        className="sticky left-0 z-10 text-left p-3 font-medium text-gray-700 min-w-[120px] text-sm bg-gray-50"
                        rowSpan={2}
                      >
                        スタッフ
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
                    {section.partTimers.map((employee) => (
                      <tr key={employee.employeeId} className="border-b border-gray-200 hover:bg-gray-50 avoid-break">
                        <td className="sticky left-0 z-10 p-3 font-medium text-gray-700 bg-white text-sm print:bg-white">
                          {employee.employeeName}
                        </td>
                        {days.map((day) => renderShiftCell(employee, day))}
                        <td className="p-3 font-medium text-center bg-gray-50 text-sm">{Math.round(employee.totalHours)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
