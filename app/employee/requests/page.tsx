"use client"

import { useState, useEffect, useCallback } from "react"
import { format, addDays, startOfMonth, endOfMonth, addMonths, isSameMonth, isToday as dateFnsIsToday } from "date-fns"
import { ja } from "date-fns/locale"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ChevronLeft, ChevronRight, Check, Send, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type DayChoice = "available" | "off" | null
interface DayEntry { choice: DayChoice; start: string; end: string }

interface ShiftPeriod {
  id: string
  period_start: string
  period_end: string
  status: string
}

interface ExistingRequest {
  date: string
  request_type: string
  preferred_start_time: string | null
  preferred_end_time: string | null
}

export default function RequestsPage() {
  const { profile } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(() => addMonths(new Date(), 1))
  const [entries, setEntries] = useState<Record<string, DayEntry>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [shiftPeriod, setShiftPeriod] = useState<ShiftPeriod | null>(null)
  const [loading, setLoading] = useState(true)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  // Fetch shift period for the selected month
  const fetchPeriod = useCallback(async () => {
    if (!profile?.store_id) return
    setLoading(true)
    const supabase = createClient()
    const start = format(monthStart, "yyyy-MM-dd")
    const end = format(monthEnd, "yyyy-MM-dd")

    const { data: period } = await supabase
      .from("shift_periods")
      .select("id, period_start, period_end, status")
      .eq("store_id", profile.store_id)
      .lte("period_start", end)
      .gte("period_end", start)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle()

    setShiftPeriod(period)

    // Fetch existing requests
    if (period && profile?.id) {
      const { data: requests } = await supabase
        .from("shift_requests")
        .select("date, request_type, preferred_start_time, preferred_end_time")
        .eq("shift_period_id", period.id)
        .eq("staff_id", profile.id)

      if (requests && requests.length > 0) {
        const newEntries: Record<string, DayEntry> = {}
        requests.forEach((r: ExistingRequest) => {
          newEntries[r.date] = {
            choice: r.request_type === "holiday" ? "off" : "available",
            start: r.preferred_start_time?.slice(0, 5) ?? "10:00",
            end: r.preferred_end_time?.slice(0, 5) ?? "18:00",
          }
        })
        setEntries(newEntries)
      }
    }
    setLoading(false)
  }, [profile?.store_id, profile?.id, currentMonth])

  useEffect(() => { fetchPeriod() }, [fetchPeriod])

  const toggleDay = (dateStr: string) => {
    setEntries(prev => {
      const current = prev[dateStr]?.choice
      let nextChoice: DayChoice
      if (!current) nextChoice = "available"
      else if (current === "available") nextChoice = "off"
      else nextChoice = null

      if (!nextChoice) {
        const copy = { ...prev }
        delete copy[dateStr]
        return copy
      }
      return { ...prev, [dateStr]: { choice: nextChoice, start: prev[dateStr]?.start ?? "10:00", end: prev[dateStr]?.end ?? "18:00" } }
    })
    setSubmitted(false)
  }

  const updateTime = (dateStr: string, field: "start" | "end", value: string) => {
    setEntries(prev => ({
      ...prev,
      [dateStr]: { ...prev[dateStr], [field]: value }
    }))
    setSubmitted(false)
  }

  const handleSubmit = async () => {
    if (!shiftPeriod || !profile) return
    setSubmitting(true)
    try {
      const supabase = createClient()

      // Delete existing requests for this period
      await supabase
        .from("shift_requests")
        .delete()
        .eq("shift_period_id", shiftPeriod.id)
        .eq("staff_id", profile.id)

      // Insert new requests
      const rows = Object.entries(entries).map(([date, entry]) => ({
        shift_period_id: shiftPeriod.id,
        staff_id: profile.id,
        store_id: profile.store_id,
        date,
        request_type: entry.choice === "off" ? "holiday" : "available",
        preferred_start_time: entry.choice === "available" ? entry.start + ":00" : null,
        preferred_end_time: entry.choice === "available" ? entry.end + ":00" : null,
      }))

      if (rows.length > 0) {
        await supabase.from("shift_requests").insert(rows)
      }
      setSubmitted(true)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  // Build days list for the month
  const days: Date[] = []
  let d = monthStart
  while (d <= monthEnd) {
    days.push(d)
    d = addDays(d, 1)
  }

  const availableCount = Object.values(entries).filter(e => e.choice === "available").length
  const offCount = Object.values(entries).filter(e => e.choice === "off").length

  if (!profile) return null

  return (
    <div>
      <header className="bg-white px-5 py-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">希望シフト提出</h1>
        <p className="text-xs text-gray-400 mt-0.5">日付をタップして希望を入力</p>
      </header>

      <div className="px-5 py-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { setCurrentMonth(addMonths(currentMonth, -1)); setEntries({}) }} className="p-2 -ml-2 rounded-lg active:scale-[0.97] transition-transform">
            <ChevronLeft className="h-5 w-5 text-gray-400" />
          </button>
          <span className="text-base font-bold">{format(currentMonth, "yyyy年M月", { locale: ja })}</span>
          <button onClick={() => { setCurrentMonth(addMonths(currentMonth, 1)); setEntries({}) }} className="p-2 -mr-2 rounded-lg active:scale-[0.97] transition-transform">
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">出勤可能</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-600">休み希望</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <span className="text-gray-600">未入力</span>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <p className="text-[10px] text-green-600">出勤可能</p>
            <p className="text-xl font-bold text-green-700">{availableCount}<span className="text-xs">日</span></p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
            <p className="text-[10px] text-red-600">休み希望</p>
            <p className="text-xl font-bold text-red-700">{offCount}<span className="text-xs">日</span></p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : !shiftPeriod ? (
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">シフト期間が未設定</p>
              <p className="text-xs text-yellow-600 mt-1">この月のシフト期間がまだ作成されていません。管理者にお問い合わせください。</p>
            </div>
          </div>
        ) : (
          <>
            {/* Day list */}
            <div className="space-y-2 mb-6">
              {days.map(day => {
                const dateStr = format(day, "yyyy-MM-dd")
                const entry = entries[dateStr]
                const dayOfWeek = day.getDay()
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                return (
                  <div key={dateStr} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <button
                      onClick={() => toggleDay(dateStr)}
                      className="w-full flex items-center justify-between px-4 py-3 active:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex flex-col items-center justify-center text-xs font-bold",
                          dateFnsIsToday(day) ? "bg-blue-600 text-white" :
                          isWeekend ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-700"
                        )}>
                          <span className="text-[10px] leading-none">{format(day, "E", { locale: ja })}</span>
                          <span className="text-sm leading-none">{format(day, "d")}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {format(day, "M月d日(E)", { locale: ja })}
                        </span>
                      </div>
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        entry?.choice === "available" ? "bg-green-500" :
                        entry?.choice === "off" ? "bg-red-500" : "bg-gray-200"
                      )}>
                        {entry?.choice === "available" && <Check className="h-4 w-4 text-white" />}
                        {entry?.choice === "off" && <span className="text-white text-xs font-bold">✕</span>}
                      </div>
                    </button>

                    {/* Time selection for available days */}
                    {entry?.choice === "available" && (
                      <div className="px-4 pb-3 flex items-center gap-2 border-t border-gray-50 pt-2">
                        <span className="text-xs text-gray-400">勤務可能:</span>
                        <input
                          type="time"
                          value={entry.start}
                          onChange={(e) => updateTime(dateStr, "start", e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        />
                        <span className="text-xs text-gray-400">〜</span>
                        <input
                          type="time"
                          value={entry.end}
                          onChange={(e) => updateTime(dateStr, "end", e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Submit button */}
            <div className="sticky bottom-20 pb-2">
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(entries).length === 0}
                className={cn(
                  "w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                  submitted
                    ? "bg-green-500 text-white"
                    : "bg-blue-600 text-white active:scale-[0.98] disabled:bg-gray-300 disabled:text-gray-500"
                )}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : submitted ? (
                  <>
                    <Check className="h-4 w-4" />
                    提出完了
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    希望シフトを提出
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
