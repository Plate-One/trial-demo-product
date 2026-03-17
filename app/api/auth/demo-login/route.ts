import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { generateForecasts } from "@/lib/forecast-engine"
import { format, subDays, addDays } from "date-fns"

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD

// 時間帯別来客パターン
const WEEKDAY_PATTERN = [0.05, 0.18, 0.12, 0.06, 0.04, 0.08, 0.15, 0.14, 0.10, 0.05, 0.02, 0.01]
const FRIDAY_PATTERN  = [0.04, 0.15, 0.10, 0.05, 0.04, 0.09, 0.17, 0.16, 0.11, 0.06, 0.02, 0.01]
const WEEKEND_PATTERN = [0.06, 0.16, 0.14, 0.08, 0.05, 0.07, 0.14, 0.13, 0.09, 0.05, 0.02, 0.01]
const AVG_SPEND: Record<number, number> = {
  11: 1800, 12: 1700, 13: 1600, 14: 1500, 15: 1400, 16: 1600,
  17: 2200, 18: 2400, 19: 2500, 20: 2300, 21: 2000, 22: 1800,
}

function getDayType(d: Date) {
  const dow = d.getDay()
  if (dow === 0) return { type: "sunday", pattern: WEEKEND_PATTERN, baseCustomers: 130 }
  if (dow === 6) return { type: "saturday", pattern: WEEKEND_PATTERN, baseCustomers: 140 }
  if (dow === 5) return { type: "friday", pattern: FRIDAY_PATTERN, baseCustomers: 120 }
  return { type: "weekday", pattern: WEEKDAY_PATTERN, baseCustomers: 100 }
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

const DEMO_STAFF = [
  { name: "田中 太郎", name_kana: "タナカ タロウ", position: "ホール", role: "店長", employment_type: "正社員" },
  { name: "佐藤 花子", name_kana: "サトウ ハナコ", position: "ホール", role: "社員", employment_type: "正社員" },
  { name: "鈴木 一郎", name_kana: "スズキ イチロウ", position: "キッチン", role: "社員", employment_type: "正社員" },
  { name: "山田 美咲", name_kana: "ヤマダ ミサキ", position: "ホール", role: "パート", employment_type: "パート" },
  { name: "高橋 健太", name_kana: "タカハシ ケンタ", position: "キッチン", role: "パート", employment_type: "パート" },
  { name: "伊藤 あかり", name_kana: "イトウ アカリ", position: "ホール", role: "アルバイト", employment_type: "アルバイト" },
  { name: "渡辺 翔", name_kana: "ワタナベ ショウ", position: "キッチン", role: "アルバイト", employment_type: "アルバイト" },
]

export async function POST() {
  try {
    if (!DEMO_EMAIL || !DEMO_PASSWORD) {
      return NextResponse.json({ error: "デモアカウントが設定されていません" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // 1. デモユーザーが既に存在するかチェック
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === DEMO_EMAIL)

    let authUserId: string

    if (existingUser) {
      authUserId = existingUser.id

      // スタッフプロフィールがあるか確認
      const { data: profile } = await supabase
        .from("staff")
        .select("id, store_id")
        .eq("auth_user_id", authUserId)
        .limit(1)

      if (profile && profile.length > 0) {
        // 既にセットアップ済み → そのままログイン可能
        return NextResponse.json({ success: true, setup: false })
      }
    } else {
      // 2. デモユーザーを作成
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
      })

      if (authErr || !authData.user) {
        return NextResponse.json({ error: `デモアカウント作成失敗: ${authErr?.message}` }, { status: 500 })
      }
      authUserId = authData.user.id
    }

    // 3. Organization作成
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .insert({ name: "デモ株式会社" } as any)
      .select("id")
      .single()

    if (orgErr || !org) {
      return NextResponse.json({ error: `組織作成失敗: ${orgErr?.message}` }, { status: 500 })
    }

    // 4. Store作成
    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .insert({
        organization_id: org.id,
        name: "デモ店舗",
        short_name: "デモ",
        slug: `demo-${Date.now().toString(36)}`,
      } as any)
      .select("id")
      .single()

    if (storeErr || !store) {
      return NextResponse.json({ error: `店舗作成失敗: ${storeErr?.message}` }, { status: 500 })
    }

    // 5. 管理者スタッフ（ログインユーザー）作成
    const { error: adminStaffErr } = await supabase
      .from("staff")
      .insert({
        auth_user_id: authUserId,
        organization_id: org.id,
        store_id: store.id,
        name: DEMO_STAFF[0].name,
        name_kana: DEMO_STAFF[0].name_kana,
        email: DEMO_EMAIL,
        position: DEMO_STAFF[0].position,
        role: DEMO_STAFF[0].role,
        employment_type: DEMO_STAFF[0].employment_type,
        status: "在籍",
      } as any)

    if (adminStaffErr) {
      return NextResponse.json({ error: `スタッフ作成失敗: ${adminStaffErr.message}` }, { status: 500 })
    }

    // 6. 追加スタッフ作成
    const staffInserts = DEMO_STAFF.slice(1).map((s, i) => ({
      organization_id: org.id,
      store_id: store.id,
      name: s.name,
      name_kana: s.name_kana,
      email: `demo-staff${i + 2}@plateone.jp`,
      position: s.position,
      role: s.role,
      employment_type: s.employment_type,
      status: "在籍",
    }))

    const { error: staffErr } = await supabase.from("staff").insert(staffInserts as any)
    if (staffErr) console.error("[demo-login] staff insert error:", staffErr.message)

    // 7. 全スタッフ取得
    const { data: allStaff } = await supabase
      .from("staff")
      .select("id, position, employment_type")
      .eq("store_id", store.id)
      .eq("status", "在籍")

    // 8. 売上実績データ生成（過去90日）
    const today = new Date()
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
        salesRows.push({ store_id: store.id, date: dateStr, hour, customers, sales, day_type: type })
      }
    }

    for (let i = 0; i < salesRows.length; i += 100) {
      const batch = salesRows.slice(i, i + 100)
      const { error: upsertErr } = await supabase.from("actual_sales").upsert(batch as any, { onConflict: "store_id,date,hour" })
      if (upsertErr) console.error("[demo-login] sales upsert error:", upsertErr.message)
    }

    // 9. 需要予測生成（今日から14日間）
    const forecastStart = format(today, "yyyy-MM-dd")
    const forecastEnd = format(addDays(today, 13), "yyyy-MM-dd")
    const forecasts = generateForecasts(store.id, forecastStart, forecastEnd, salesRows)

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
      const { error: fcErr } = await supabase.from("demand_forecasts").insert(upsertData as any)
      if (fcErr) console.error("[demo-login] forecast insert error:", fcErr.message)
    }

    // 10. シフト期間＋確定済みシフト（先週・今週・来週）
    if (allStaff && allStaff.length > 0) {
      for (let weekOffset = -1; weekOffset <= 1; weekOffset++) {
        const weekStart = addDays(today, weekOffset * 7 - ((today.getDay() + 6) % 7)) // 月曜基準
        const weekEnd = addDays(weekStart, 6)
        const pStart = format(weekStart, "yyyy-MM-dd")
        const pEnd = format(weekEnd, "yyyy-MM-dd")

        const status = weekOffset < 0 ? "confirmed" : weekOffset === 0 ? "confirmed" : "collecting"

        const { data: period, error: periodErr } = await supabase
          .from("shift_periods")
          .insert({ store_id: store.id, period_start: pStart, period_end: pEnd, status } as any)
          .select("id")
          .single()

        if (periodErr || !period) continue

        const shiftRows: any[] = []
        for (let d = 0; d < 7; d++) {
          const shiftDate = format(addDays(weekStart, d), "yyyy-MM-dd")
          for (const staff of allStaff) {
            const shouldWork =
              staff.employment_type === "正社員" ? Math.random() < 0.72 :
              staff.employment_type === "パート" ? Math.random() < 0.55 :
              Math.random() < 0.40

            if (!shouldWork) continue

            const role = staff.position === "キッチン" ? "キッチン" :
                         staff.position === "ホール" ? "ホール" :
                         Math.random() < 0.5 ? "ホール" : "キッチン"

            const isEarly = Math.random() < 0.5
            shiftRows.push({
              store_id: store.id,
              shift_period_id: period.id,
              staff_id: staff.id,
              date: shiftDate,
              start_time: isEarly ? "11:00" : "17:00",
              end_time: isEarly ? "17:00" : "22:00",
              role,
              status: weekOffset <= 0 ? "confirmed" : "optimized",
            })
          }
        }

        if (shiftRows.length > 0) {
          const { error: shiftErr } = await supabase.from("shifts").insert(shiftRows as any)
          if (shiftErr) console.error("[demo-login] shift insert error:", shiftErr.message)
        }
      }
    }

    return NextResponse.json({ success: true, setup: true })
  } catch (e: any) {
    console.error("[demo-login] error:", e)
    return NextResponse.json({ error: e?.message || "デモセットアップに失敗しました" }, { status: 500 })
  }
}
