"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type Store = Database["public"]["Tables"]["stores"]["Row"]

export function useStores() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchStores = async () => {
      try {
        const { data, error } = await supabase
          .from("stores")
          .select("*")
          .order("slug")

        if (error) {
          console.error("[useStores] error:", error.message)
          setError(error.message)
        } else {
          setStores(data ?? [])
        }
      } catch (e: any) {
        console.error("[useStores] exception:", e)
        setError(e.message ?? "店舗データの取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [])

  return { stores, loading, error }
}
