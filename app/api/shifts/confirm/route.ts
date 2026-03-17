import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, validateStoreAccess } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { store_id, start_date, end_date, shift_period_id } = body

    if (!store_id) {
      return NextResponse.json({ error: "store_id は必須です" }, { status: 400 })
    }

    // テナント検証: ユーザーがこの店舗にアクセスできるか確認
    const access = await validateStoreAccess(store_id)
    if (access.error) return access.error

    const supabase = createServiceRoleClient()

    let query = supabase
      .from("shifts")
      .update({ status: "confirmed" } as any)
      .eq("store_id", store_id)
      .eq("status", "optimized")

    if (shift_period_id) {
      query = query.eq("shift_period_id", shift_period_id)
    }
    if (start_date) {
      query = query.gte("date", start_date)
    }
    if (end_date) {
      query = query.lte("date", end_date)
    }

    const { error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // shift_period も confirmed に更新
    if (shift_period_id) {
      await supabase
        .from("shift_periods")
        .update({ status: "confirmed" } as any)
        .eq("id", shift_period_id)
    }

    return NextResponse.json({ success: true, confirmed_count: count })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
