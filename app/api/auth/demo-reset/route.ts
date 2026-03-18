import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const email = (process.env.NEXT_PUBLIC_DEMO_EMAIL || "").trim()
    if (!email) {
      return NextResponse.json({ error: "デモアカウントが設定されていません" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // authユーザーを検索
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const demoAuthUser = authUsers?.users?.find((u: any) => u.email === email)

    if (!demoAuthUser) {
      return NextResponse.json({ message: "デモデータは存在しません", deleted: false })
    }

    // auth_user_id でstaffを検索（emailカラムより確実）
    const { data: staff } = await supabase
      .from("staff")
      .select("id, organization_id, store_id")
      .eq("auth_user_id", demoAuthUser.id)
      .limit(1)

    // staffが無くてもauthユーザーは削除
    if (!staff?.length) {
      await supabase.auth.admin.deleteUser(demoAuthUser.id)
      return NextResponse.json({ message: "authユーザーを削除しました（データなし）", deleted: true, stores: 0 })
    }

    const orgId = staff[0].organization_id

    // 組織に属する全店舗を取得
    const { data: stores } = await supabase
      .from("stores")
      .select("id")
      .eq("organization_id", orgId)

    const storeIds = (stores ?? []).map((s: any) => s.id)

    if (storeIds.length > 0) {
      // 依存関係の順にデータ削除（子→親）
      await Promise.all([
        supabase.from("shifts").delete().in("store_id", storeIds),
        supabase.from("shift_periods").delete().in("store_id", storeIds),
        supabase.from("demand_forecasts").delete().in("store_id", storeIds),
        supabase.from("actual_sales").delete().in("store_id", storeIds),
        supabase.from("shift_requests").delete().in("store_id", storeIds),
        supabase.from("absence_requests").delete().in("store_id", storeIds),
      ])

      // スタッフ関連
      const { data: allStaff } = await supabase
        .from("staff")
        .select("id")
        .in("store_id", storeIds)
      const staffIds = (allStaff ?? []).map((s: any) => s.id)

      if (staffIds.length > 0) {
        await Promise.all([
          supabase.from("staff_skills").delete().in("staff_id", staffIds),
          supabase.from("staff_certifications").delete().in("staff_id", staffIds),
        ])
      }

      await supabase.from("staff").delete().in("store_id", storeIds)
      await supabase.from("stores").delete().in("id", storeIds)
    }

    await supabase.from("organizations").delete().eq("id", orgId)

    // authユーザーも削除（次回デモログインで再作成される）
    await supabase.auth.admin.deleteUser(demoAuthUser.id)

    return NextResponse.json({
      message: "デモデータをリセットしました",
      deleted: true,
      stores: storeIds.length,
    })
  } catch (e: any) {
    console.error("[demo-reset] error:", e)
    return NextResponse.json({ error: e?.message || "リセットに失敗しました" }, { status: 500 })
  }
}
