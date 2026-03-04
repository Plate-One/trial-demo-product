import { format, addDays, startOfMonth, endOfMonth } from "date-fns"
import { Cloud, Sun, CloudRain, CloudSun } from "lucide-react"

// ========== 型定義 ==========
export interface HourlyStaffing {
  [hour: number]: number
}

export interface HourlyForecast {
  [hour: number]: {
    customers: number
    avgSpend: number
    sales: number
    suggestedHall: number
    suggestedKitchen: number
    isPeak: boolean
  }
}

export interface DayStaffing {
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
export const OPERATING_HOURS = Array.from({ length: 12 }, (_, i) => i + 11) // 11:00〜22:00
export const HOURLY_WAGE_HALL = 1150
export const HOURLY_WAGE_KITCHEN = 1200
export const SEAT_COUNT = 60

export const holidays: Record<string, string> = {
  "2026-01-01": "元日", "2026-01-12": "成人の日", "2026-02-11": "建国記念の日",
  "2026-02-23": "天皇誕生日", "2026-03-20": "春分の日", "2026-04-29": "昭和の日",
  "2026-05-03": "憲法記念日", "2026-05-04": "みどりの日", "2026-05-05": "こどもの日",
  "2026-05-06": "振替休日", "2026-07-20": "海の日", "2026-08-11": "山の日",
  "2026-09-21": "敬老の日", "2026-09-23": "秋分の日", "2026-10-12": "スポーツの日",
  "2026-11-03": "文化の日", "2026-11-23": "勤労感謝の日",
}

// ========== リアルな時間帯別パターン（キリンシティプラス横浜ベイクォーター店 実績ベース） ==========
// 平日合計 ~95人/日、金曜 ~170人/日、土日 ~255人/日
const WEEKDAY_CUSTOMER_PATTERN: Record<number, number> = {
  11: 8,  12: 18, 13: 12, 14: 6,  15: 3,  16: 3,
  17: 6,  18: 12, 19: 12, 20: 8,  21: 5,  22: 2,
}

const FRIDAY_CUSTOMER_PATTERN: Record<number, number> = {
  11: 12, 12: 25, 13: 15, 14: 8,  15: 5,  16: 5,
  17: 15, 18: 28, 19: 28, 20: 16, 21: 8,  22: 5,
}

const WEEKEND_CUSTOMER_PATTERN: Record<number, number> = {
  11: 18, 12: 35, 13: 32, 14: 22, 15: 15, 16: 12,
  17: 20, 18: 30, 19: 30, 20: 22, 21: 12, 22: 7,
}

// 平日客単価 ~¥2,900、金曜 ~¥3,100、週末 ~¥2,900
const AVG_SPEND_BY_HOUR: Record<number, number> = {
  11: 2200, 12: 1900, 13: 2100, 14: 2000, 15: 1800, 16: 2200,
  17: 3200, 18: 3800, 19: 4200, 20: 4400, 21: 3600, 22: 3000,
}

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
export const isPeakHour = (hour: number): boolean => {
  return (hour >= 12 && hour <= 13) || (hour >= 18 && hour <= 20)
}

// ========== 推奨人員ロジック ==========
const MIN_STAFF = 2

export const calculateRecommendedHall = (customers: number, hour: number): number => {
  const peak = isPeakHour(hour)
  const ratio = peak ? 8 : 12
  return Math.max(MIN_STAFF, Math.ceil(customers / ratio))
}

export const calculateRecommendedKitchen = (customers: number, hour: number): number => {
  const peak = isPeakHour(hour)
  const ratio = peak ? 9 : 14
  return Math.max(MIN_STAFF, Math.ceil(customers / ratio))
}

// ========== 決定的なばらつき ==========
const seededVariation = (dateStr: string, hour: number, salt: number): number => {
  let hash = 0
  const input = `${dateStr}-${hour}-${salt}`
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
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

  const effectivePattern = holidayInfo.isHoliday ? WEEKEND_CUSTOMER_PATTERN : basePattern

  OPERATING_HOURS.forEach((hour) => {
    const baseCustomers = effectivePattern[hour] || 5
    const variation = seededVariation(dateStr, hour, 42)
    const variationFactor = 1 + (variation / 20)
    const customers = Math.max(2, Math.round(baseCustomers * weatherImpact * variationFactor))

    const avgSpend = AVG_SPEND_BY_HOUR[hour] || 1500
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

export const getPeriodRange = (month: Date, half: "first" | "second") => {
  const start = startOfMonth(month)
  if (half === "first") {
    return { start, end: addDays(start, 14) }
  }
  return { start: addDays(start, 15), end: endOfMonth(month) }
}

export const generatePeriodData = (periodStart: Date, periodEnd: Date): DayStaffing[] => {
  const days: DayStaffing[] = []
  let date = periodStart
  let i = 0
  while (date <= periodEnd) {
    const holidayInfo = isHolidayCheck(date)
    const weather = WEATHER_PATTERNS[i % WEATHER_PATTERNS.length]

    let event: string | undefined
    const dow = date.getDay()
    if (dow === 3) event = "レディースデー"
    if (dow === 5) event = "プレミアムフライデー"

    const hourlyForecast = generateHourlyForecast(date, weather.impact)

    const forecastSales = OPERATING_HOURS.reduce((sum, h) => sum + hourlyForecast[h].sales, 0)
    const forecastCustomers = OPERATING_HOURS.reduce((sum, h) => sum + hourlyForecast[h].customers, 0)

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

export const generateAIProposal = (weeklyData: DayStaffing[]): DayStaffing[] => {
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

// ========== KPI計算 ==========
export interface KpiSummary {
  hallTotal: number
  kitchenTotal: number
  totalHours: number
  laborCost: number
  totalSales: number
  laborCostRatio: number
  totalCustomers: number
  avgCustomersPerDay: number
}

export const calculateKpis = (periodData: DayStaffing[]): KpiSummary => {
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
}

// ========== 問題セル分析 ==========
export interface ProblemSummary {
  understaffed: number
  overstaffed: number
  peakUnderstaffed: number
}

export const analyzeProblemCells = (periodData: DayStaffing[]): ProblemSummary => {
  let understaffed = 0
  let overstaffed = 0
  let peakUnderstaffed = 0
  for (const day of periodData) {
    for (const hour of OPERATING_HOURS) {
      const forecast = day.hourlyForecast[hour]
      for (const pos of ["hall", "kitchen"] as const) {
        const current = pos === "hall" ? day.hallStaffing[hour] : day.kitchenStaffing[hour]
        const suggested = pos === "hall" ? forecast.suggestedHall : forecast.suggestedKitchen
        const diff = current - suggested
        if (diff < 0) {
          understaffed++
          if (isPeakHour(hour)) peakUnderstaffed++
        }
        if (diff > 0) overstaffed++
      }
    }
  }
  return { understaffed, overstaffed, peakUnderstaffed }
}

// ========== 差異リスト ==========
export interface DeviationItem {
  date: Date
  hour: number
  position: "ホール" | "キッチン"
  suggested: number
  current: number
  diff: number
  isPeak: boolean
}

export const getDeviations = (periodData: DayStaffing[]): DeviationItem[] => {
  const deviations: DeviationItem[] = []
  for (const day of periodData) {
    for (const hour of OPERATING_HOURS) {
      const forecast = day.hourlyForecast[hour]
      for (const pos of ["hall", "kitchen"] as const) {
        const current = pos === "hall" ? day.hallStaffing[hour] : day.kitchenStaffing[hour]
        const suggested = pos === "hall" ? forecast.suggestedHall : forecast.suggestedKitchen
        const diff = current - suggested
        if (diff !== 0) {
          deviations.push({
            date: day.date,
            hour,
            position: pos === "hall" ? "ホール" : "キッチン",
            suggested,
            current,
            diff,
            isPeak: isPeakHour(hour),
          })
        }
      }
    }
  }
  // 不足を先に、ピーク時を優先
  deviations.sort((a, b) => {
    if (a.diff < 0 && b.diff >= 0) return -1
    if (a.diff >= 0 && b.diff < 0) return 1
    if (a.isPeak && !b.isPeak) return -1
    if (!a.isPeak && b.isPeak) return 1
    return a.diff - b.diff
  })
  return deviations
}
