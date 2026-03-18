"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface StaffProfile {
  id: string
  name: string
  role: string
  position: string
  store_id: string
  organization_id: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        // getSession はローカルCookieのみ参照（ネットワーク不要）
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (cancelled) return

        if (sessionError || !session?.user) {
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        setUser(session.user)

        const { data } = await supabase
          .from("staff")
          .select("id, name, role, position, store_id, organization_id")
          .eq("auth_user_id", session.user.id)
          .maybeSingle()
        if (cancelled) return

        setProfile(data)
      } catch (e: any) {
        console.error("[useAuth] init error:", e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return
        setUser(session?.user ?? null)
        if (session?.user) {
          try {
            const { data } = await supabase
              .from("staff")
              .select("id, name, role, position, store_id, organization_id")
              .eq("auth_user_id", session.user.id)
              .maybeSingle()
            if (!cancelled) setProfile(data)
          } catch (e: any) {
            console.error("[useAuth] profile fetch error:", e)
            if (!cancelled) setProfile(null)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }, [])

  return { user, profile, loading, signOut }
}
