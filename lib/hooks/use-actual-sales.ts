"use client"

import { useEffect, useState, useCallback } from "react"
import type { Database } from "@/lib/supabase/types"

type ActualSales = Database["public"]["Tables"]["actual_sales"]["Row"]

export function useActualSales(storeId: string, startDate?: string, endDate?: string) {
  const [sales, setSales] = useState<ActualSales[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSales = useCallback(async () => {
    if (!storeId) {
      setLoading(false)
      return
    }
    setLoading(true)

    try {
      const params = new URLSearchParams({ store_id: storeId })
      if (startDate) params.set("start_date", startDate)
      if (endDate) params.set("end_date", endDate)

      const res = await fetch(`/api/actual-sales?${params}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error || "データの取得に失敗しました")
        setSales([])
      } else {
        const json = await res.json()
        setSales((json.data as ActualSales[]) ?? [])
        setError(null)
      }
    } catch (e: any) {
      setError(e?.message || "データの取得に失敗しました")
      setSales([])
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `CSV取込に失敗しました (${res.status})`)
      }
      const data = await res.json()
      setResult({ inserted: data.inserted, errors: data.errors })
      return data
    } catch (e: any) {
      setResult({ inserted: 0, errors: [e?.message || "CSV取込に失敗しました"] })
      throw e
    } finally {
      setImporting(false)
    }
  }

  return { importCsv, importing, result }
}
