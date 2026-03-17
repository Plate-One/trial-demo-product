import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const serverClient = createServerSupabaseClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const body = await request.json()
    const { staff_id, store_id, date, reason } = body

    if (!staff_id || !store_id || !date) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // 該当日のシフトを取得
    const { data: shifts } = await supabase
      .from("shifts")
      .select("id, start_time, end_time, role, status")
      .eq("staff_id", staff_id)
      .eq("date", date)

    if (!shifts || shifts.length === 0) {
      return NextResponse.json({ error: "該当日のシフトが見つかりません" }, { status: 404 })
    }

    // シフトのステータスをdraftに戻して欠勤処理
    const updateErrors: string[] = []
    for (const shift of shifts) {
      const { error: updateErr } = await supabase
        .from("shifts")
        .update({ status: "draft" as any })
        .eq("id", shift.id)
      if (updateErr) {
        updateErrors.push(`shift ${shift.id}: ${updateErr.message}`)
      }
    }

    if (updateErrors.length === shifts.length) {
      return NextResponse.json({ error: "欠勤処理に失敗しました" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${date}のシフト（${shifts.length}件）を欠勤処理しました`,
      affected_shifts: shifts.map(s => s.id),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
