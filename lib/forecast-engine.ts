/**
 * 需要予測エンジン
 * Python参照スクリプトの統計手法をTypeScriptに移植
 * - 過去データから曜日×時間帯別パターンを算出
 * - 祝日/天候補正を適用
 * - 時間帯別の来客数・売上・推奨人員を出力
 */

import {
  calculateRecommendedHall,
  calculateRecommendedKitchen,
  isPeakHour,
  holidays,
  OPERATING_HOURS,
} from "./shift-create-data"

// ========== 型定義 ==========
export interface ActualSalesRow {
  store_id: string
  date: string
  hour: number
  customers: number
  sales: number
  day_type: string
}

export interface HourlyForecastData {
  [hour: number]: {
    customers: number
    avgSpend: number
    sales: number
    suggestedHall: number
    suggestedKitchen: number
    isPeak: boolean
  }
}

export interface ForecastResult {
  store_id: string
  date: string
  forecast_customers: number
  forecast_sales: number
  hourly_data: HourlyForecastData
  weather: { icon: string; label: string; tempHigh: number; tempLow: number; impact: number } | null
  event: string | null
  is_holiday: boolean
  holiday_name: string | null
}

// ========== 天候パターン（決定的ハッシュで日付ごとに割り当て） ==========
const WEATHER_PATTERNS = [
  { icon: "sun", label: "晴れ", tempHigh: 12, tempLow: 3, impact: 1.05 },
  { icon: "cloud-sun", label: "曇り時々晴", tempHigh: 10, tempLow: 2, impact: 1.0 },
  { icon: "cloud", label: "曇り", tempHigh: 9, tempLow: 1, impact: 0.95 },
  { icon: "sun", label: "晴れ", tempHigh: 13, tempLow: 4, impact: 1.05 },
  { icon: "cloud-sun", label: "曇りのち晴", tempHigh: 11, tempLow: 3, impact: 1.0 },
  { icon: "rain", label: "雨", tempHigh: 8, tempLow: 2, impact: 0.85 },
  { icon: "cloud-sun", label: "曇り時々晴", tempHigh: 14, tempLow: 5, impact: 1.02 },
]

