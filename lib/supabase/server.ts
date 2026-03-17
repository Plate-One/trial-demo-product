import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from './types'

// RLSをバイパスするサービスロールクライアント（APIルート専用）
export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

/**
 * APIルートでテナント検証を行う。
 * 認証ユーザーの organization_id を取得し、
 * 指定された store_id がそのorganizationに属するか検証する。
 * 検証失敗時は NextResponse を返す。成功時は null を返す。
 */
export async function validateStoreAccess(
  storeId: string
): Promise<{ error: NextResponse } | { error: null; organizationId: string }> {
  const serverClient = createServerSupabaseClient()

  const { data: { user }, error: authError } = await serverClient.auth.getUser()
  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      ),
    }
  }

  const serviceClient = createServiceRoleClient()

  // ユーザーの organization_id を取得
  const { data: profile, error: profileError } = await serviceClient
    .from("staff")
    .select("organization_id")
    .eq("auth_user_id", user.id)
    .single()

  if (profileError || !profile) {
    return {
      error: NextResponse.json(
        { error: "スタッフプロフィールが見つかりません" },
        { status: 403 }
      ),
    }
  }

  // store_id がユーザーの organization に属するか検証
  const { data: store, error: storeError } = await serviceClient
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("organization_id", profile.organization_id)
    .single()

  if (storeError || !store) {
    return {
      error: NextResponse.json(
        { error: "この店舗へのアクセス権限がありません" },
        { status: 403 }
      ),
    }
  }

  return { error: null, organizationId: profile.organization_id }
}
