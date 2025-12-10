"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns"
import { ja } from "date-fns/locale"
import { Send, Save, Plus, Minus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Sparkles, X } from "lucide-react"

interface HourlyStaffing {
  [hour: number]: number
}

interface HourlyForecast {
  [hour: number]: {
    sales: number
    customers: number
    suggestedHall: number
    suggestedKitchen: number
  }
}

interface DayStaffing {
  date: Date
  hallStaffing: HourlyStaffing
  kitchenStaffing: HourlyStaffing
  forecastSales: number
  forecastCustomers: number
  hourlyForecast: HourlyForecast
  isHoliday?: boolean
  holidayName?: string
}

const OPERATING_HOURS = Array.from({ length: 12 }, (_, i) => i + 11)

const holidays: Record<string, string> = {
  "2025-01-01": "元日",
  "2025-01-13": "成人の日",
  "2025-02-11": "建国記念の日",
  "2025-02-23": "天皇誕生日",
  "2025-03-20": "春分の日",
  "2025-04-29": "昭和の日",
  "2025-05-03": "憲法記念日",
  "2025-05-04": "みどりの日",
  "2025-05-05": "こどもの日",
  "2025-07-21": "海の日",
  "2025-08-11": "山の日",
  "2025-09-15": "敬老の日",
  "2025-09-23": "秋分の日",
  "2025-10-13": "スポーツの日",
  "2025-11-03": "文化の日",
  "2025-11-23": "勤労感謝の日",
  "2025-12-23": "天皇誕生日",
}

const isHolidayCheck = (date: Date): { isHoliday: boolean; holidayName?: string } => {
  const dateStr = format(date, "yyyy-MM-dd")
  const holidayName = holidays[dateStr]
  return { isHoliday: !!holidayName, holidayName }
}

const generateHourlyForecast = (date: Date, totalSales: number, totalCustomers: number): HourlyForecast => {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6
  const holidayInfo = isHolidayCheck(date)
  const isSpecialDay = isWeekend || holidayInfo.isHoliday

  const hourlyForecast: HourlyForecast = {}

  OPERATING_HOURS.forEach((hour) => {
    let salesRatio = 0.05
    let customerRatio = 0.05

    if (hour >= 11 && hour <= 13) {
      salesRatio = isSpecialDay ? 0.12 : 0.1
      customerRatio = isSpecialDay ? 0.12 : 0.1
    } else if (hour >= 18 && hour <= 20) {
      salesRatio = isSpecialDay ? 0.15 : 0.12
      customerRatio = isSpecialDay ? 0.15 : 0.12
    } else if (hour >= 14 && hour <= 17) {
      salesRatio = 0.03
      customerRatio = 0.03
    } else if (hour >= 21) {
      salesRatio = isSpecialDay ? 0.08 : 0.06
      customerRatio = isSpecialDay ? 0.08 : 0.06
    }

    const hourlySales = Math.floor(totalSales * salesRatio)
    const hourlyCustomers = Math.floor(totalCustomers * customerRatio)
    const adjustedCustomers = Math.max(5, Math.min(50, hourlyCustomers))

    const peakMultiplier = (hour >= 11 && hour <= 13) || (hour >= 18 && hour <= 20) ? 1.5 : 1
    const suggestedHall = Math.max(1, Math.ceil((adjustedCustomers / 20) * peakMultiplier))
    const suggestedKitchen = Math.max(1, Math.ceil((adjustedCustomers / 30) * peakMultiplier))

    hourlyForecast[hour] = {
      sales: Math.max(10000, Math.min(120000, hourlySales)),
      customers: adjustedCustomers,
      suggestedHall,
      suggestedKitchen,
    }
  })

  return hourlyForecast
}

const generateWeekData = (weekStart: Date): DayStaffing[] => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const holidayInfo = isHolidayCheck(date)
    const isSpecialDay = isWeekend || holidayInfo.isHoliday
    const multiplier = isSpecialDay ? 1.3 : 1.0

    const forecastSales = Math.floor((150000 + Math.random() * 100000) * multiplier)
    const forecastCustomers = Math.floor((80 + Math.random() * 60) * multiplier)
    const hourlyForecast = generateHourlyForecast(date, forecastSales, forecastCustomers)

    const hallStaffing: HourlyStaffing = {}
    const kitchenStaffing: HourlyStaffing = {}

    OPERATING_HOURS.forEach((hour) => {
      const forecast = hourlyForecast[hour]

      // デフォルト値を少し揺らしつつ0〜5に収める
      const clamp = (value: number) => Math.max(0, Math.min(5, value))
      const drift = () => Math.round(Math.random() * 2) - 1 // -1,0,1

      const baseHall = clamp(forecast.suggestedHall + drift())
      const baseKitchen = clamp(forecast.suggestedKitchen + drift())

      // 推奨がある場合は最低1は確保
      hallStaffing[hour] = forecast.suggestedHall > 0 ? Math.max(1, baseHall) : baseHall
      kitchenStaffing[hour] = forecast.suggestedKitchen > 0 ? Math.max(1, baseKitchen) : baseKitchen
    })

    days.push({
      date,
      hallStaffing,
      kitchenStaffing,
      forecastSales,
      forecastCustomers,
      hourlyForecast,
      isHoliday: holidayInfo.isHoliday,
      holidayName: holidayInfo.holidayName,
    })
  }
  return days
}

