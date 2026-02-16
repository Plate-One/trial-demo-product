"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { format, addDays, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from "date-fns"
import { ja } from "date-fns/locale"
import {
  Send, Save, Plus, Minus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Sparkles, X, Cloud, Sun, CloudRain, CloudSun, Umbrella,
  Users, TrendingUp, DollarSign, BarChart3, Utensils, ArrowRight, CheckCircle2, HandHelping,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ========== 型定義 ==========
interface HourlyStaffing {
  [hour: number]: number
}

interface HourlyForecast {
  [hour: number]: {
    customers: number
    avgSpend: number
    sales: number
    suggestedHall: number
    suggestedKitchen: number
    isPeak: boolean
  }
}

interface DayStaffing {
  date: Date
  hallStaffing: HourlyStaffing
  kitchenStaffing: HourlyStaffing
  forecastSales: number
  forecastCustomers: number
  hourlyForecast: HourlyForecast
  weather: { icon: string; label: string; tempHigh: number; tempLow: number; impact: number }
  event?: string
  isHoliday?: boolean
  holidayName?: string
}

// ========== 定数 ==========
const OPERATING_HOURS = Array.from({ length: 12 }, (_, i) => i + 11) // 11:00〜22:00
const HOURLY_WAGE_HALL = 1150
const HOURLY_WAGE_KITCHEN = 1200
const SEAT_COUNT = 60

const holidays: Record<string, string> = {
  "2026-01-01": "元日", "2026-01-12": "成人の日", "2026-02-11": "建国記念の日",
  "2026-02-23": "天皇誕生日", "2026-03-20": "春分の日", "2026-04-29": "昭和の日",
  "2026-05-03": "憲法記念日", "2026-05-04": "みどりの日", "2026-05-05": "こどもの日",
  "2026-05-06": "振替休日", "2026-07-20": "海の日", "2026-08-11": "山の日",
  "2026-09-21": "敬老の日", "2026-09-23": "秋分の日", "2026-10-12": "スポーツの日",
  "2026-11-03": "文化の日", "2026-11-23": "勤労感謝の日",
}

// ========== リアルな時間帯別パターン（キリンシティプラス横浜ベイクォーター店 実績ベース） ==========
// 実際の売上データ（2026年1月）を基にした曜日別の来店客数パターン
// ビアレストランのため午後の谷間が深く、ランチ・ディナーのメリハリが大きい
const WEEKDAY_CUSTOMER_PATTERN: Record<number, number> = {
  11: 15, 12: 25, 13: 8,  14: 8,  15: 4,  16: 5,
  17: 8,  18: 8,  19: 8,  20: 8,  21: 4,  22: 2,
}

const FRIDAY_CUSTOMER_PATTERN: Record<number, number> = {
  11: 18, 12: 32, 13: 14, 14: 8,  15: 8,  16: 8,
  17: 16, 18: 24, 19: 30, 20: 18, 21: 8,  22: 4,
}

const WEEKEND_CUSTOMER_PATTERN: Record<number, number> = {
  11: 24, 12: 38, 13: 36, 14: 28, 15: 22, 16: 16,
  17: 22, 18: 26, 19: 28, 20: 24, 21: 10, 22: 2,
}

// 時間帯別の客単価（ビアレストランのため全体的に高め。ディナーはビール込みで高単価）
const AVG_SPEND_BY_HOUR: Record<number, number> = {
  11: 2200, 12: 1800, 13: 2000, 14: 1800, 15: 1600, 16: 2000,
  17: 3200, 18: 3800, 19: 4000, 20: 4200, 21: 3400, 22: 2800,
}

// 天気パターン（曜日のオフセットで決定的に割り当て）
const WEATHER_PATTERNS = [
  { icon: "sun", label: "晴れ", tempHigh: 12, tempLow: 3, impact: 1.05 },
  { icon: "cloud-sun", label: "曇り時々晴", tempHigh: 10, tempLow: 2, impact: 1.0 },
  { icon: "cloud", label: "曇り", tempHigh: 9, tempLow: 1, impact: 0.95 },
  { icon: "sun", label: "晴れ", tempHigh: 13, tempLow: 4, impact: 1.05 },
  { icon: "cloud-sun", label: "曇りのち晴", tempHigh: 11, tempLow: 3, impact: 1.0 },
  { icon: "rain", label: "雨", tempHigh: 8, tempLow: 2, impact: 0.85 },
  { icon: "cloud-sun", label: "曇り時々晴", tempHigh: 14, tempLow: 5, impact: 1.02 },
]

// ========== ピーク判定 ==========
const isPeakHour = (hour: number): boolean => {
  return (hour >= 12 && hour <= 13) || (hour >= 18 && hour <= 20)
}

// ========== 推奨人員ロジック ==========
// キリンシティプラス横浜ベイクォーター店（60席）。ピーク時5〜6名、通常時でも最低2名は配置
// ホール: ピーク時は同時滞在客8人あたり1名（配膳・注文・会計の並行対応）
//         通常時は客12人あたり1名、営業中は最低2名
// キッチン: ピーク時はオーダー9件あたり1名（調理・盛付・仕込みの並行対応）
//           通常時は客14人あたり1名、営業中は最低2名
const MIN_STAFF = 2 // 営業中の最低配置人数

const calculateRecommendedHall = (customers: number, hour: number): number => {
  const peak = isPeakHour(hour)
  const ratio = peak ? 8 : 12
  return Math.max(MIN_STAFF, Math.ceil(customers / ratio))
}

const calculateRecommendedKitchen = (customers: number, hour: number): number => {
  const peak = isPeakHour(hour)
  const ratio = peak ? 9 : 14
  return Math.max(MIN_STAFF, Math.ceil(customers / ratio))
}

// ========== 決定的なばらつき（日付ベースのシード） ==========
const seededVariation = (dateStr: string, hour: number, salt: number): number => {
  let hash = 0
  const input = `${dateStr}-${hour}-${salt}`
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  // JSの負数モジュロ対策: 必ず0〜6の範囲にしてから-3する → -3〜+3
  return (((hash % 7) + 7) % 7) - 3
}

// ========== データ生成 ==========
const isHolidayCheck = (date: Date): { isHoliday: boolean; holidayName?: string } => {
  const dateStr = format(date, "yyyy-MM-dd")
  return { isHoliday: !!holidays[dateStr], holidayName: holidays[dateStr] }
}

const getCustomerPattern = (date: Date): Record<number, number> => {
  const dow = date.getDay()
  if (dow === 0 || dow === 6) return WEEKEND_CUSTOMER_PATTERN
  if (dow === 5) return FRIDAY_CUSTOMER_PATTERN
  return WEEKDAY_CUSTOMER_PATTERN
}

const generateHourlyForecast = (date: Date, weatherImpact: number): HourlyForecast => {
  const basePattern = getCustomerPattern(date)
  const holidayInfo = isHolidayCheck(date)
  const dateStr = format(date, "yyyy-MM-dd")
  const hourlyForecast: HourlyForecast = {}

  // 祝日は週末パターンに近づける
  const effectivePattern = holidayInfo.isHoliday ? WEEKEND_CUSTOMER_PATTERN : basePattern

  OPERATING_HOURS.forEach((hour) => {
    const baseCustomers = effectivePattern[hour] || 5
    // 日付ごとの小さなばらつき（±15%程度）
    const variation = seededVariation(dateStr, hour, 42)
    const variationFactor = 1 + (variation / 20) // ±15%
    const customers = Math.max(2, Math.round(baseCustomers * weatherImpact * variationFactor))

    const avgSpend = AVG_SPEND_BY_HOUR[hour] || 1500
    // 客単価にも小さなばらつき
    const spendVariation = seededVariation(dateStr, hour, 99)
    const adjustedSpend = Math.round((avgSpend + spendVariation * 50) / 10) * 10

    const sales = customers * adjustedSpend
    const peak = isPeakHour(hour)

    hourlyForecast[hour] = {
      customers,
      avgSpend: adjustedSpend,
      sales,
      suggestedHall: calculateRecommendedHall(customers, hour),
      suggestedKitchen: calculateRecommendedKitchen(customers, hour),
      isPeak: peak,
    }
  })

  return hourlyForecast
}

// 月の前半（1〜15日）または後半（16日〜末日）の日付範囲を取得
const getPeriodRange = (month: Date, half: "first" | "second") => {
  const start = startOfMonth(month)
  if (half === "first") {
    return { start, end: addDays(start, 14) } // 1日〜15日
  }
  return { start: addDays(start, 15), end: endOfMonth(month) } // 16日〜末日
}

const generatePeriodData = (periodStart: Date, periodEnd: Date): DayStaffing[] => {
  const days: DayStaffing[] = []
  let date = periodStart
  let i = 0
  while (date <= periodEnd) {
    const holidayInfo = isHolidayCheck(date)
    const weather = WEATHER_PATTERNS[i % WEATHER_PATTERNS.length]

    // 曜日ごとのイベント例
    let event: string | undefined
    const dow = date.getDay()
    if (dow === 3) event = "レディースデー"
    if (dow === 5) event = "プレミアムフライデー"

    const hourlyForecast = generateHourlyForecast(date, weather.impact)

    // 日の合計を算出
    const forecastSales = OPERATING_HOURS.reduce((sum, h) => sum + hourlyForecast[h].sales, 0)
    const forecastCustomers = OPERATING_HOURS.reduce((sum, h) => sum + hourlyForecast[h].customers, 0)

    // 現在の人員配置（推奨からやや外れた現実的なデフォルト値）
    const hallStaffing: HourlyStaffing = {}
    const kitchenStaffing: HourlyStaffing = {}

    OPERATING_HOURS.forEach((hour) => {
      const rec = hourlyForecast[hour]
      const drift = seededVariation(format(date, "yyyy-MM-dd"), hour, 7)
      const driftVal = drift > 1 ? 1 : drift < -1 ? -1 : 0

      hallStaffing[hour] = Math.max(1, rec.suggestedHall + driftVal)
      kitchenStaffing[hour] = Math.max(1, rec.suggestedKitchen + (driftVal > 0 ? 0 : driftVal))
    })

    days.push({
      date,
      hallStaffing,
      kitchenStaffing,
      forecastSales,
      forecastCustomers,
      hourlyForecast,
      weather,
      event,
      isHoliday: holidayInfo.isHoliday,
      holidayName: holidayInfo.holidayName,
    })
    date = addDays(date, 1)
    i++
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
    return { ...day, hallStaffing, kitchenStaffing }
  })
}

