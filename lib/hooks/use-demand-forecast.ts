"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type DemandForecast = Database["public"]["Tables"]["demand_forecasts"]["Row"]

export function useDemandForecasts(storeId: string, startDate?: string, endDate?: string) {
  const [forecasts, setForecasts] = useState<DemandForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!storeId) return
    const supabase = createClient()

    const fetchForecasts = async () => {
      let query = supabase
        .from("demand_forecasts")
        .select("*")
        .eq("store_id", storeId)
        .order("date")

      if (startDate) {
        query = query.gte("date", startDate)
      }
      if (endDate) {
        query = query.lte("date", endDate)
      }

      const { data, error } = await query

      if (error) {
        setError(error.message)
      } else {
        setForecasts(data ?? [])
      }
      setLoading(false)
    }

    fetchForecasts()
  }, [storeId, startDate, endDate])

  return { forecasts, loading, error }
}
