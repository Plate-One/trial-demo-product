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
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("slug")

      if (error) {
        setError(error.message)
      } else {
        setStores(data ?? [])
      }
      setLoading(false)
    }

    fetchStores()
  }, [])

  return { stores, loading, error }
}
