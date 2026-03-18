import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { generateForecasts } from "@/lib/forecast-engine"
import { format, subDays, addDays } from "date-fns"

function getDemoCredentials() {
  const email = (process.env.NEXT_PUBLIC_DEMO_EMAIL || "").trim()
  const password = (process.env.NEXT_PUBLIC_DEMO_PASSWORD || "").trim()
  return { email, password }
}

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

// 店舗定義（3店舗: 規模・特徴が異なる）
const DEMO_STORES = [
  { name: "横浜ベイクォーター店", short_name: "ベイQ", scale: 1.0 },
  { name: "町田マルイ店", short_name: "町田", scale: 0.75 },
  { name: "新宿サザンテラス店", short_name: "新宿", scale: 1.2 },
]

// 店舗別スタッフ（店長は1店舗目のみデモユーザーに紐付け）
const DEMO_STAFF_PER_STORE: Record<number, { name: string; name_kana: string; position: string; role: string; employment_type: string }[]> = {
  0: [
    { name: "田中 太郎", name_kana: "タナカ タロウ", position: "ホール", role: "店長", employment_type: "正社員" },
    { name: "佐藤 花子", name_kana: "サトウ ハナコ", position: "ホール", role: "チーフ", employment_type: "正社員" },
    { name: "鈴木 一郎", name_kana: "スズキ イチロウ", position: "キッチン", role: "チーフ", employment_type: "正社員" },
    { name: "山田 美咲", name_kana: "ヤマダ ミサキ", position: "ホール", role: "スタッフ", employment_type: "パート" },
    { name: "高橋 健太", name_kana: "タカハシ ケンタ", position: "キッチン", role: "スタッフ", employment_type: "パート" },
    { name: "伊藤 あかり", name_kana: "イトウ アカリ", position: "ホール", role: "スタッフ", employment_type: "アルバイト" },
    { name: "渡辺 翔", name_kana: "ワタナベ ショウ", position: "キッチン", role: "スタッフ", employment_type: "アルバイト" },
  ],
  1: [
    { name: "中村 健", name_kana: "ナカムラ ケン", position: "ホール", role: "店長", employment_type: "正社員" },
    { name: "小林 真理", name_kana: "コバヤシ マリ", position: "キッチン", role: "チーフ", employment_type: "正社員" },
    { name: "加藤 大輔", name_kana: "カトウ ダイスケ", position: "ホール", role: "スタッフ", employment_type: "パート" },
    { name: "吉田 さくら", name_kana: "ヨシダ サクラ", position: "ホール", role: "スタッフ", employment_type: "アルバイト" },
    { name: "松本 裕太", name_kana: "マツモト ユウタ", position: "キッチン", role: "スタッフ", employment_type: "アルバイト" },
  ],
  2: [
    { name: "井上 誠", name_kana: "イノウエ マコト", position: "ホール", role: "店長", employment_type: "正社員" },
    { name: "木村 奈々", name_kana: "キムラ ナナ", position: "ホール", role: "マネージャー", employment_type: "正社員" },
    { name: "林 拓也", name_kana: "ハヤシ タクヤ", position: "キッチン", role: "チーフ", employment_type: "正社員" },
    { name: "清水 優", name_kana: "シミズ ユウ", position: "ホール", role: "チーフ", employment_type: "正社員" },
    { name: "森 彩花", name_kana: "モリ アヤカ", position: "キッチン", role: "スタッフ", employment_type: "パート" },
    { name: "池田 翼", name_kana: "イケダ ツバサ", position: "ホール", role: "スタッフ", employment_type: "パート" },
    { name: "橋本 美月", name_kana: "ハシモト ミヅキ", position: "ホール", role: "スタッフ", employment_type: "アルバイト" },
    { name: "山口 蓮", name_kana: "ヤマグチ レン", position: "キッチン", role: "スタッフ", employment_type: "アルバイト" },
    { name: "石井 陽菜", name_kana: "イシイ ヒナ", position: "ホール", role: "スタッフ", employment_type: "アルバイト" },
  ],
}

