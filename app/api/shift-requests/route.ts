import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // 認証確認
    const serverClient = createServerSupabaseClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const body = await request.json()
    const { shift_period_id, staff_id, submission_type, requested_days_off, available_days, notes } = body

    if (!shift_period_id || !staff_id || !submission_type) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // upsert: 同じperiod+staffの組み合わせは上書き
    const { data, error } = await supabase
      .from("shift_requests")
      .upsert(
        {
          shift_period_id,
          staff_id,
          submission_type,
          requested_days_off: requested_days_off ?? null,
          available_days: available_days ?? null,
          notes: notes ?? null,
          submitted_at: new Date().toISOString(),
        } as any,
        { onConflict: "shift_period_id,staff_id" }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
