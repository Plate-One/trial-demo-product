"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type ActualSales = Database["public"]["Tables"]["actual_sales"]["Row"]

export function useActualSales(storeId: string, startDate?: string, endDate?: string) {
  const [sales, setSales] = useState<ActualSales[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSales = useCallback(async () => {
    if (!storeId) return
    const supabase = createClient()
    setLoading(true)

    let query = supabase
      .from("actual_sales")
      .select("*")
      .eq("store_id", storeId)
      .order("date")
      .order("hour")

    if (startDate) query = query.gte("date", startDate)
    if (endDate) query = query.lte("date", endDate)

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setSales((data as ActualSales[]) ?? [])
    }
    setLoading(false)
  }, [storeId, startDate, endDate])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  return { sales, loading, error, refetch: fetchSales }
}

export function useImportActualSales() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ inserted: number; errors?: string[] } | null>(null)

  const importCsv = async (storeId: string, csvData: string) => {
    setImporting(true)
    setResult(null)
    try {
      const res = await fetch("/api/actual-sales/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, csv_data: csvData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult({ inserted: data.inserted, errors: data.errors })
      return data
    } catch (e: any) {
      setResult({ inserted: 0, errors: [e.message] })
      throw e
    } finally {
      setImporting(false)
    }
  }

  return { importCsv, importing, result }
}
