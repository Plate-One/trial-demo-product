"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, addMonths, isSameMonth, isToday as dateFnsIsToday } from "date-fns"
import { ja } from "date-fns/locale"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface MyShift {
  id: string
  date: string
  start_time: string
  end_time: string
  role: string
  status: string
}

interface CoworkerShift {
  date: string
  start_time: string
  end_time: string
  role: string
  staff: { name: string; position: string } | null
}

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  return (eh * 60 + em - sh * 60 - sm) / 60
}

const ROLE_COLORS: Record<string, string> = {
  "キッチン": "bg-purple-500",
  "ホール": "bg-teal-500",
  "バー": "bg-orange-500",
  "MGR": "bg-pink-500",
}

export default function ShiftsCalendarPage() {
  const { profile } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [shifts, setShifts] = useState<MyShift[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [coworkers, setCoworkers] = useState<CoworkerShift[]>([])
  const [coworkersLoading, setCoworkersLoading] = useState(false)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })

  const fetchShifts = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const supabase = createClient()
      const start = format(calendarStart, "yyyy-MM-dd")
      const end = format(addDays(monthEnd, 7), "yyyy-MM-dd")
      const { data } = await supabase
        .from("shifts")
        .select("id, date, start_time, end_time, role, status")
        .eq("staff_id", profile.id)
        .gte("date", start).lte("date", end)
        .order("date").order("start_time")
      setShifts((data as MyShift[]) ?? [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [profile?.id, currentMonth])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  useEffect(() => {
    if (!selectedDate || !profile?.store_id || !profile?.id) {
      setCoworkers([])
      return
    }
    const fetchCoworkers = async () => {
      setCoworkersLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from("shifts")
        .select("date, start_time, end_time, role, staff:staff(name, position)")
        .eq("store_id", profile.store_id)
        .eq("date", selectedDate)
        .neq("staff_id", profile.id)
        .order("start_time")
      setCoworkers((data as CoworkerShift[]) ?? [])
      setCoworkersLoading(false)
    }
    fetchCoworkers()
  }, [selectedDate, profile?.store_id, profile?.id])

  const shiftByDate = useMemo(() => {
    const m = new Map<string, MyShift>()
    shifts.forEach(s => { if (!m.has(s.date)) m.set(s.date, s) })
    return m
  }, [shifts])

  // Build calendar weeks
  const weeks = useMemo(() => {
    const result: Date[][] = []
    let day = calendarStart
    while (day <= monthEnd || result.length < 6) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(day)
        day = addDays(day, 1)
      }
      result.push(week)
      if (!isSameMonth(week[0], currentMonth) && week[0] > monthEnd) break
    }
    return result
  }, [currentMonth])

  const monthStats = useMemo(() => {
    const monthShifts = shifts.filter(s => {
      const d = new Date(s.date + "T00:00")
      return isSameMonth(d, currentMonth)
    })
    const workDays = monthShifts.length
    const totalHours = monthShifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
    return { workDays, totalHours }
  }, [shifts, currentMonth])

  const selectedShift = selectedDate ? shiftByDate.get(selectedDate) : null

  if (!profile) return null

  return (
    <div>
      {/* Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">シフトカレンダー</h1>
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

        {/* Month Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400">出勤日数</p>
            <p className="text-xl font-bold">{monthStats.workDays}<span className="text-xs text-gray-400">日</span></p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400">合計時間</p>
            <p className="text-xl font-bold">{monthStats.totalHours.toFixed(1)}<span className="text-xs text-gray-400">h</span></p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : (
          <>
            {/* Calendar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {["月", "火", "水", "木", "金", "土", "日"].map((d, i) => (
                  <div key={d} className={cn(
                    "text-center py-2 text-[11px] font-medium",
                    i === 5 ? "text-blue-500" : i === 6 ? "text-red-500" : "text-gray-500"
                  )}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {week.map(day => {
                    const dateStr = format(day, "yyyy-MM-dd")
                    const shift = shiftByDate.get(dateStr)
                    const isToday = dateFnsIsToday(day)
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isSelected = selectedDate === dateStr
                    const dayOfWeek = day.getDay()

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                        className={cn(
                          "relative py-2 px-1 border-b border-r border-gray-50 min-h-[52px] transition-colors",
                          isSelected && "bg-blue-50",
                          !isCurrentMonth && "opacity-30"
                        )}
                      >
                        <span className={cn(
                          "text-xs block",
                          isToday && "bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center mx-auto",
                          !isToday && dayOfWeek === 0 && "text-red-500",
                          !isToday && dayOfWeek === 6 && "text-blue-500",
                          !isToday && "text-gray-700"
                        )}>
                          {format(day, "d")}
                        </span>
                        {shift && (
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full mx-auto mt-1",
                            ROLE_COLORS[shift.role] ?? "bg-gray-400"
                          )} />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Selected date detail */}
            {selectedDate && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                <h3 className="text-sm font-bold mb-3">
                  {format(new Date(selectedDate + "T00:00"), "M月d日(E)", { locale: ja })}
                </h3>
                {selectedShift ? (
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold">
                          {selectedShift.start_time.slice(0, 5)} → {selectedShift.end_time.slice(0, 5)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {calcHours(selectedShift.start_time, selectedShift.end_time).toFixed(1)}時間
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        selectedShift.role === "キッチン" ? "bg-purple-100 text-purple-700" :
                        selectedShift.role === "ホール" ? "bg-teal-100 text-teal-700" :
                        "bg-gray-100 text-gray-700"
                      )}>{selectedShift.role}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-4">この日のシフトはありません</p>
                )}

                {/* Coworkers */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">同日のスタッフ</span>
                  </div>
                  {coworkersLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                  ) : coworkers.length === 0 ? (
                    <p className="text-xs text-gray-300">データなし</p>
                  ) : (
                    <div className="space-y-1.5">
                      {coworkers.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{c.staff?.name ?? "不明"}</span>
                          <span className="text-gray-400">
                            {c.start_time.slice(0, 5)}〜{c.end_time.slice(0, 5)} / {c.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
