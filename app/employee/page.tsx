"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format, addDays, startOfWeek, isToday as dateFnsIsToday } from "date-fns"
import { ja } from "date-fns/locale"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import {
  Loader2, Clock, CalendarDays, TrendingUp,
  ChevronLeft, ChevronRight, MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface MyShift {
  id: string
  date: string
  start_time: string
  end_time: string
  role: string
  status: string
}

interface StoreInfo {
  name: string
  hourly_wage_hall: number
  hourly_wage_kitchen: number
}

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  return (eh * 60 + em - sh * 60 - sm) / 60
}

const ROLE_COLORS: Record<string, string> = {
  "キッチン": "bg-purple-100 text-purple-700",
  "ホール": "bg-teal-100 text-teal-700",
  "バー": "bg-orange-100 text-orange-700",
  "MGR": "bg-pink-100 text-pink-700",
}

export default function EmployeeDashboard() {
  const { profile } = useAuth()
  const [shifts, setShifts] = useState<MyShift[]>([])
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [now, setNow] = useState(new Date())
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!profile?.store_id) return
    const fetchStore = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("stores")
        .select("name, hourly_wage_hall, hourly_wage_kitchen")
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
      const start = format(weekStart, "yyyy-MM-dd")
      const end = format(addDays(weekStart, 6), "yyyy-MM-dd")
      const { data } = await supabase
        .from("shifts")
        .select("id, date, start_time, end_time, role, status")
        .eq("staff_id", profile.id)
        .gte("date", start).lte("date", end)
        .order("date").order("start_time")
      setShifts((data as MyShift[]) ?? [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [profile?.id, weekStart])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  const hourlyRate = profile?.position === "ホール"
    ? (store?.hourly_wage_hall ?? 1150)
    : (store?.hourly_wage_kitchen ?? 1200)

  const todayStr = format(new Date(), "yyyy-MM-dd")
  const todayShift = shifts.find(s => s.date === todayStr)
  const nextShift = useMemo(() => {
    if (todayShift) return null
    return shifts.find(s => s.date > todayStr) ?? null
  }, [shifts, todayStr, todayShift])

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const shiftByDate = useMemo(() => {
    const m = new Map<string, MyShift>()
    shifts.forEach(s => { if (!m.has(s.date)) m.set(s.date, s) })
    return m
  }, [shifts])

  const weekStats = useMemo(() => {
    const workDays = shifts.length
    const totalHours = shifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
    return { workDays, totalHours, estimated: Math.round(totalHours * hourlyRate) }
  }, [shifts, hourlyRate])

  const timeStr = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })

  if (!profile) return null

  return (
    <div>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-4 pb-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-blue-200 text-xs">{format(now, "M月d日(E)", { locale: ja })}</p>
            <p className="text-2xl font-bold">{timeStr}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{profile.name}</p>
            <div className="flex items-center gap-1 text-blue-200 text-xs">
              <MapPin className="h-3 w-3" />
              <span>{store?.name ?? "読み込み中..."}</span>
            </div>
          </div>
        </div>

        {/* Today's shift card */}
        {todayShift ? (
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-200" />
              <span className="text-sm font-medium text-blue-100">本日のシフト</span>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium",
                ROLE_COLORS[todayShift.role] ?? "bg-gray-100 text-gray-700"
              )}>{todayShift.role}</span>
            </div>
            <div className="text-3xl font-bold">
              {todayShift.start_time.slice(0, 5)} → {todayShift.end_time.slice(0, 5)}
            </div>
            <p className="text-blue-200 text-xs mt-1">
              勤務時間: {calcHours(todayShift.start_time, todayShift.end_time).toFixed(1)}時間
            </p>
          </div>
        ) : nextShift ? (
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <p className="text-sm text-blue-200 mb-1">本日はお休みです</p>
            <p className="text-sm">
              次のシフト: <span className="font-bold">
                {format(new Date(nextShift.date + "T00:00"), "M/d(E)", { locale: ja })}
              </span>{" "}
              {nextShift.start_time.slice(0, 5)}〜{nextShift.end_time.slice(0, 5)}
            </p>
          </div>
        ) : (
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <p className="text-sm text-blue-200">今週のシフトはまだ登録されていません</p>
          </div>
        )}
      </header>

      {/* Quick Actions */}
      <div className="px-5 -mt-3">
        <div className="grid grid-cols-3 gap-3">
          <Link href="/employee/shifts"
            className="bg-white rounded-xl p-3 shadow-sm text-center active:scale-[0.97] transition-transform">
            <CalendarDays className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <span className="text-xs font-medium text-gray-700">シフト確認</span>
          </Link>
          <Link href="/employee/requests"
            className="bg-white rounded-xl p-3 shadow-sm text-center active:scale-[0.97] transition-transform">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <span className="text-xs font-medium text-gray-700">希望提出</span>
          </Link>
          <Link href="/employee/attendance"
            className="bg-white rounded-xl p-3 shadow-sm text-center active:scale-[0.97] transition-transform">
            <Clock className="h-5 w-5 mx-auto mb-1 text-orange-600" />
            <span className="text-xs font-medium text-gray-700">勤怠履歴</span>
          </Link>
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 -ml-2 rounded-lg active:scale-[0.97] transition-transform">
            <ChevronLeft className="h-5 w-5 text-gray-400" />
          </button>
          <span className="text-sm font-bold text-gray-900">
            {format(weekStart, "M/d")}〜{format(addDays(weekStart, 6), "M/d")}
          </span>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 -mr-2 rounded-lg active:scale-[0.97] transition-transform">
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        ) : (
          <>
            {/* Week calendar strip */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {weekDays.map(d => {
                const dateStr = format(d, "yyyy-MM-dd")
                const shift = shiftByDate.get(dateStr)
                const isToday = dateFnsIsToday(d)
                const dayOfWeek = d.getDay()
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                return (
                  <div key={dateStr} className={cn(
                    "rounded-lg text-center py-2",
                    isToday ? "bg-blue-600 text-white" : "bg-white",
                    !isToday && isWeekend && "text-red-500"
                  )}>
                    <div className={cn("text-[10px]", isToday ? "text-blue-200" : "text-gray-400")}>
                      {format(d, "E", { locale: ja })}
                    </div>
                    <div className={cn("text-sm font-bold", isToday ? "text-white" : "")}>
                      {format(d, "d")}
                    </div>
                    {shift ? (
                      <div className={cn(
                        "text-[9px] mt-0.5 font-medium",
                        isToday ? "text-blue-200" : "text-blue-600"
                      )}>
                        {shift.start_time.slice(0, 5)}
                      </div>
                    ) : (
                      <div className={cn(
                        "text-[9px] mt-0.5",
                        isToday ? "text-blue-300" : "text-gray-300"
                      )}>ー</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Week Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-gray-400 mb-1">出勤日数</p>
                <p className="text-lg font-bold text-gray-900">{weekStats.workDays}<span className="text-xs text-gray-400">日</span></p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-gray-400 mb-1">合計時間</p>
                <p className="text-lg font-bold text-gray-900">{weekStats.totalHours.toFixed(1)}<span className="text-xs text-gray-400">h</span></p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-gray-400 mb-1">見込み給与</p>
                <p className="text-lg font-bold text-gray-900">¥{weekStats.estimated.toLocaleString()}</p>
              </div>
            </div>

            {/* Shift list */}
            <div className="space-y-2 mb-4">
              <h3 className="text-sm font-bold text-gray-700">今週のシフト詳細</h3>
              {shifts.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-400">この週のシフトはありません</p>
                </div>
              ) : shifts.map(s => {
                const d = new Date(s.date + "T00:00")
                const hours = calcHours(s.start_time, s.end_time)
                return (
                  <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-bold",
                        dateFnsIsToday(d) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                      )}>
                        <span className="text-[10px] leading-none">{format(d, "E", { locale: ja })}</span>
                        <span className="text-sm leading-none">{format(d, "d")}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{s.start_time.slice(0, 5)} → {s.end_time.slice(0, 5)}</p>
                        <p className="text-xs text-gray-400">{hours.toFixed(1)}時間</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-1 rounded-full font-medium",
                      ROLE_COLORS[s.role] ?? "bg-gray-100 text-gray-700"
                    )}>{s.role}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
