"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type Staff = Database["public"]["Tables"]["staff"]["Row"]
type StaffSkill = Database["public"]["Tables"]["staff_skills"]["Row"]
type StaffCertification = Database["public"]["Tables"]["staff_certifications"]["Row"]

export interface StaffWithRelations extends Staff {
  skills: StaffSkill[]
  certifications: StaffCertification[]
  store?: { name: string; short_name: string }
}

export function useStaff(storeId?: string) {
  const [staff, setStaff] = useState<StaffWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStaff = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase
        .from("staff")
        .select(`
          *,
          skills:staff_skills(*),
          certifications:staff_certifications(*),
          store:stores(name, short_name)
        `)
        .eq("status", "在籍")
        .order("name")

      if (storeId) {
        query = query.eq("store_id", storeId)
      }

      const { data, error } = await query

      if (error) {
        console.error("[useStaff] error:", error.message)
        setError(error.message)
      } else {
        setStaff((data as StaffWithRelations[]) ?? [])
      }
    } catch (e: any) {
      console.error("[useStaff] exception:", e)
      setError(e.message ?? "スタッフデータの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  return { staff, loading, error, refetch: fetchStaff }
}

export function useStaffById(id: string) {
  const [staff, setStaff] = useState<StaffWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchStaff = async () => {
      const { data, error } = await supabase
        .from("staff")
        .select(`
          *,
          skills:staff_skills(*),
          certifications:staff_certifications(*),
          store:stores(name, short_name)
        `)
        .eq("id", id)
        .single()

      if (error) {
        setError(error.message)
      } else {
        setStaff(data as StaffWithRelations)
      }
      setLoading(false)
    }

    fetchStaff()
  }, [id])

  return { staff, loading, error }
}

export function useStaffMutations() {
  const supabase = createClient()

  const createStaff = async (
    staffData: Database["public"]["Tables"]["staff"]["Insert"],
    skills?: { name: string; level: number; experience?: string }[],
    certifications?: { name: string; obtained_date?: string; expires_date?: string }[]
  ) => {
    const { data: newStaff, error } = await supabase
      .from("staff")
      .insert(staffData)
      .select()
      .single()

    if (error) throw error

    if (skills?.length) {
      await supabase.from("staff_skills").insert(
        skills.map((s) => ({ staff_id: newStaff.id, ...s }))
      )
    }

    if (certifications?.length) {
      await supabase.from("staff_certifications").insert(
        certifications.map((c) => ({ staff_id: newStaff.id, ...c }))
      )
    }

    return newStaff
  }

  const updateStaff = async (
    id: string,
    staffData: Database["public"]["Tables"]["staff"]["Update"]
  ) => {
    const { data, error } = await supabase
      .from("staff")
      .update(staffData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const deleteStaff = async (id: string) => {
    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("id", id)

    if (error) throw error
  }

  return { createStaff, updateStaff, deleteStaff }
}
