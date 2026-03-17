"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

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
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data } = await supabase
            .from("staff")
            .select("id, name, role, position, store_id, organization_id")
            .eq("auth_user_id", user.id)
            .maybeSingle()
          setProfile(data)
        }
      } catch (e: any) {
        console.error("[useAuth] exception:", e)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          try {
            const { data } = await supabase
              .from("staff")
              .select("id, name, role, position, store_id, organization_id")
              .eq("auth_user_id", session.user.id)
              .maybeSingle()
            setProfile(data)
          } catch (e: any) {
            console.error("[useAuth] profile fetch error:", e)
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }, [router])

  return { user, profile, loading, signOut }
}