export async function POST() {
  try {
    const { email: DEMO_EMAIL, password: DEMO_PASSWORD } = getDemoCredentials()
    if (!DEMO_EMAIL || !DEMO_PASSWORD) {
      return NextResponse.json({ error: "デモアカウントが設定されていません" }, { status: 400 })
    }

    // authクライアント（signInでセッションが切り替わるため、DB操作用とは分離）
    const authClient = createServiceRoleClient()
    // DB操作用（RLSバイパスを維持）
    const supabase = createServiceRoleClient()

    // ── Fast path: ログイン試行 → 成功ならプロフィール確認して即返却 ──
    const { data: signIn } = await authClient.auth.signInWithPassword({
      email: DEMO_EMAIL, password: DEMO_PASSWORD,
    })

    if (signIn?.session) {
      // ユーザー存在 + パスワード正しい → プロフィールあれば即返却
      const { data: profile } = await supabase
        .from("staff").select("id").eq("auth_user_id", signIn.user.id).limit(1)

      if (profile && profile.length > 0) {
        return NextResponse.json({
          success: true, setup: false,
          session: {
            access_token: signIn.session.access_token,
            refresh_token: signIn.session.refresh_token,
          },
        })
      }
      // プロフィール未作成 → 下のセットアップへ（authUserIdは取得済み）
    }

    // ── Slow path: 初回 or プロフィール未作成 ──
    let authUserId: string

    if (signIn?.user) {
      authUserId = signIn.user.id
    } else {
      // ユーザーが存在しない → 作成
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true,
      })
      if (createErr || !created.user) {
        return NextResponse.json({ error: `デモアカウント作成失敗: ${createErr?.message}` }, { status: 500 })
      }
      authUserId = created.user.id
    }

    // Organization
    const { data: org, error: orgErr } = await supabase
      .from("organizations").insert({ name: "デモ株式会社" } as any).select("id").single()
    if (orgErr || !org) return NextResponse.json({ error: `組織作成失敗: ${orgErr?.message}` }, { status: 500 })

    // 3店舗を一括作成
    const ts = Date.now().toString(36)
    const { data: createdStores, error: storeErr } = await supabase
      .from("stores").insert(DEMO_STORES.map((s, i) => ({
        organization_id: org.id, name: s.name, short_name: s.short_name,
        slug: `demo-${ts}-${i}`,
      })) as any).select("id")
    if (storeErr || !createdStores?.length) return NextResponse.json({ error: `店舗作成失敗: ${storeErr?.message}` }, { status: 500 })

    const today = new Date()
    let staffEmailCounter = 0

    // 店舗ごとに並列でスタッフ＋データ生成
    await Promise.all(createdStores.map(async (store: any, storeIdx: number) => {
      const storeScale = DEMO_STORES[storeIdx].scale
      const staffDefs = DEMO_STAFF_PER_STORE[storeIdx] ?? []

      // スタッフ作成（1店舗目の店長のみデモユーザーに紐付け）
      const staffInsertData = staffDefs.map((s, i) => {
        const isMainUser = storeIdx === 0 && i === 0
        staffEmailCounter++
        return {
          ...(isMainUser ? { auth_user_id: authUserId } : {}),
          organization_id: org.id, store_id: store.id,
          name: s.name, name_kana: s.name_kana,
          email: isMainUser ? DEMO_EMAIL : `demo-staff${staffEmailCounter}@plateone.jp`,
          position: s.position, role: s.role,
          employment_type: s.employment_type, status: "在籍",
        }
      })
      const { data: storeStaff, error: staffErr } = await supabase
        .from("staff").insert(staffInsertData as any).select("id, position, employment_type")
      if (staffErr) console.error(`[demo-login] staff insert error (store ${storeIdx}):`, staffErr.message)

      const allStaff = storeStaff ?? []

      // 売上 30日分（店舗スケール適用）
      const salesRows: any[] = []
      for (let d = 30; d >= 1; d--) {
        const date = subDays(today, d)
        const dateStr = format(date, "yyyy-MM-dd")
        const { type, pattern, baseCustomers } = getDayType(date)
        const dailyScale = rand(0.85, 1.15)
        for (let hi = 0; hi < 12; hi++) {
          const hour = 11 + hi
          const customers = Math.max(1, Math.round(baseCustomers * storeScale * pattern[hi] * dailyScale * rand(0.85, 1.15)))
          const sales = Math.round(customers * AVG_SPEND[hour] * rand(0.9, 1.1))
          salesRows.push({ store_id: store.id, date: dateStr, hour, customers, sales, day_type: type })
        }
      }

      // 需要予測
      const forecasts = generateForecasts(store.id, format(today, "yyyy-MM-dd"), format(addDays(today, 13), "yyyy-MM-dd"), salesRows)
      const forecastRows = forecasts.map((f) => ({
        store_id: f.store_id, date: f.date,
        forecast_customers: f.forecast_customers, forecast_sales: f.forecast_sales,
        hourly_data: f.hourly_data as any, weather: f.weather as any,
        event: f.event, is_holiday: f.is_holiday, holiday_name: f.holiday_name,
      }))

      // シフト期間定義
      const shiftPeriodDefs = [-1, 0, 1].map(weekOffset => {
        const weekStart = addDays(today, weekOffset * 7 - ((today.getDay() + 6) % 7))
        return { weekOffset, weekStart, pStart: format(weekStart, "yyyy-MM-dd"), pEnd: format(addDays(weekStart, 6), "yyyy-MM-dd"),
          status: weekOffset <= 0 ? "confirmed" : "collecting" }
      })

      // 売上・予測・シフトを並列insert
      await Promise.all([
        supabase.from("actual_sales").upsert(salesRows as any, { onConflict: "store_id,date,hour" }),
        forecastRows.length > 0 ? supabase.from("demand_forecasts").insert(forecastRows as any) : Promise.resolve(),
        ...shiftPeriodDefs.map(async ({ weekOffset, weekStart, pStart, pEnd, status }) => {
          const { data: period } = await supabase
            .from("shift_periods").insert({ store_id: store.id, period_start: pStart, period_end: pEnd, status } as any)
            .select("id").single()
          if (!period) return
          const rows: any[] = []
          for (let d = 0; d < 7; d++) {
            const shiftDate = format(addDays(weekStart, d), "yyyy-MM-dd")
            for (const staff of allStaff) {
              const prob = staff.employment_type === "正社員" ? 0.72 : staff.employment_type === "パート" ? 0.55 : 0.40
              if (Math.random() >= prob) continue
              const role = staff.position === "キッチン" ? "キッチン" : "ホール"
              const isEarly = Math.random() < 0.5
              rows.push({
                store_id: store.id, shift_period_id: period.id, staff_id: staff.id,
                date: shiftDate, start_time: isEarly ? "11:00" : "17:00",
                end_time: isEarly ? "17:00" : "22:00", role,
                status: weekOffset <= 0 ? "confirmed" : "optimized",
              })
            }
          }
          if (rows.length > 0) await supabase.from("shifts").insert(rows as any)
        }),
      ])
    }))

    // ログインしてセッション返却
    let session = signIn?.session
    if (!session) {
      const loginClient = createServiceRoleClient()
      const { data: newSignIn, error: signInErr } = await loginClient.auth.signInWithPassword({
        email: DEMO_EMAIL, password: DEMO_PASSWORD,
      })
      if (signInErr || !newSignIn.session) {
        return NextResponse.json({ error: `デモログイン失敗: ${signInErr?.message}` }, { status: 500 })
      }
      session = newSignIn.session
    }

    return NextResponse.json({
      success: true, setup: true,
      session: { access_token: session.access_token, refresh_token: session.refresh_token },
    })
  } catch (e: any) {
    console.error("[demo-login] error:", e)
    return NextResponse.json({ error: e?.message || "デモセットアップに失敗しました" }, { status: 500 })
  }
}