// ========== ユーティリティ ==========
function getDayType(dateStr: string): string {
  if (holidays[dateStr]) return "holiday"
  const d = new Date(dateStr)
  const dow = d.getDay()
  if (dow === 0) return "sunday"
  if (dow === 6) return "saturday"
  if (dow === 5) return "friday"
  return "weekday"
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

function getWeather(dateStr: string) {
  const idx = simpleHash(dateStr) % WEATHER_PATTERNS.length
  return WEATHER_PATTERNS[idx]
}

function getEvent(dateStr: string): string | null {
  const d = new Date(dateStr)
  const dow = d.getDay()
  if (dow === 3) return "レディースデー"
  if (dow === 5) return "プレミアムフライデー"
  return null
}

// ========== メイン予測ロジック ==========

/**
 * 過去データから時間帯比率を計算
 * Python版: load_hourly_ratios() に相当
 */
export function calculateHourlyRatios(
  actualSales: ActualSalesRow[]
): Record<string, Record<number, { avgCustomers: number; avgSales: number; ratio: number }>> {
  // day_type 別 × hour 別に集約
  const grouped: Record<string, Record<number, { totalCustomers: number; totalSales: number; count: number }>> = {}

  for (const row of actualSales) {
    const dt = row.day_type
    if (!grouped[dt]) grouped[dt] = {}
    if (!grouped[dt][row.hour]) grouped[dt][row.hour] = { totalCustomers: 0, totalSales: 0, count: 0 }
    grouped[dt][row.hour].totalCustomers += row.customers
    grouped[dt][row.hour].totalSales += row.sales
    grouped[dt][row.hour].count += 1
  }

  const result: Record<string, Record<number, { avgCustomers: number; avgSales: number; ratio: number }>> = {}

  for (const [dayType, hours] of Object.entries(grouped)) {
    result[dayType] = {}
    // 日次平均来客数を算出
    const dailyTotalCustomers = Object.values(hours).reduce(
      (sum, h) => sum + (h.totalCustomers / h.count), 0
    )

    for (const [hourStr, data] of Object.entries(hours)) {
      const hour = Number(hourStr)
      const avgCustomers = data.totalCustomers / data.count
      const avgSales = data.totalSales / data.count
      const ratio = dailyTotalCustomers > 0 ? avgCustomers / dailyTotalCustomers : 0
      result[dayType][hour] = { avgCustomers, avgSales, ratio }
    }
  }

  return result
}

/**
 * 直近4週間の日次平均来客数を基準値として算出
 */
export function calculateBaseline(actualSales: ActualSalesRow[]): Record<string, number> {
  const dailyTotals: Record<string, Record<string, number>> = {}

  for (const row of actualSales) {
    const key = `${row.store_id}_${row.date}`
    if (!dailyTotals[row.day_type]) dailyTotals[row.day_type] = {}
    if (!dailyTotals[row.day_type][key]) dailyTotals[row.day_type][key] = 0
    dailyTotals[row.day_type][key] += row.customers
  }

  const baselines: Record<string, number> = {}
  for (const [dayType, days] of Object.entries(dailyTotals)) {
    const values = Object.values(days)
    baselines[dayType] = values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 100
  }

  return baselines
}

/**
 * 予測を生成
 * Python版の main() に相当する予測生成ロジック
 */
export function generateForecasts(
  storeId: string,
  startDate: string,
  endDate: string,
  actualSales: ActualSalesRow[]
): ForecastResult[] {
  const hourlyRatios = calculateHourlyRatios(actualSales)
  const baselines = calculateBaseline(actualSales)

  const results: ForecastResult[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
    const dateStr = d.toISOString().slice(0, 10)
    const dayType = getDayType(dateStr)
    const weather = getWeather(dateStr)
    const event = getEvent(dateStr)
    const isHoliday = !!holidays[dateStr]
    const holidayName = holidays[dateStr] || null

    // 基準値: そのday_typeの日次平均来客数
    // 祝日は週末パターンで計算
    const effectiveDayType = isHoliday ? "saturday" : dayType
    const dailyBaseline = baselines[effectiveDayType] || baselines["weekday"] || 100

    // 時間帯比率を取得
    const ratios = hourlyRatios[effectiveDayType] || hourlyRatios["weekday"] || {}

    const hourlyData: HourlyForecastData = {}
    let totalCustomers = 0
    let totalSales = 0

    for (const hour of OPERATING_HOURS) {
      const hourRatio = ratios[hour]?.ratio || (1 / OPERATING_HOURS.length)
      const avgSpendBase = ratios[hour]?.avgSales
        ? Math.round(ratios[hour].avgSales / Math.max(1, ratios[hour].avgCustomers))
        : 2500

      // 来客予測 = 基準値 × 時間帯比率 × 天候補正
      const rawCustomers = dailyBaseline * hourRatio * weather.impact

      // 決定的なばらつき (±5%)
      const variation = 1 + (((simpleHash(`${dateStr}-${hour}-${storeId}`) % 11) - 5) / 100)
      const customers = Math.max(1, Math.round(rawCustomers * variation))

      // 客単価にもばらつき
      const spendVariation = 1 + (((simpleHash(`${hour}-${dateStr}-spend`) % 11) - 5) / 100)
      const avgSpend = Math.round(avgSpendBase * spendVariation / 10) * 10
      const sales = customers * avgSpend

      hourlyData[hour] = {
        customers,
        avgSpend,
        sales,
        suggestedHall: calculateRecommendedHall(customers, hour),
        suggestedKitchen: calculateRecommendedKitchen(customers, hour),
        isPeak: isPeakHour(hour),
      }

      totalCustomers += customers
      totalSales += sales
    }

    results.push({
      store_id: storeId,
      date: dateStr,
      forecast_customers: totalCustomers,
      forecast_sales: totalSales,
      hourly_data: hourlyData,
      weather,
      event,
      is_holiday: isHoliday,
      holiday_name: holidayName,
    })
  }

  return results
}
