import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, storeName, adminName, email, password } = body

    if (!companyName || !storeName || !adminName || !email || !password) {
      return NextResponse.json({ error: "すべての項目を入力してください" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "パスワードは6文字以上で入力してください" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // 1. Organization作成
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .insert({ name: companyName } as any)
      .select("id")
      .single()

    if (orgErr || !org) {
      return NextResponse.json({ error: `会社の登録に失敗しました: ${orgErr?.message}` }, { status: 500 })
    }

    // 2. Store作成
    const slug = storeName.toLowerCase().replace(/[^a-z0-9]/g, "") || `store-${Date.now().toString(36)}`
    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .insert({
        organization_id: org.id,
        name: storeName,
        short_name: storeName,
        slug: `${slug}-${Date.now().toString(36)}`,
      } as any)
      .select("id")
      .single()

    if (storeErr || !store) {
      await supabase.from("organizations").delete().eq("id", org.id)
      return NextResponse.json({ error: `店舗の登録に失敗しました: ${storeErr?.message}` }, { status: 500 })
    }

    // 3. Authユーザー作成
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authErr || !authData.user) {
      await supabase.from("stores").delete().eq("id", store.id)
      await supabase.from("organizations").delete().eq("id", org.id)
      const msg = authErr?.message?.includes("already been registered")
        ? "このメールアドレスは既に登録されています"
        : `アカウントの作成に失敗しました: ${authErr?.message}`
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // 4. Staffレコード作成（AuthユーザーとDBをリンク）
    const { error: staffErr } = await supabase
      .from("staff")
      .insert({
        auth_user_id: authData.user.id,
        organization_id: org.id,
        store_id: store.id,
        name: adminName,
        name_kana: adminName,
        email,
        position: "両方",
        role: "店長",
        employment_type: "正社員",
        status: "在籍",
      } as any)

    if (staffErr) {
      await supabase.auth.admin.deleteUser(authData.user.id)
      await supabase.from("stores").delete().eq("id", store.id)
      await supabase.from("organizations").delete().eq("id", org.id)
      return NextResponse.json({ error: `スタッフ登録に失敗しました: ${staffErr.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
