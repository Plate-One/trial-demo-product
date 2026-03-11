/**
 * シフト最適化エンジン
 * 需要予測 + スタッフ希望 → 最適シフト割り当て
 */

import { OPERATING_HOURS } from "./shift-create-data"
import type { HourlyForecastData } from "./forecast-engine"

// ========== 型定義 ==========
interface StaffInfo {
  id: string
  name: string
  position: "ホール" | "キッチン" | "両方"
  role: string
  employment_type: "正社員" | "パート" | "アルバイト"
  hourly_rate: number | null
  store_id: string
}

interface ShiftRequest {
  staff_id: string
  submission_type: "休暇希望" | "出勤希望"
  requested_days_off: number[] | null
  available_days: AvailableDay[] | null
}

interface AvailableDay {
  day: number // 日付の日部分 (1-31)
  start: string // "10:00"
  end: string   // "16:00"
}

interface ForecastDay {
  date: string
  hourly_data: HourlyForecastData
}

export interface GeneratedShift {
  store_id: string
  staff_id: string
  date: string
  start_time: string
  end_time: string
  role: "ホール" | "キッチン"
  status: "optimized"
  shift_period_id: string | null
}

// ========== ユーティリティ ==========
function hourToTimeStr(h: number): string {
  return `${String(h).padStart(2, "0")}:00`
}

function timeStrToHour(t: string): number {
  return parseInt(t.split(":")[0], 10)
}

function getDayOfMonth(dateStr: string): number {
  return new Date(dateStr).getDate()
}

// ========== メイン最適化ロジック ==========

/**
 * 貪欲法によるシフト割り当て
 *
 * 1. 正社員: 基本フルシフト（11:00-22:00）、休暇希望日を除外
 * 2. パート/アルバイト: available_daysに基づいて不足枠を埋める
 * 3. 連続する時間をstart_time/end_timeにマージ
 */