// AI提案を生成（推奨値に基づく）
const generateAIProposal = (weeklyData: DayStaffing[]): DayStaffing[] => {
  return weeklyData.map((day) => {
    const hallStaffing: HourlyStaffing = {}
    const kitchenStaffing: HourlyStaffing = {}

    OPERATING_HOURS.forEach((hour) => {
      hallStaffing[hour] = day.hourlyForecast[hour].suggestedHall
      kitchenStaffing[hour] = day.hourlyForecast[hour].suggestedKitchen
    })

    return {
      ...day,
      hallStaffing,
      kitchenStaffing,
    }
  })
}


export default function ShiftCreation() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [weeklyData, setWeeklyData] = useState<DayStaffing[]>([])
  const [expandedHours, setExpandedHours] = useState<Set<number>>(new Set())
  const [showProblemsOnly, setShowProblemsOnly] = useState(false)
  const [showAIProposal, setShowAIProposal] = useState(false)
  const [aiProposalData, setAIProposalData] = useState<DayStaffing[]>([])

  useEffect(() => {
    const data = generateWeekData(currentWeekStart)
    setWeeklyData(data)
    setAIProposalData(generateAIProposal(data))
    
    // 問題のある時間帯を自動展開
    const problemHours = new Set<number>()
    data.forEach((day) => {
      OPERATING_HOURS.forEach((hour) => {
        const hallDiff = (day.hallStaffing[hour] || 0) - day.hourlyForecast[hour].suggestedHall
        const kitchenDiff = (day.kitchenStaffing[hour] || 0) - day.hourlyForecast[hour].suggestedKitchen
        if (hallDiff < 0 || kitchenDiff < 0 || hallDiff > 0 || kitchenDiff > 0) {
          problemHours.add(hour)
        }
      })
    })
    setExpandedHours(problemHours)
  }, [currentWeekStart])


  // KPI計算
  const kpis = useMemo(() => {
    const hallTotal = weeklyData.reduce((sum, day) => 
      sum + Object.values(day.hallStaffing).reduce((s, v) => s + v, 0), 0)
    const kitchenTotal = weeklyData.reduce((sum, day) => 
      sum + Object.values(day.kitchenStaffing).reduce((s, v) => s + v, 0), 0)
    const totalHours = hallTotal + kitchenTotal
    const laborCost = totalHours * 1200
    const totalSales = weeklyData.reduce((sum, day) => sum + day.forecastSales, 0)
    const laborCostRatio = totalSales > 0 ? (laborCost / totalSales) * 100 : 0

    return { hallTotal, kitchenTotal, totalHours, laborCost, totalSales, laborCostRatio }
  }, [weeklyData])

  // 問題のある時間帯を検出
  const hasProblem = (dayIndex: number, hour: number, position: "hall" | "kitchen") => {
    const day = weeklyData[dayIndex]
    const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
    const currentCount = staffing[hour] || 0
    const suggested = position === "hall" ? day.hourlyForecast[hour].suggestedHall : day.hourlyForecast[hour].suggestedKitchen
    return currentCount !== suggested
  }

  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  const handleThisWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const handleStaffCountChange = (dayIndex: number, hour: number, position: "hall" | "kitchen", change: number) => {
    setWeeklyData((prev) => {
      const newData = [...prev]
      const staffingKey = position === "hall" ? "hallStaffing" : "kitchenStaffing"
      const currentCount = newData[dayIndex][staffingKey][hour] || 0
      newData[dayIndex] = {
        ...newData[dayIndex],
        [staffingKey]: { ...newData[dayIndex][staffingKey], [hour]: Math.max(0, currentCount + change) },
      }
      return newData
    })
  }

  const handleDirectInput = (dayIndex: number, hour: number, position: "hall" | "kitchen", value: string) => {
    const count = Number.parseInt(value) || 0
    setWeeklyData((prev) => {
      const newData = [...prev]
      const staffingKey = position === "hall" ? "hallStaffing" : "kitchenStaffing"
      newData[dayIndex] = {
        ...newData[dayIndex],
        [staffingKey]: { ...newData[dayIndex][staffingKey], [hour]: Math.max(0, count) },
      }
      return newData
    })
  }

  const toggleHourExpansion = (hour: number) => {
    setExpandedHours((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(hour)) {
        newSet.delete(hour)
      } else {
        newSet.add(hour)
      }
      return newSet
    })
  }

  const applyAIProposal = () => {
    setWeeklyData(aiProposalData)
    setShowAIProposal(false)
  }

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

  const renderShiftTable = (position: "hall" | "kitchen", title: string, hours: number, bg: string) => {
    const dataToShow = showAIProposal ? aiProposalData : weeklyData

  return (
      <div key={position} className={`rounded-lg border overflow-hidden ${bg}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white/60 backdrop-blur">
            <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <Badge variant="secondary">{hours}h</Badge>
          </div>
          <div className="flex items-center gap-2">
        <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProblemsOnly(!showProblemsOnly)}
              className={showProblemsOnly ? "bg-amber-50" : ""}
            >
              {showProblemsOnly ? "すべて表示" : "問題のみ"}
        </Button>
            {showAIProposal && (
              <Button variant="outline" size="sm" onClick={() => setShowAIProposal(false)}>
                <X className="h-4 w-4 mr-1" />
                提案を閉じる
        </Button>
            )}
          </div>
      </div>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
              <thead>
              <tr className="bg-gray-50 sticky top-0 z-10">
                <th className="sticky left-0 z-10 bg-gray-50 border-b border-r p-3 text-center font-medium text-gray-600 w-20">
                  時間
                    </th>
                {weeklyData.map((day, dayIndex) => {
                  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
                  const isSpecialDay = isWeekend || day.isHoliday

                  return (
                    <th
                      key={dayIndex}
                      id={`day-${dayIndex}`}
                      className={`border-b border-r p-3 text-center min-w-[110px] ${
                        isSpecialDay ? "bg-red-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs ${isSpecialDay ? "text-red-600" : "text-gray-500"}`}>
                          {format(day.date, "E", { locale: ja })}
                        </span>
                        <span className={`text-lg font-bold ${isSpecialDay ? "text-red-600" : "text-gray-800"}`}>
                          {format(day.date, "d")}
                        </span>
                        {day.isHoliday && (
                          <span className="text-[10px] text-red-600">{day.holidayName}</span>
                        )}
                        <span className="text-[10px] text-gray-500">
                          予測 {day.forecastCustomers}人
                        </span>
                      </div>
                    </th>
                  )
                })}
                <th className="border-b p-3 text-center font-medium text-gray-600 w-16 bg-gray-100">
                  合計
                </th>
              </tr>
            </thead>
            <tbody>
              {OPERATING_HOURS.map((hour) => {
                const hourTotal = weeklyData.reduce((sum, day) => {
                  const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
                  return sum + (staffing[hour] || 0)
                }, 0)

                // この時間帯に問題があるかチェック
                const hasProblemInHour = weeklyData.some((day, dayIndex) => hasProblem(dayIndex, hour, position))
                const isExpanded = expandedHours.has(hour)
                const shouldShow = !showProblemsOnly || hasProblemInHour

                if (!shouldShow && !isExpanded) return null

                return (
                  <tr
                    key={hour}
                    className={`hover:bg-gray-50 ${hasProblemInHour ? "bg-amber-50/30" : ""} ${
                      !isExpanded && !hasProblemInHour ? "hidden" : ""
                    }`}
                  >
                    <td className="sticky left-0 z-10 bg-white border-b border-r p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => toggleHourExpansion(hour)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                        <span className="text-sm font-medium text-gray-700">{hour}:00</span>
                      </div>
                      </td>
                    {dataToShow.map((day, dayIndex) => {
                      const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
                      const currentCount = staffing[hour] || 0
                      const suggested = position === "hall"
                            ? day.hourlyForecast[hour].suggestedHall
                            : day.hourlyForecast[hour].suggestedKitchen
                      const diff = currentCount - suggested
                      const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
                      const isSpecialDay = isWeekend || day.isHoliday
                      const isProblem = diff !== 0

                        return (
                        <td
                          key={dayIndex}
                          className={`border-b border-r p-1 ${isSpecialDay ? "bg-red-50/30" : ""} ${
                            showAIProposal && isProblem ? "ring-2 ring-blue-300" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1">
                                <Button
                                variant="ghost"
                                  size="sm"
                                className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-full hover:bg-gray-200"
                                onClick={() => handleStaffCountChange(dayIndex, hour, position, -1)}
                                disabled={currentCount <= 0 || showAIProposal}
                              >
                                <Minus className="h-5 w-5" />
                                </Button>
                                <Input
                                  type="number"
                                  value={currentCount}
                                onChange={(e) => handleDirectInput(dayIndex, hour, position, e.target.value)}
                                className="w-12 h-11 text-center text-base font-semibold p-0 border-gray-200"
                                  min="0"
                                disabled={showAIProposal}
                                />
                                <Button
                                variant="ghost"
                                  size="sm"
                                className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-full hover:bg-gray-200"
                                onClick={() => handleStaffCountChange(dayIndex, hour, position, 1)}
                                disabled={showAIProposal}
                              >
                                <Plus className="h-5 w-5" />
                              </Button>
                            </div>
                            <div className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
                              <span>推奨 {suggested}</span>
                              {diff !== 0 && (
                                <span
                                  className={`px-1 rounded font-medium ${
                                    diff < 0
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {diff > 0 ? `+${diff}` : diff}
                                </span>
                              )}
                              {diff === 0 && (
                                <span className="text-green-600 px-1 rounded bg-green-50 font-medium">充足</span>
                              )}
                              </div>
                            </div>
                          </td>
                        )
                      })}
                    <td className="border-b p-2 text-center font-medium bg-gray-50">
                      {hourTotal}
                    </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
              <tr className="bg-gray-100">
                <td className="sticky left-0 z-10 bg-gray-100 border-t p-3 text-center font-semibold">日計</td>
                {weeklyData.map((day, dayIndex) => {
                  const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
                  const total = Object.values(staffing).reduce((s, v) => s + v, 0)
                    return (
                    <td key={dayIndex} className="border-t border-r p-3 text-center">
                      <div className="font-bold">{total}h</div>
                      <div className="text-xs text-gray-500">¥{(total * 1200).toLocaleString()}</div>
                      </td>
                    )
                  })}
                <td className="border-t p-3 text-center bg-gray-200">
                  <div className="font-bold">
                    {weeklyData.reduce((sum, day) => {
                      const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
                      return sum + Object.values(staffing).reduce((s, v) => s + v, 0)
                    }, 0)}h
                  </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
                    </div>
    )
  }

                        return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* ヘッダー */}
      <div className="border-b">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">シフト作成</h1>
              <p className="text-sm text-gray-600 mt-1">週間シフトの作成・編集</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
              <Button size="sm" variant="outline">
                <Send className="mr-2 h-4 w-4" />
                従業員に通知
              </Button>
            </div>
                              </div>
                              </div>
                            </div>

      <div className="p-6 space-y-6">
        {/* 週選択 */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleThisWeek}>
              今週
            </Button>
            <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded">
              {format(currentWeekStart, "yyyy年M月d日", { locale: ja })} 〜 {format(weekEnd, "M月d日", { locale: ja })}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {!showAIProposal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIProposal(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI提案を表示
            </Button>
          )}
                          </div>

        {/* KPIサマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">週間予測売上</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">¥{(kpis.totalSales / 10000).toFixed(0)}万</p>
                              </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">総工数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.totalHours}h</p>
            <p className="text-xs text-gray-500">ホール {kpis.hallTotal}h / キッチン {kpis.kitchenTotal}h</p>
                              </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">人件費</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">¥{(kpis.laborCost / 10000).toFixed(1)}万</p>
                            </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">人件費率</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.laborCostRatio.toFixed(1)}%</p>
                            </div>
                          </div>


        {/* AI提案表示時 */}
        {showAIProposal && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">AI提案シフト案</h3>
                <Badge variant="secondary">推奨値ベース</Badge>
                    </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAIProposal(false)}>
                  キャンセル
                </Button>
                <Button size="sm" onClick={applyAIProposal} className="bg-blue-600 hover:bg-blue-700">
                  提案を適用
                </Button>
              </div>
            </div>
            <p className="text-sm text-blue-700">
              推奨人数に基づいた最適なシフト案です。適用すると現在のシフトが上書きされます。
            </p>
            </div>
          )}

        {/* シフトテーブル（ホール／キッチン縦並び） */}
        {([
          { key: "hall" as const, title: "ホール", hours: kpis.hallTotal, bg: "bg-slate-50" },
          { key: "kitchen" as const, title: "キッチン", hours: kpis.kitchenTotal, bg: "bg-blue-50/40" },
        ]).map((section) => renderShiftTable(section.key, section.title, section.hours, section.bg))}
      </div>
    </div>
  )
}
