"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type DemandForecast = Database["public"]["Tables"]["demand_forecasts"]["Row"]

export function useDemandForecasts(storeId: string, startDate?: string, endDate?: string) {
  const [forecasts, setForecasts] = useState<DemandForecast[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchForecasts = useCallback(async () => {
    if (!storeId) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    setLoading(true)

    let query = supabase
      .from("demand_forecasts")
      .select("*")
      .eq("store_id", storeId)
      .order("date")

    if (startDate) query = query.gte("date", startDate)
    if (endDate) query = query.lte("date", endDate)

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setForecasts(data ?? [])
    }
    setLoading(false)
  }, [storeId, startDate, endDate])

  useEffect(() => {
    fetchForecasts()
  }, [fetchForecasts])

  return { forecasts, loading, error, refetch: fetchForecasts }
}

/**
 * 予測生成APIを呼び出すフック
 */
export function useForecastGeneration() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateForecast = async (storeId: string, startDate: string, endDate: string) => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/forecast/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, start_date: startDate, end_date: endDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data
    } catch (e: any) {
      setError(e.message)
      throw e
    } finally {
      setGenerating(false)
    }
  }

  return { generateForecast, generating, error }
}

/**
 * シフト最適化APIを呼び出すフック
 */
export function useShiftOptimization() {
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const optimizeShifts = async (
    storeId: string,
    startDate: string,
    endDate: string,
    shiftPeriodId?: string
  ) => {
    setOptimizing(true)
    setError(null)
    try {
      const res = await fetch("/api/shifts/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          start_date: startDate,
          end_date: endDate,
          shift_period_id: shiftPeriodId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data
    } catch (e: any) {
      setError(e.message)
      throw e
    } finally {
      setOptimizing(false)
    }
  }

  const confirmShifts = async (
    storeId: string,
    startDate: string,
    endDate: string,
    shiftPeriodId?: string
  ) => {
    try {
      const res = await fetch("/api/shifts/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          start_date: startDate,
          end_date: endDate,
          shift_period_id: shiftPeriodId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  return { optimizeShifts, confirmShifts, optimizing, error }
}
