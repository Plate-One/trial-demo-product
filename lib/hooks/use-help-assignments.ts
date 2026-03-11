"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type HelpAssignment = Database["public"]["Tables"]["help_assignments"]["Row"]

export interface HelpAssignmentWithDetails extends HelpAssignment {
  helper_staff: { name: string } | null
  from_store: { name: string; short_name: string } | null
  to_store: { name: string; short_name: string } | null
}

export function useHelpAssignments(storeId?: string, date?: string) {
  const [assignments, setAssignments] = useState<HelpAssignmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchAssignments = async () => {
      let query = supabase
        .from("help_assignments")
        .select(`
          *,
          helper_staff:staff!helper_staff_id(name),
          from_store:stores!from_store_id(name, short_name),
          to_store:stores!to_store_id(name, short_name)
        `)
        .order("date")

      if (storeId) {
        query = query.or(`from_store_id.eq.${storeId},to_store_id.eq.${storeId}`)
      }

      if (date) {
        query = query.eq("date", date)
      }

      const { data, error } = await query

      if (error) {
        setError(error.message)
      } else {
        setAssignments((data as HelpAssignmentWithDetails[]) ?? [])
      }
      setLoading(false)
    }

    fetchAssignments()
  }, [storeId, date])

  return { assignments, loading, error }
}
