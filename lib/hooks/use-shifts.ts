"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type Shift = Database["public"]["Tables"]["shifts"]["Row"]
type ShiftPeriod = Database["public"]["Tables"]["shift_periods"]["Row"]

export interface ShiftWithStaff extends Shift {
  staff: { name: string; position: string; role: string; employment_type: string } | null
}

export function useShifts(storeId: string, date?: string, startDate?: string, endDate?: string) {
  const [shifts, setShifts] = useState<ShiftWithStaff[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchShifts = useCallback(async () => {
    if (!storeId) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    setLoading(true)

    let query = supabase
      .from("shifts")
      .select(`
        *,
        staff:staff(name, position, role, employment_type)
      `)
      .eq("store_id", storeId)
      .order("date")
      .order("start_time")

    if (date) query = query.eq("date", date)
    if (startDate) query = query.gte("date", startDate)
    if (endDate) query = query.lte("date", endDate)

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setShifts((data as ShiftWithStaff[]) ?? [])
    }
    setLoading(false)
  }, [storeId, date, startDate, endDate])

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  return { shifts, loading, error, refetch: fetchShifts }
}

export function useShiftPeriods(storeId: string) {
  const [periods, setPeriods] = useState<ShiftPeriod[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!storeId) return
    const supabase = createClient()

    const fetchPeriods = async () => {
      const { data } = await supabase
        .from("shift_periods")
        .select("*")
        .eq("store_id", storeId)
        .order("period_start", { ascending: false })

      setPeriods(data ?? [])
      setLoading(false)
    }

    fetchPeriods()
  }, [storeId])

  return { periods, loading }
}

export function useShiftMutations() {
  const supabase = createClient()

  const createShift = async (shift: Database["public"]["Tables"]["shifts"]["Insert"]) => {
    const { data, error } = await supabase
      .from("shifts")
      .insert(shift as never)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateShift = async (id: string, shift: Database["public"]["Tables"]["shifts"]["Update"]) => {
    const { data, error } = await supabase
      .from("shifts")
      .update(shift as never)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const deleteShift = async (id: string) => {
    const { error } = await supabase
      .from("shifts")
      .delete()
      .eq("id", id)

    if (error) throw error
  }

  const bulkCreateShifts = async (shifts: Database["public"]["Tables"]["shifts"]["Insert"][]) => {
    const { data, error } = await supabase
      .from("shifts")
      .insert(shifts as never)
      .select()

    if (error) throw error
    return data
  }

  return { createShift, updateShift, deleteShift, bulkCreateShifts }
}
