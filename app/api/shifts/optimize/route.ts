import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, validateStoreAccess } from "@/lib/supabase/server"
import { optimizeShifts } from "@/lib/shift-optimizer"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { store_id, shift_period_id, start_date, end_date } = body

    if (!store_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: "store_id, start_date, end_date は必須です" },
        { status: 400 }
      )
    }

    // テナント検証: ユーザーがこの店舗にアクセスできるか確認
    const access = await validateStoreAccess(store_id)
    if (access.error) return access.error

    const supabase = createServiceRoleClient()

    // 1. 需要予測データ取得
    const { data: forecasts, error: forecastError } = await supabase
      .from("demand_forecasts")
      .select("date, hourly_data")
      .eq("store_id", store_id)
      .gte("date", start_date)
      .lte("date", end_date)
      .order("date")

    if (forecastError) {
      return NextResponse.json({ error: forecastError.message }, { status: 500 })
    }

    if (!forecasts || forecasts.length === 0) {
      return NextResponse.json(
        { error: "予測データがありません。先に需要予測を実行してください。" },
        { status: 404 }
      )
    }

    // 2. 店舗のスタッフ取得
    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .select("id, name, position, role, employment_type, hourly_rate, store_id")
      .eq("store_id", store_id)
      .eq("status", "在籍")

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    // 3. シフト希望取得
    let shiftRequests: any[] = []
    if (shift_period_id) {
      const { data: requests } = await supabase
        .from("shift_requests")
        .select("staff_id, submission_type, requested_days_off, available_days")
        .eq("shift_period_id", shift_period_id)

      shiftRequests = requests || []
    }

    // 4. 既存のoptimizedシフトを削除
    await supabase
      .from("shifts")
      .delete()
      .eq("store_id", store_id)
      .eq("status", "optimized")
      .gte("date", start_date)
      .lte("date", end_date)

    // 5. 最適化実行
    const generatedShifts = optimizeShifts(
      store_id,
      forecasts.map((f) => ({ date: f.date, hourly_data: f.hourly_data as any })),
      staffData as any || [],
      shiftRequests,
      shift_period_id || null
    )

    // 6. シフトをDBに保存
    if (generatedShifts.length > 0) {
      const { error: insertError } = await supabase
        .from("shifts")
        .insert(generatedShifts as any)

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      count: generatedShifts.length,
      shifts: generatedShifts,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
