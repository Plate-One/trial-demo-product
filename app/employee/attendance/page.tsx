"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns"
import { ja } from "date-fns/locale"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ChevronLeft, ChevronRight, Clock, CalendarDays, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface AttendanceShift {
  id: string
  date: string
  start_time: string
  end_time: string
  role: string
  status: string
}

interface StoreInfo {
  hourly_wage_hall: number
  hourly_wage_kitchen: number
}

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  return (eh * 60 + em - sh * 60 - sm) / 60
}

export default function AttendancePage() {
  const { profile } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [shifts, setShifts] = useState<AttendanceShift[]>([])
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<StoreInfo | null>(null)

  useEffect(() => {
    if (!profile?.store_id) return
    const fetchStore = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("stores")
        .select("hourly_wage_hall, hourly_wage_kitchen")
        .eq("id", profile.store_id)
        .maybeSingle()
      if (data) setStore(data)
    }
    fetchStore()
  }, [profile?.store_id])

  const fetchShifts = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const supabase = createClient()
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      const { data } = await supabase
        .from("shifts")
        .select("id, date, start_time, end_time, role, status")
        .eq("staff_id", profile.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"))
        .order("date", { ascending: true })
        .order("start_time")
      setShifts((data as AttendanceShift[]) ?? [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [profile?.id, currentMonth])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  const hourlyRate = profile?.position === "ホール"
    ? (store?.hourly_wage_hall ?? 1150)
    : (store?.hourly_wage_kitchen ?? 1200)

  const stats = useMemo(() => {
    const totalHours = shifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
    const confirmedShifts = shifts.filter(s => s.status === "confirmed")
    const confirmedHours = confirmedShifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
    return {
      workDays: shifts.length,
      totalHours,
      confirmedHours,
      estimatedPay: Math.round(totalHours * hourlyRate),
    }
  }, [shifts, hourlyRate])

  // Group shifts by week
  const groupedByWeek = useMemo(() => {
    const groups: { label: string; shifts: AttendanceShift[]; totalHours: number }[] = []
    let currentWeek: AttendanceShift[] = []
    let weekNum = 1

    shifts.forEach((s, i) => {
      currentWeek.push(s)
      const nextDate = shifts[i + 1]?.date
      const currentDate = new Date(s.date + "T00:00")
      const nextD = nextDate ? new Date(nextDate + "T00:00") : null

      if (!nextD || nextD.getDay() === 1 || (nextD.getTime() - currentDate.getTime()) > 7 * 86400000) {
        const totalH = currentWeek.reduce((sum, x) => sum + calcHours(x.start_time, x.end_time), 0)
        groups.push({ label: `第${weekNum}週`, shifts: [...currentWeek], totalHours: totalH })
        currentWeek = []
        weekNum++
      }
    })
    if (currentWeek.length > 0) {
      const totalH = currentWeek.reduce((sum, x) => sum + calcHours(x.start_time, x.end_time), 0)
      groups.push({ label: `第${weekNum}週`, shifts: [...currentWeek], totalHours: totalH })
    }

    return groups
  }, [shifts])

  if (!profile) return null

  return (
    <div>
      <header className="bg-white px-5 py-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">勤怠履歴</h1>
      </header>

      <div className="px-5 py-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-2 -ml-2 rounded-lg active:scale-[0.97] transition-transform">
            <ChevronLeft className="h-5 w-5 text-gray-400" />
          </button>
          <span className="text-base font-bold">{format(currentMonth, "yyyy年M月", { locale: ja })}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 -mr-2 rounded-lg active:scale-[0.97] transition-transform">
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <span className="text-[10px] text-gray-400">出勤日数</span>
            </div>
            <p className="text-2xl font-bold">{stats.workDays}<span className="text-xs text-gray-400 ml-1">日</span></p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-[10px] text-gray-400">合計勤務</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}<span className="text-xs text-gray-400 ml-1">h</span></p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">見込み給与</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">¥{stats.estimatedPay.toLocaleString()}</p>
          <p className="text-[10px] text-blue-500 mt-1">時給 ¥{hourlyRate.toLocaleString()} × {stats.totalHours.toFixed(1)}h</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : shifts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <CalendarDays className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">この月の勤務データはありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedByWeek.map((group, gi) => (
              <div key={gi}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-500">{group.label}</h3>
                  <span className="text-xs text-gray-400">{group.totalHours.toFixed(1)}h</span>
                </div>
                <div className="space-y-2">
                  {group.shifts.map(s => {
                    const d = new Date(s.date + "T00:00")
                    const hours = calcHours(s.start_time, s.end_time)
                    const isConfirmed = s.status === "confirmed"
                    return (
                      <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                            <span className="text-[10px] text-gray-400 leading-none">{format(d, "E", { locale: ja })}</span>
                            <span className="text-sm font-bold text-gray-700 leading-none">{format(d, "d")}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{s.start_time.slice(0, 5)} → {s.end_time.slice(0, 5)}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">{hours.toFixed(1)}h</span>
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                isConfirmed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                              )}>
                                {isConfirmed ? "確定" : s.status === "optimized" ? "最適化済" : "下書き"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-medium",
                            s.role === "キッチン" ? "bg-purple-100 text-purple-700" :
                            s.role === "ホール" ? "bg-teal-100 text-teal-700" :
                            "bg-gray-100 text-gray-700"
                          )}>{s.role}</span>
                          <p className="text-xs text-gray-400 mt-1">¥{Math.round(hours * hourlyRate).toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