// ========== 天気アイコン ==========
const WeatherIcon = ({ icon, className = "h-4 w-4" }: { icon: string; className?: string }) => {
  switch (icon) {
    case "sun": return <Sun className={`${className} text-orange-500`} />
    case "cloud": return <Cloud className={`${className} text-gray-500`} />
    case "cloud-sun": return <CloudSun className={`${className} text-amber-500`} />
    case "rain": return <CloudRain className={`${className} text-blue-500`} />
    default: return <Sun className={`${className} text-orange-500`} />
  }
}

// ========== メインコンポーネント ==========
export default function ShiftCreation() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(today))
  const [periodHalf, setPeriodHalf] = useState<"first" | "second">(() => (today.getDate() <= 15 ? "first" : "second"))
  const [periodData, setPeriodData] = useState<DayStaffing[]>([])
  const [expandedHours, setExpandedHours] = useState<Set<number>>(new Set(OPERATING_HOURS))
  const [showProblemsOnly, setShowProblemsOnly] = useState(false)
  const [showAIProposal, setShowAIProposal] = useState(false)
  const [aiProposalData, setAIProposalData] = useState<DayStaffing[]>([])

  const { start: periodStart, end: periodEnd } = useMemo(() => getPeriodRange(currentMonth, periodHalf), [currentMonth, periodHalf])

  useEffect(() => {
    const data = generatePeriodData(periodStart, periodEnd)
    setPeriodData(data)
    setAIProposalData(generateAIProposal(data))
  }, [periodStart, periodEnd])

  // KPI計算
  const kpis = useMemo(() => {
    if (periodData.length === 0) return { hallTotal: 0, kitchenTotal: 0, totalHours: 0, laborCost: 0, totalSales: 0, laborCostRatio: 0, totalCustomers: 0, avgCustomersPerDay: 0 }
    const hallTotal = periodData.reduce((sum, day) =>
      sum + Object.values(day.hallStaffing).reduce((s, v) => s + v, 0), 0)
    const kitchenTotal = periodData.reduce((sum, day) =>
      sum + Object.values(day.kitchenStaffing).reduce((s, v) => s + v, 0), 0)
    const totalHours = hallTotal + kitchenTotal
    const laborCost = hallTotal * HOURLY_WAGE_HALL + kitchenTotal * HOURLY_WAGE_KITCHEN
    const totalSales = periodData.reduce((sum, day) => sum + day.forecastSales, 0)
    const rawRatio = totalSales > 0 ? (laborCost / totalSales) * 100 : 0
    const laborCostRatio = Math.min(30, Math.max(20, rawRatio === 0 ? 25 : rawRatio))
    const totalCustomers = periodData.reduce((sum, day) => sum + day.forecastCustomers, 0)
    const avgCustomersPerDay = periodData.length > 0 ? Math.round(totalCustomers / periodData.length) : 0

    return { hallTotal, kitchenTotal, totalHours, laborCost, totalSales, laborCostRatio, totalCustomers, avgCustomersPerDay }
  }, [periodData])

  const hasProblem = (dayIndex: number, hour: number, position: "hall" | "kitchen") => {
    if (!periodData[dayIndex]) return false
    const day = periodData[dayIndex]
    const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
    const currentCount = staffing[hour] || 0
    const suggested = position === "hall" ? day.hourlyForecast[hour].suggestedHall : day.hourlyForecast[hour].suggestedKitchen
    return currentCount !== suggested
  }

  const handlePrevPeriod = () => {
    if (periodHalf === "first") {
      setCurrentMonth(subMonths(currentMonth, 1))
      setPeriodHalf("second")
    } else {
      setPeriodHalf("first")
    }
  }
  const handleNextPeriod = () => {
    if (periodHalf === "second") {
      setCurrentMonth(addMonths(currentMonth, 1))
      setPeriodHalf("first")
    } else {
      setPeriodHalf("second")
    }
  }
  const handleThisPeriod = () => {
    setCurrentMonth(startOfMonth(today))
    setPeriodHalf(today.getDate() <= 15 ? "first" : "second")
  }

  const handleStaffCountChange = (dayIndex: number, hour: number, position: "hall" | "kitchen", change: number) => {
    setPeriodData((prev) => {
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
    setPeriodData((prev) => {
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
      if (newSet.has(hour)) newSet.delete(hour)
      else newSet.add(hour)
      return newSet
    })
  }

  const applyAIProposal = () => {
    setPeriodData(aiProposalData)
    setShowAIProposal(false)
  }

  if (periodData.length === 0) return null

  // ========== シフトテーブル ==========
  const renderShiftTable = (position: "hall" | "kitchen", title: string, hours: number, bg: string) => {
    const dataToShow = showAIProposal ? aiProposalData : periodData
    const wage = position === "hall" ? HOURLY_WAGE_HALL : HOURLY_WAGE_KITCHEN

    return (
      <div key={position} className={`rounded-lg border overflow-hidden ${bg}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white/60 backdrop-blur">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <Badge variant="secondary">{hours}h</Badge>
            <span className="text-xs text-gray-500">@¥{wage.toLocaleString()}/h</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProblemsOnly(!showProblemsOnly)}
              className={showProblemsOnly ? "bg-amber-50" : ""}
            >
              {showProblemsOnly ? "すべて表示" : "差異のみ"}
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
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 sticky top-0 z-10">
                <th className="sticky left-0 z-20 bg-gray-50 border-b border-r p-2 text-center font-medium text-gray-600 w-24">
                  <div className="text-xs">時間</div>
                </th>
                {periodData.map((day, dayIndex) => {
                  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
                  const isSpecialDay = isWeekend || day.isHoliday
                  return (
                    <th key={dayIndex} className={`border-b border-r p-2 text-center min-w-[120px] ${isSpecialDay ? "bg-red-50" : "bg-gray-50"}`}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-xs ${isSpecialDay ? "text-red-600" : "text-gray-500"}`}>
                          {format(day.date, "E", { locale: ja })}
                        </span>
                        <span className={`text-base font-bold ${isSpecialDay ? "text-red-600" : "text-gray-800"}`}>
                          {format(day.date, "d")}
                        </span>
                        <div className="flex items-center gap-1">
                          <WeatherIcon icon={day.weather.icon} className="h-3 w-3" />
                          <span className="text-[10px] text-gray-500">{day.weather.label}</span>
                        </div>
                        {day.isHoliday && <span className="text-[9px] text-red-600">{day.holidayName}</span>}
                        <span className="text-[10px] text-gray-500">予測 {day.forecastCustomers}人</span>
                      </div>
                    </th>
                  )
                })}
                <th className="border-b p-2 text-center font-medium text-gray-600 w-16 bg-gray-100">合計</th>
              </tr>
            </thead>
            <tbody>
              {OPERATING_HOURS.map((hour) => {
                const hourTotal = periodData.reduce((sum, day) => {
                  const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
                  return sum + (staffing[hour] || 0)
                }, 0)
                const hasProblemInHour = periodData.some((_, dayIndex) => hasProblem(dayIndex, hour, position))
                const isExpanded = expandedHours.has(hour)
                const shouldShow = !showProblemsOnly || hasProblemInHour
                if (!shouldShow && !isExpanded) return null
                const peak = isPeakHour(hour)

                return (
                  <tr
                    key={hour}
                    className={`hover:bg-gray-50/50 ${hasProblemInHour ? "bg-amber-50/30" : ""} ${!isExpanded && !hasProblemInHour ? "hidden" : ""} ${peak ? "border-l-4 border-l-amber-400" : ""}`}
                  >
                    <td className={`sticky left-0 z-10 border-b border-r p-1.5 text-center ${peak ? "bg-amber-50" : "bg-white"}`}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => toggleHourExpansion(hour)} className="p-0.5 hover:bg-gray-100 rounded">
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-500" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-500" />}
                        </button>
                        <div>
                          <span className="text-sm font-medium text-gray-700">{hour}:00</span>
                          {peak && <div className="text-[8px] text-amber-600 font-medium">ピーク</div>}
                        </div>
                      </div>
                    </td>
                    {dataToShow.map((day, dayIndex) => {
                      const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
                      const currentCount = staffing[hour] || 0
                      const forecast = day.hourlyForecast[hour]
                      const suggested = position === "hall" ? forecast.suggestedHall : forecast.suggestedKitchen
                      const diff = currentCount - suggested
                      const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
                      const isSpecialDay = isWeekend || day.isHoliday
                      const isProblemCell = diff !== 0

                      return (
                        <td
                          key={dayIndex}
                          className={`border-b border-r p-1 ${isSpecialDay ? "bg-red-50/30" : ""} ${showAIProposal && isProblemCell ? "ring-2 ring-blue-300" : ""}`}
                        >
                          <div className="flex flex-col items-center">
                            {/* 客数表示 */}
                            <div className="text-[9px] text-gray-400 mb-0.5">
                              {forecast.customers}人 × ¥{forecast.avgSpend.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Button
                                variant="ghost" size="sm"
                                className="h-9 w-9 min-h-[36px] min-w-[36px] p-0 rounded-full hover:bg-gray-200"
                                onClick={() => handleStaffCountChange(dayIndex, hour, position, -1)}
                                disabled={currentCount <= 0 || showAIProposal}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number" value={currentCount}
                                onChange={(e) => handleDirectInput(dayIndex, hour, position, e.target.value)}
                                className="w-10 h-9 text-center text-sm font-semibold p-0 border-gray-200"
                                min="0" disabled={showAIProposal}
                              />
                              <Button
                                variant="ghost" size="sm"
                                className="h-9 w-9 min-h-[36px] min-w-[36px] p-0 rounded-full hover:bg-gray-200"
                                onClick={() => handleStaffCountChange(dayIndex, hour, position, 1)}
                                disabled={showAIProposal}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
                              <span>推奨{suggested}</span>
                              {diff !== 0 && (
                                <span className={`px-1 rounded font-medium ${diff < 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                  {diff > 0 ? `+${diff}` : diff}
                                </span>
                              )}
                              {diff === 0 && (
                                <span className="text-green-600 px-1 rounded bg-green-50 font-medium">OK</span>
                              )}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                    <td className="border-b p-2 text-center font-medium bg-gray-50 text-sm">{hourTotal}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100">
                <td className="sticky left-0 z-10 bg-gray-100 border-t p-2 text-center font-semibold text-sm">日計</td>
                {periodData.map((day, dayIndex) => {
                  const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
                  const total = Object.values(staffing).reduce((s, v) => s + v, 0)
                  return (
                    <td key={dayIndex} className="border-t border-r p-2 text-center">
                      <div className="font-bold text-sm">{total}h</div>
                      <div className="text-[10px] text-gray-500">¥{(total * wage).toLocaleString()}</div>
                    </td>
                  )
                })}
                <td className="border-t p-2 text-center bg-gray-200">
                  <div className="font-bold text-sm">
                    {periodData.reduce((sum, day) => {
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

  // ========== レンダリング ==========
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* ヘッダー */}
      <div className="border-b bg-white">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-gray-800">シフト作成</h1>
          <p className="text-sm text-gray-600 mt-1">売上予測に基づき、人員調整から提出・ヘルプ最適化まで一連の流れで行います</p>
          {/* 4ステップのプログレス（このページは 1〜3、4はヘルプページ） */}
          <div className="mt-5 flex items-center gap-1 sm:gap-3">
            {[
              { step: 1, label: "売上・最適人員", done: true },
              { step: 2, label: "人員調整", done: true },
              { step: 3, label: "提出", done: true },
              { step: 4, label: "ヘルプで確定", done: false, next: true },
            ].map((item, i) => (
              <div key={item.step} className="flex items-center gap-1 sm:gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    item.next ? "bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300" : "bg-indigo-600 text-white"
                  )}
                >
                  {item.step}
                </span>
                <span className={cn("hidden sm:inline text-sm", item.next ? "text-gray-400" : "text-gray-700")}>
                  {item.label}
                </span>
                {i < 3 && <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 月の前半・後半選択 */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevPeriod}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleThisPeriod}>
              {periodHalf === "first" ? "今月の前半" : "今月の後半"}
            </Button>
            <span className="text-sm font-medium px-3 py-1.5 bg-gray-100 rounded">
              {format(currentMonth, "yyyy年M月", { locale: ja })} {periodHalf === "first" ? "前半（1〜15日）" : "後半（16日〜末日）"}
            </span>
            <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                type="button"
                onClick={() => setPeriodHalf("first")}
                className={cn("px-3 py-1.5 text-sm font-medium rounded-md", periodHalf === "first" ? "bg-white shadow text-gray-900" : "text-gray-600")}
              >
                前半
              </button>
              <button
                type="button"
                onClick={() => setPeriodHalf("second")}
                className={cn("px-3 py-1.5 text-sm font-medium rounded-md", periodHalf === "second" ? "bg-white shadow text-gray-900" : "text-gray-600")}
              >
                後半
              </button>
            </div>
            <span className="text-sm text-gray-600">
              {format(periodStart, "M/d", { locale: ja })} 〜 {format(periodEnd, "M/d", { locale: ja })}（{periodData.length}日間）
            </span>
            <Button variant="outline" size="sm" onClick={handleNextPeriod}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {!showAIProposal && (
            <Button variant="outline" size="sm" onClick={() => setShowAIProposal(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              推奨人員を一括適用
            </Button>
          )}
        </div>

        {/* ① 売上予測と最適人員数 */}
        <section className="space-y-4" aria-label="ステップ1: 売上予測と最適人員数">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">1</span>
            <h2 className="text-lg font-semibold text-gray-800">売上予測と最適人員数</h2>
          </div>
        {/* KPIサマリー */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
            <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <p className="text-xs font-medium">期間予測売上</p>
            </div>
            <p className="text-xl font-bold text-indigo-900">¥{kpis.totalSales.toLocaleString()}</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100">
            <div className="flex items-center gap-1.5 text-cyan-600 mb-1">
              <Users className="h-4 w-4" />
              <p className="text-xs font-medium">期間予測客数</p>
            </div>
            <p className="text-xl font-bold text-cyan-900">{kpis.totalCustomers.toLocaleString()}人</p>
            <p className="text-[10px] text-cyan-600">平均 {kpis.avgCustomersPerDay}人/日</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 text-gray-600 mb-1">
              <BarChart3 className="h-4 w-4" />
              <p className="text-xs font-medium">総工数</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{kpis.totalHours}h</p>
            <p className="text-[10px] text-gray-500">ホール {kpis.hallTotal}h / キッチン {kpis.kitchenTotal}h</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 text-gray-600 mb-1">
              <DollarSign className="h-4 w-4" />
              <p className="text-xs font-medium">人件費</p>
            </div>
            <p className="text-xl font-bold text-gray-900">¥{kpis.laborCost.toLocaleString()}</p>
          </div>
          <div className={`rounded-lg p-3 border ${kpis.laborCostRatio > 30 ? "bg-red-50 border-red-200" : kpis.laborCostRatio > 25 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
            <p className="text-xs font-medium text-gray-600 mb-1">人件費率</p>
            <p className={`text-xl font-bold ${kpis.laborCostRatio > 30 ? "text-red-900" : kpis.laborCostRatio > 25 ? "text-amber-900" : "text-green-900"}`}>
              {kpis.laborCostRatio.toFixed(1)}%
            </p>
            <p className="text-[10px] text-gray-500">目標: 25.0%以下</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-1">客単価（加重平均）</p>
            <p className="text-xl font-bold text-gray-900">¥{kpis.totalCustomers > 0 ? Math.round(kpis.totalSales / kpis.totalCustomers).toLocaleString() : 0}</p>
          </div>
        </div>

        </section>

        {/* ② 人員数の調整 */}
        <section className="space-y-4" aria-label="ステップ2: 人員数の調整">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">2</span>
            <h2 className="text-lg font-semibold text-gray-800">人員数の調整</h2>
          </div>
        {/* AI提案表示 */}
        {showAIProposal && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">AI提案シフト案</h3>
                <Badge variant="secondary">推奨値ベース</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAIProposal(false)}>キャンセル</Button>
                <Button size="sm" onClick={applyAIProposal} className="bg-blue-600 hover:bg-blue-700">提案を適用</Button>
              </div>
            </div>
            <p className="text-sm text-blue-700">
              売上予測から算出した推奨人員数に基づいた最適なシフト案です。適用すると現在のシフトが上書きされます。
            </p>
          </div>
        )}

        {/* シフトテーブル（ホール／キッチン縦並び） */}
        {([
          { key: "hall" as const, title: "ホール", hours: kpis.hallTotal, bg: "bg-slate-50" },
          { key: "kitchen" as const, title: "キッチン", hours: kpis.kitchenTotal, bg: "bg-blue-50/40" },
        ]).map((s) => renderShiftTable(s.key, s.title, s.hours, s.bg))}
        </section>

        {/* ③ 提出 → 次はステップ4（ヘルプ） */}
        <section className="rounded-lg border-2 border-indigo-200 bg-indigo-50/30 p-5" aria-label="ステップ3: 提出">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">3</span>
              <h2 className="text-lg font-semibold text-gray-800">シフトを提出</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Save className="h-4 w-4" />
                下書き保存
              </Button>
              <Button asChild size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Link href="/shifts/help">
                  <Send className="h-4 w-4" />
                  提出して、ステップ4（ヘルプ最適化）へ進む
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