export function optimizeShifts(
  storeId: string,
  forecasts: ForecastDay[],
  staff: StaffInfo[],
  requests: ShiftRequest[],
  shiftPeriodId: string | null
): GeneratedShift[] {
  const shifts: GeneratedShift[] = []
  const requestMap = new Map(requests.map((r) => [r.staff_id, r]))

  // スタッフをポジション別に分類
  const hallStaff = staff.filter((s) => s.position === "ホール" || s.position === "両方")
  const kitchenStaff = staff.filter((s) => s.position === "キッチン" || s.position === "両方")

  // 正社員とパート/アルバイトに分類
  const fullTimeHall = hallStaff.filter((s) => s.employment_type === "正社員")
  const partTimeHall = hallStaff.filter((s) => s.employment_type !== "正社員")
  const fullTimeKitchen = kitchenStaff.filter((s) => s.employment_type === "正社員")
  const partTimeKitchen = kitchenStaff.filter((s) => s.employment_type !== "正社員")

  for (const forecast of forecasts) {
    const dateStr = forecast.date
    const dayOfMonth = getDayOfMonth(dateStr)
    const hourly = forecast.hourly_data

    // この日の時間帯別必要人数
    const neededHall: Record<number, number> = {}
    const neededKitchen: Record<number, number> = {}
    for (const hour of OPERATING_HOURS) {
      neededHall[hour] = hourly[hour]?.suggestedHall || 2
      neededKitchen[hour] = hourly[hour]?.suggestedKitchen || 2
    }

    // 各時間帯の割り当て済みカウンタ
    const assignedHall: Record<number, number> = {}
    const assignedKitchen: Record<number, number> = {}
    for (const h of OPERATING_HOURS) {
      assignedHall[h] = 0
      assignedKitchen[h] = 0
    }

    // ---- 正社員アサイン ----
    const assignFullTime = (
      staffList: StaffInfo[],
      role: "ホール" | "キッチン",
      assigned: Record<number, number>,
      needed: Record<number, number>
    ) => {
      for (const s of staffList) {
        const req = requestMap.get(s.id)
        // 休暇希望日は除外
        if (req?.submission_type === "休暇希望" && req.requested_days_off?.includes(dayOfMonth)) {
          continue
        }

        // フルシフト（11:00-22:00）でアサイン
        // ただし不足のない時間帯ばかりなら不要
        const hasNeed = OPERATING_HOURS.some((h) => assigned[h] < needed[h])
        if (!hasNeed) break

        for (const h of OPERATING_HOURS) {
          assigned[h]++
        }

        shifts.push({
          store_id: storeId,
          staff_id: s.id,
          date: dateStr,
          start_time: "11:00",
          end_time: "22:00",
          role,
          status: "optimized",
          shift_period_id: shiftPeriodId,
        })
      }
    }

    assignFullTime(fullTimeHall, "ホール", assignedHall, neededHall)
    assignFullTime(fullTimeKitchen, "キッチン", assignedKitchen, neededKitchen)

    // ---- パート/アルバイトアサイン ----
    const assignPartTime = (
      staffList: StaffInfo[],
      role: "ホール" | "キッチン",
      assigned: Record<number, number>,
      needed: Record<number, number>
    ) => {
      // コスト順（時給が低い順）にソート
      const sorted = [...staffList].sort((a, b) => (a.hourly_rate || 1200) - (b.hourly_rate || 1200))

      for (const s of sorted) {
        const req = requestMap.get(s.id)

        // 出勤希望の場合、available_daysを確認
        if (req?.submission_type === "出勤希望" && req.available_days) {
          const availDay = req.available_days.find((ad) => ad.day === dayOfMonth)
          if (!availDay) continue // この日は希望なし

          const startH = timeStrToHour(availDay.start)
          const endH = timeStrToHour(availDay.end)

          // 不足がある時間帯にだけアサイン
          const assignHours: number[] = []
          for (const h of OPERATING_HOURS) {
            if (h >= startH && h < endH && assigned[h] < needed[h]) {
              assignHours.push(h)
              assigned[h]++
            }
          }

          if (assignHours.length > 0) {
            // 連続する時間帯をマージしてシフトレコードに
            const merged = mergeHours(assignHours)
            for (const [start, end] of merged) {
              shifts.push({
                store_id: storeId,
                staff_id: s.id,
                date: dateStr,
                start_time: hourToTimeStr(start),
                end_time: hourToTimeStr(end + 1),
                role,
                status: "optimized",
                shift_period_id: shiftPeriodId,
              })
            }
          }
        } else if (!req || req.submission_type === "休暇希望") {
          // 休暇希望していないパート：不足枠に入れる
          if (req?.requested_days_off?.includes(dayOfMonth)) continue

          const assignHours: number[] = []
          for (const h of OPERATING_HOURS) {
            if (assigned[h] < needed[h]) {
              assignHours.push(h)
              assigned[h]++
            }
          }

          if (assignHours.length > 0) {
            const merged = mergeHours(assignHours)
            for (const [start, end] of merged) {
              shifts.push({
                store_id: storeId,
                staff_id: s.id,
                date: dateStr,
                start_time: hourToTimeStr(start),
                end_time: hourToTimeStr(end + 1),
                role,
                status: "optimized",
                shift_period_id: shiftPeriodId,
              })
            }
          }
        }
      }
    }

    assignPartTime(partTimeHall, "ホール", assignedHall, neededHall)
    assignPartTime(partTimeKitchen, "キッチン", assignedKitchen, neededKitchen)
  }

  return shifts
}

/**
 * 連続する時間帯をマージ
 * [11, 12, 13, 17, 18] → [[11, 13], [17, 18]]
 */
function mergeHours(hours: number[]): [number, number][] {
  if (hours.length === 0) return []
  const sorted = [...hours].sort((a, b) => a - b)
  const result: [number, number][] = []
  let start = sorted[0]
  let end = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i]
    } else {
      result.push([start, end])
      start = sorted[i]
      end = sorted[i]
    }
  }
  result.push([start, end])
  return result
}
