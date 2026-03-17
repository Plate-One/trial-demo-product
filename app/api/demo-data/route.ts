import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, validateStoreAccess } from "@/lib/supabase/server"
import { generateForecasts } from "@/lib/forecast-engine"
import { format, subDays, addDays } from "date-fns"

// 時間帯別来客パターン（11時〜22時）
const WEEKDAY_PATTERN = [0.05, 0.18, 0.12, 0.06, 0.04, 0.08, 0.15, 0.14, 0.10, 0.05, 0.02, 0.01]
const FRIDAY_PATTERN  = [0.04, 0.15, 0.10, 0.05, 0.04, 0.09, 0.17, 0.16, 0.11, 0.06, 0.02, 0.01]
const WEEKEND_PATTERN = [0.06, 0.16, 0.14, 0.08, 0.05, 0.07, 0.14, 0.13, 0.09, 0.05, 0.02, 0.01]

const AVG_SPEND: Record<number, number> = {
  11: 1800, 12: 1700, 13: 1600, 14: 1500, 15: 1400, 16: 1600,
  17: 2200, 18: 2400, 19: 2500, 20: 2300, 21: 2000, 22: 1800,
}

function getDayType(d: Date): { type: string; pattern: number[]; baseCustomers: number } {
  const dow = d.getDay()
  if (dow === 0) return { type: "sunday", pattern: WEEKEND_PATTERN, baseCustomers: 130 }
  if (dow === 6) return { type: "saturday", pattern: WEEKEND_PATTERN, baseCustomers: 140 }
  if (dow === 5) return { type: "friday", pattern: FRIDAY_PATTERN, baseCustomers: 120 }
  return { type: "weekday", pattern: WEEKDAY_PATTERN, baseCustomers: 100 }
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export async function POST(request: NextRequest) {
  try {
    // 本番環境ではデモデータ生成を無効化
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "デモデータ生成は本番環境では無効です" }, { status: 403 })
    }

    const body = await request.json()
    const { store_id } = body

    if (!store_id) {
      return NextResponse.json({ error: "store_id は必須です" }, { status: 400 })
    }

    const access = await validateStoreAccess(store_id)
    if (access.error) return access.error

    const supabase = createServiceRoleClient()
    const today = new Date()

    // ===== 1. 過去90日分の売上実績データ生成 =====
    const salesRows: any[] = []
    for (let d = 90; d >= 1; d--) {
      const date = subDays(today, d)
      const dateStr = format(date, "yyyy-MM-dd")
      const { type, pattern, baseCustomers } = getDayType(date)
      const dailyScale = rand(0.85, 1.15)

      for (let hi = 0; hi < 12; hi++) {
        const hour = 11 + hi
        const customers = Math.max(1, Math.round(baseCustomers * pattern[hi] * dailyScale * rand(0.85, 1.15)))
        const sales = Math.round(customers * AVG_SPEND[hour] * rand(0.9, 1.1))
        salesRows.push({ store_id, date: dateStr, hour, customers, sales, day_type: type })
      }
    }

    // バルクupsert (100行ずつ)
    for (let i = 0; i < salesRows.length; i += 100) {
      const batch = salesRows.slice(i, i + 100)
      const { error: upsertErr } = await supabase.from("actual_sales").upsert(batch as any, { onConflict: "store_id,date,hour" })
      if (upsertErr) {
        console.error("[demo-data] sales upsert error:", upsertErr.message)
        return NextResponse.json({ error: `売上データの保存に失敗しました: ${upsertErr.message}` }, { status: 500 })
      }
    }

    // ===== 2. 需要予測生成（今日から14日間） =====
    const forecastStart = format(today, "yyyy-MM-dd")
    const forecastEnd = format(addDays(today, 13), "yyyy-MM-dd")

    const forecasts = generateForecasts(store_id, forecastStart, forecastEnd, salesRows)

    // 既存予測を削除して再挿入
    const { error: deleteErr } = await supabase
      .from("demand_forecasts")
      .delete()
      .eq("store_id", store_id)
      .gte("date", forecastStart)
      .lte("date", forecastEnd)

    if (deleteErr) {
      console.error("[demo-data] forecast delete error:", deleteErr.message)
    }

    const upsertData = forecasts.map((f) => ({
      store_id: f.store_id,
      date: f.date,
      forecast_customers: f.forecast_customers,
      forecast_sales: f.forecast_sales,
      hourly_data: f.hourly_data as any,
      weather: f.weather as any,
      event: f.event,
      is_holiday: f.is_holiday,
      holiday_name: f.holiday_name,
    }))

    if (upsertData.length > 0) {
      const { error: fcInsertErr } = await supabase.from("demand_forecasts").insert(upsertData as any)
      if (fcInsertErr) {
        console.error("[demo-data] forecast insert error:", fcInsertErr.message)
      }
    }

    // ===== 3. シフト期間＋確定済みシフト生成（先週分） =====
    const lastWeekStart = subDays(today, today.getDay() + 6) // 前週の月曜
    const lastWeekEnd = addDays(lastWeekStart, 6)
    const periodStartStr = format(lastWeekStart, "yyyy-MM-dd")
    const periodEndStr = format(lastWeekEnd, "yyyy-MM-dd")

    // 既存のshift_period があれば取得、なければ作成
    const { data: existingPeriod } = await supabase
      .from("shift_periods")
      .select("id")
      .eq("store_id", store_id)
      .eq("period_start", periodStartStr)
      .single()

    let shiftPeriodId: string
    if (existingPeriod) {
      shiftPeriodId = existingPeriod.id
      // 既存シフトを削除
      await supabase.from("shifts").delete().eq("shift_period_id", shiftPeriodId)
    } else {
      const { data: newPeriod } = await supabase
        .from("shift_periods")
        .insert({ store_id, period_start: periodStartStr, period_end: periodEndStr, status: "confirmed" } as any)
        .select("id")
        .single()
      shiftPeriodId = newPeriod?.id ?? ""
    }

    // スタッフ取得
    const { data: staffList } = await supabase
      .from("staff")
      .select("id, position, employment_type")
      .eq("store_id", store_id)
      .eq("status", "在籍")

    if (staffList && staffList.length > 0 && shiftPeriodId) {
      const shiftRows: any[] = []
      for (let d = 0; d < 7; d++) {
        const shiftDate = format(addDays(lastWeekStart, d), "yyyy-MM-dd")
        for (const staff of staffList) {
          // 正社員は週5、パートは週3-4、バイトは週2-3
          const shouldWork =
            staff.employment_type === "正社員" ? Math.random() < 0.72 :
            staff.employment_type === "パート" ? Math.random() < 0.55 :
            Math.random() < 0.40

          if (!shouldWork) continue

          const role = staff.position === "キッチン" ? "キッチン" :
                       staff.position === "ホール" ? "ホール" :
                       Math.random() < 0.5 ? "ホール" : "キッチン"

          const isEarly = Math.random() < 0.5
          const startTime = isEarly ? "11:00" : "17:00"
          const endTime = isEarly ? "17:00" : "22:00"

          shiftRows.push({
            store_id,
            shift_period_id: shiftPeriodId,
            staff_id: staff.id,
            date: shiftDate,
            start_time: startTime,
            end_time: endTime,
            role,
            status: "confirmed",
          })
        }
      }

      if (shiftRows.length > 0) {
        await supabase.from("shifts").insert(shiftRows as any)
      }
    }

    return NextResponse.json({
      success: true,
      generated: {
        actual_sales: salesRows.length,
        forecasts: forecasts.length,
        shift_period: shiftPeriodId ? 1 : 0,
      },
    })
  } catch (e: any) {
    console.error("[demo-data] error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
