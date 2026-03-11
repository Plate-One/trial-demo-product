"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type ShiftRequest = Database["public"]["Tables"]["shift_requests"]["Row"]

export interface ShiftRequestWithStaff extends ShiftRequest {
  staff: {
    name: string
    position: string
    role: string
    employment_type: string
  } | null
}

export function useShiftRequests(shiftPeriodId: string) {
  const [requests, setRequests] = useState<ShiftRequestWithStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    if (!shiftPeriodId) return
    const supabase = createClient()
    setLoading(true)

    const { data, error } = await supabase
      .from("shift_requests")
      .select(`
        *,
        staff:staff(name, position, role, employment_type)
      `)
      .eq("shift_period_id", shiftPeriodId)

    if (error) {
      setError(error.message)
    } else {
      setRequests((data as ShiftRequestWithStaff[]) ?? [])
    }
    setLoading(false)
  }, [shiftPeriodId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  return { requests, loading, error, refetch: fetchRequests }
}
