"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { format, addDays, startOfMonth, endOfMonth, isToday, addMonths } from "date-fns"
import { ja } from "date-fns/locale"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import {
  CalendarDays, Send, AlertTriangle, ChevronLeft, ChevronRight,
  Clock, LogOut, Check, X, Loader2, User, Users, MessageCircle,
  ChevronDown, ChevronUp,
} from "lucide-react"
import { useRouter } from "next/navigation"

// ========== Helpers ==========
function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  return (eh * 60 + em - sh * 60 - sm) / 60
}

function formatHours(h: number): string {
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return mins > 0 ? `${hrs}h${mins}m` : `${hrs}h`
}

// ========== Types ==========
interface MyShift {
  id: string
  date: string
  start_time: string
  end_time: string
  role: "ホール" | "キッチン"
  status: "draft" | "optimized" | "confirmed"
}

interface ShiftPeriodInfo {
  id: string
  period_start: string
  period_end: string
  status: string
}

// ========== Tab type ==========
type Tab = "shifts" | "team" | "submit" | "absence"

// ========== Main Component ==========
export default function MyPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("shifts")

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{profile.name}</p>
            <p className="text-[11px] text-gray-500">{profile.position} / {profile.role}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="p-2 text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-lg transition-colors"
          aria-label="ログアウト"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === "shifts" && <MyShiftsTab profile={profile} />}
        {activeTab === "team" && <TeamShiftsTab profile={profile} />}
        {activeTab === "submit" && <SubmitTab profile={profile} />}
        {activeTab === "absence" && <AbsenceTab profile={profile} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-30 safe-area-bottom">
        <div className="flex">
          {([
            { key: "shifts" as Tab, icon: CalendarDays, label: "マイシフト" },
            { key: "team" as Tab, icon: Users, label: "全体" },
            { key: "submit" as Tab, icon: Send, label: "希望提出" },
            { key: "absence" as Tab, icon: MessageCircle, label: "欠勤連絡" },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 pt-3 ${
                activeTab === key
                  ? "text-gray-900"
                  : "text-gray-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

// ========================================================================
// Tab 1: シフト確認
// ========================================================================
interface CoworkerShift {
  start_time: string
  end_time: string
  role: string
  staff: { name: string } | null
}

function MyShiftsTab({ profile }: { profile: { id: string; store_id: string } }) {
  const [shifts, setShifts] = useState<MyShift[]>([])
  const [coworkersByDate, setCoworkersByDate] = useState<Map<string, CoworkerShift[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [calendarOpen, setCalendarOpen] = useState(true)

  const fetchShifts = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const start = format(currentMonth, "yyyy-MM-dd")
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd")

      // 自分のシフト
      const { data: myShifts } = await supabase
        .from("shifts")
        .select("id, date, start_time, end_time, role, status")
        .eq("staff_id", profile.id)
        .gte("date", start)
        .lte("date", end)
        .order("date")
        .order("start_time")
      setShifts((myShifts as MyShift[]) ?? [])

      // 同僚のシフト（同じ店舗・同じ期間、自分以外）
      const { data: othersData } = await supabase
        .from("shifts")
        .select("date, start_time, end_time, role, staff:staff(name)")
        .eq("store_id", profile.store_id)
        .neq("staff_id", profile.id)
        .gte("date", start)
        .lte("date", end)
        .in("status", ["confirmed", "optimized"])
        .order("start_time")

      const cMap = new Map<string, CoworkerShift[]>()
      ;(othersData ?? []).forEach((s: any) => {
        if (!cMap.has(s.date)) cMap.set(s.date, [])
        cMap.get(s.date)!.push(s)
      })
      setCoworkersByDate(cMap)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [profile.id, profile.store_id, currentMonth])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  // 自分のシフトがある日を日付順にグループ化
  const shiftDays = useMemo(() => {
    const map = new Map<string, MyShift[]>()
    shifts.forEach(s => {
      if (!map.has(s.date)) map.set(s.date, [])
      map.get(s.date)!.push(s)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [shifts])

  // シフトがある日のセット（ミニカレンダー用）
  const shiftDateSet = useMemo(() => new Set(shifts.map(s => s.date)), [shifts])

  // ミニカレンダーの日付グリッド
  const calendarGrid = useMemo(() => {
    const monthStart = currentMonth
    const monthEnd = endOfMonth(currentMonth)
    const startDow = monthStart.getDay() // 0=Sun
    const days: (Date | null)[] = []
    // 空白セル
    for (let i = 0; i < startDow; i++) days.push(null)
    // 日付セル
    let d = new Date(monthStart)
    while (d <= monthEnd) {
      days.push(new Date(d))
      d = addDays(d, 1)
    }
    return days
  }, [currentMonth])

  const todayStr = format(new Date(), "yyyy-MM-dd")
  const hasOptimized = shifts.some(s => s.status === "optimized")

  // 月間合計時間
  const monthlyTotalHours = useMemo(() => {
    return shifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
  }, [shifts])

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
  }

  return (
    <div className="px-4 pt-2 pb-4">
      {/* 月切替 */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCurrentMonth(m => addMonths(m, -1))} className="p-2 -ml-2 rounded-lg">
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </button>
        <h3 className="text-base font-bold text-gray-900">
          {format(currentMonth, "yyyy年M月", { locale: ja })}
        </h3>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 -mr-2 rounded-lg">
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* ミニカレンダー（折りたたみ可能） */}
      <div className="mb-3">
        <button
          onClick={() => setCalendarOpen(v => !v)}
          className="flex items-center gap-1 text-xs text-gray-400 mb-1.5"
        >
          {calendarOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          カレンダー
        </button>
        {calendarOpen && (
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="grid grid-cols-7 text-center text-[10px] text-gray-400 mb-1">
              {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
                <div key={d} className={i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : ""}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center gap-y-0.5">
              {calendarGrid.map((d, i) => {
                if (!d) return <div key={`empty-${i}`} />
                const ds = format(d, "yyyy-MM-dd")
                const isTodays = ds === todayStr
                const hasShift = shiftDateSet.has(ds)
                const dow = d.getDay()
                return (
                  <div key={ds} className="flex flex-col items-center py-0.5">
                    <span className={`text-[11px] tabular-nums w-6 h-6 flex items-center justify-center rounded-full ${
                      isTodays ? "bg-gray-900 text-white font-bold" :
                      dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-gray-600"
                    }`}>
                      {d.getDate()}
                    </span>
                    {hasShift && (
                      <span className="w-1 h-1 rounded-full bg-gray-900 mt-0.5" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 月間合計 */}
      {shifts.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-2.5 mb-3">
          <span className="text-xs text-gray-400">今月の合計</span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900 tabular-nums">{formatHours(monthlyTotalHours)}</span>
            <span className="text-[11px] text-gray-400">{shiftDays.length}日</span>
          </div>
        </div>
      )}

      {/* 確定リクエストボタン（仮シフトがある場合） */}
      {hasOptimized && (
        <button className="w-full mb-3 py-2.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
          <Check className="h-4 w-4" />
          確定リクエストを送る
        </button>
      )}

      {shiftDays.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-300">この月のシフトはありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shiftDays.map(([date, dayShifts]) => {
            const d = new Date(date + "T00:00")
            const dow = d.getDay()
            const isTodays = date === todayStr
            const coworkers = coworkersByDate.get(date) ?? []

            const dayHours = dayShifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)

            return (
              <div key={date} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* 日付ヘッダー */}
                <div className={`flex items-center gap-2 px-3 py-2 ${isTodays ? "bg-gray-900" : "bg-gray-50"}`}>
                  <div className={`text-lg font-bold tabular-nums ${isTodays ? "text-white" : "text-gray-900"}`}>
                    {d.getDate()}
                  </div>
                  <div className={`text-xs font-medium ${
                    isTodays ? "text-gray-300" :
                    dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-gray-400"
                  }`}>
                    {format(d, "E", { locale: ja })}
                  </div>
                  <span className={`text-[11px] ml-auto tabular-nums ${isTodays ? "text-gray-400" : "text-gray-400"}`}>
                    {formatHours(dayHours)}
                  </span>
                </div>

                {/* シフトブロック */}
                <div className="divide-y divide-gray-50">
                  {dayShifts.map((s) => {
                    // このシフトの時間帯に重なる同僚を絞り込み
                    const overlappingCoworkers = coworkers.filter(c =>
                      c.start_time < s.end_time && c.end_time > s.start_time
                    )

                    return (
                      <div key={s.id} className="border-l-[3px] border-l-gray-800 pl-3 pr-3 py-2.5 ml-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-gray-900 tabular-nums tracking-tight">
                            {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                          </span>
                          <span className="text-xs text-gray-400">{s.role}</span>
                          <StatusBadge status={s.status} />
                        </div>

                        {/* 同僚（シフトごと） */}
                        {overlappingCoworkers.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-300 mr-0.5">同僚</span>
                            {overlappingCoworkers.map((c, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 bg-gray-50 rounded-full px-2 py-0.5 text-[11px] text-gray-600"
                                title={`${c.start_time.slice(0, 5)}–${c.end_time.slice(0, 5)} ${c.role}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  c.role === "ホール" ? "bg-blue-400" : "bg-green-400"
                                }`} />
                                {c.staff?.name ?? "—"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ========================================================================
// Tab 2: 全体シフト表
// ========================================================================
interface TeamShiftRow {
  date: string
  start_time: string
  end_time: string
  role: string
  status: string
  staff: { name: string } | null
  staff_id: string
}

function TeamShiftsTab({ profile }: { profile: { id: string; store_id: string } }) {
  const [teamShifts, setTeamShifts] = useState<TeamShiftRow[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => {
    // 今週の月曜日
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const mon = new Date(now)
    mon.setDate(now.getDate() + diff)
    mon.setHours(0, 0, 0, 0)
    return mon
  })

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const fetchTeamShifts = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const start = format(weekStart, "yyyy-MM-dd")
      const end = format(addDays(weekStart, 6), "yyyy-MM-dd")
      const { data } = await supabase
        .from("shifts")
        .select("date, start_time, end_time, role, status, staff_id, staff:staff(name)")
        .eq("store_id", profile.store_id)
        .gte("date", start)
        .lte("date", end)
        .order("start_time")
      setTeamShifts((data as TeamShiftRow[]) ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [profile.store_id, weekStart])

  useEffect(() => { fetchTeamShifts() }, [fetchTeamShifts])

  // スタッフ一覧（名前順）
  const staffList = useMemo(() => {
    const map = new Map<string, string>()
    teamShifts.forEach(s => {
      if (s.staff?.name && !map.has(s.staff_id)) {
        map.set(s.staff_id, s.staff.name)
      }
    })
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
  }, [teamShifts])

  // staff_id + date → shifts
  const shiftMap = useMemo(() => {
    const m = new Map<string, TeamShiftRow[]>()
    teamShifts.forEach(s => {
      const key = `${s.staff_id}_${s.date}`
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(s)
    })
    return m
  }, [teamShifts])

  const todayStr = format(new Date(), "yyyy-MM-dd")

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
  }

  return (
    <div className="pb-4">
      {/* 週切替 */}
      <div className="flex items-center justify-between px-4 py-2">
        <button onClick={() => setWeekStart(w => addDays(w, -7))} className="p-2 -ml-2 rounded-lg">
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </button>
        <h3 className="text-sm font-bold text-gray-900">
          {format(weekStart, "M/d", { locale: ja })}–{format(addDays(weekStart, 6), "M/d", { locale: ja })}
        </h3>
        <button onClick={() => setWeekStart(w => addDays(w, 7))} className="p-2 -mr-2 rounded-lg">
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {staffList.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-300">この週のシフトはありません</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-xs">
            {/* 曜日ヘッダー */}
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-3 py-2 w-20 text-gray-500 font-medium sticky left-0 bg-gray-50 z-10">名前</th>
                {weekDays.map(d => {
                  const ds = format(d, "yyyy-MM-dd")
                  const dow = d.getDay()
                  const isTodays = ds === todayStr
                  return (
                    <th key={ds} className={`text-center px-1 py-2 font-medium ${isTodays ? "bg-gray-900 text-white" : "text-gray-500"}`}>
                      <div>{format(d, "M/d")}</div>
                      <div className={`text-[10px] ${
                        isTodays ? "text-gray-300" :
                        dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-gray-400"
                      }`}>{format(d, "E", { locale: ja })}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {staffList.map(([staffId, name]) => {
                const isMe = staffId === profile.id
                return (
                  <tr key={staffId} className={`border-b border-gray-50 ${isMe ? "bg-blue-50/50" : ""}`}>
                    <td className={`px-3 py-2 font-medium sticky left-0 z-10 ${isMe ? "bg-blue-50 text-gray-900" : "bg-gray-50 text-gray-700"}`}>
                      {name}
                      {isMe && <span className="text-[9px] text-blue-500 ml-0.5">*</span>}
                    </td>
                    {weekDays.map(d => {
                      const ds = format(d, "yyyy-MM-dd")
                      const dayShifts = shiftMap.get(`${staffId}_${ds}`) ?? []
                      return (
                        <td key={ds} className="text-center px-1 py-2 align-top">
                          {dayShifts.length > 0 ? (
                            <div className="space-y-0.5">
                              {dayShifts.map((s, i) => (
                                <div key={i}>
                                  <div className="font-semibold text-gray-800 tabular-nums leading-tight">
                                    {s.start_time.slice(0, 5)}
                                  </div>
                                  <div className="text-gray-400 tabular-nums leading-tight">
                                    {s.end_time.slice(0, 5)}
                                  </div>
                                  <div className="text-[9px] text-gray-400">{s.role === "ホール" ? "H" : "K"}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ========================================================================
// Tab 3: 希望提出
// ========================================================================
type DayChoice = "available" | "off" | null
interface DayEntry {
  choice: DayChoice
  start: string
  end: string
}

function SubmitTab({ profile }: { profile: { id: string; store_id: string; position: string; role: string } }) {
  const [periods, setPeriods] = useState<ShiftPeriodInfo[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<ShiftPeriodInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [notes, setNotes] = useState("")

  // 各日の選択状態: 出勤希望 / 休暇希望 / 未選択
  const [dayEntries, setDayEntries] = useState<Map<number, DayEntry>>(new Map())

  // 期間データ取得
  useEffect(() => {
    const fetchPeriods = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("shift_periods")
        .select("id, period_start, period_end, status")
        .eq("store_id", profile.store_id)
        .in("status", ["draft", "collecting"])
        .order("period_start", { ascending: false })
        .limit(5)
      setPeriods((data as ShiftPeriodInfo[]) ?? [])
      if (data && data.length > 0) setSelectedPeriod(data[0] as ShiftPeriodInfo)
      setLoading(false)
    }
    fetchPeriods()
  }, [profile.store_id])

  // 期間の日数リスト
  const periodDays = useMemo(() => {
    if (!selectedPeriod) return []
    const days: { date: Date; dayNum: number }[] = []
    let d = new Date(selectedPeriod.period_start + "T00:00")
    const end = new Date(selectedPeriod.period_end + "T00:00")
    let dayNum = 1
    while (d <= end) {
      days.push({ date: new Date(d), dayNum })
      d = addDays(d, 1)
      dayNum++
    }
    return days
  }, [selectedPeriod])

  const setDayChoice = (dayNum: number, choice: DayChoice) => {
    setDayEntries(prev => {
      const next = new Map(prev)
      const current = next.get(dayNum)
      if (current?.choice === choice) {
        // 同じボタンを再タップで未選択に戻す
        next.delete(dayNum)
      } else {
        next.set(dayNum, {
          choice,
          start: current?.start ?? "11:00",
          end: current?.end ?? "22:00",
        })
      }
      return next
    })
  }

  const updateTime = (dayNum: number, field: "start" | "end", value: string) => {
    setDayEntries(prev => {
      const next = new Map(prev)
      const current = next.get(dayNum) ?? { choice: "available" as DayChoice, start: "11:00", end: "22:00" }
      next.set(dayNum, { ...current, [field]: value })
      return next
    })
  }

  // 提出データの集計
  const summary = useMemo(() => {
    let available = 0, off = 0, unset = 0, totalHours = 0
    periodDays.forEach(({ dayNum }) => {
      const entry = dayEntries.get(dayNum)
      if (entry?.choice === "available") {
        available++
        totalHours += calcHours(entry.start, entry.end)
      } else if (entry?.choice === "off") off++
      else unset++
    })
    return { available, off, unset, totalHours }
  }, [dayEntries, periodDays])

  const handleSubmit = async () => {
    if (!selectedPeriod) return
    setSubmitting(true)
    try {
      const requested_days_off: number[] = []
      const available_days: { day: number; start: string; end: string }[] = []

      dayEntries.forEach((entry, dayNum) => {
        if (entry.choice === "off") {
          requested_days_off.push(dayNum)
        } else if (entry.choice === "available") {
          available_days.push({ day: dayNum, start: entry.start, end: entry.end })
        }
      })

      const res = await fetch("/api/shift-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_period_id: selectedPeriod.id,
          staff_id: profile.id,
          submission_type: "希望提出",
          requested_days_off: requested_days_off.length > 0 ? requested_days_off : null,
          available_days: available_days.length > 0 ? available_days : null,
          notes: notes || null,
        }),
      })
      if (!res.ok) throw new Error("提出に失敗しました")
      setSubmitted(true)
    } catch {
      alert("提出に失敗しました。もう一度お試しください。")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
  }

  if (submitted) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">提出完了</h2>
        <p className="text-sm text-gray-500 text-center mb-6">シフト希望を提出しました。確定シフトは「シフト確認」タブで確認できます。</p>
        <button
          onClick={() => { setSubmitted(false); setDayEntries(new Map()); setNotes("") }}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium active:bg-indigo-700"
        >
          別の期間を提出
        </button>
      </div>
    )
  }

  if (periods.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <CalendarDays className="h-12 w-12 text-gray-300 mb-3" />
        <h2 className="text-base font-bold text-gray-700 mb-1">受付中のシフト期間がありません</h2>
        <p className="text-sm text-gray-400 text-center">管理者がシフト期間を作成すると、ここから希望を提出できます。</p>
      </div>
    )
  }

  const TIME_OPTIONS = [
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
    "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
  ]

  return (
    <div className="p-4 space-y-3">
      {/* 期間選択 */}
      {periods.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelectedPeriod(p); setDayEntries(new Map()) }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
                selectedPeriod?.id === p.id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {format(new Date(p.period_start + "T00:00"), "M/d")}〜{format(new Date(p.period_end + "T00:00"), "M/d")}
            </button>
          ))}
        </div>
      )}

      {/* 期間ヘッダー */}
      {selectedPeriod && (
        <div className="text-center py-1">
          <p className="text-base font-bold text-gray-900">
            {format(new Date(selectedPeriod.period_start + "T00:00"), "M月d日", { locale: ja })}
            〜
            {format(new Date(selectedPeriod.period_end + "T00:00"), "M月d日", { locale: ja })}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">各日の希望を入力してください</p>
        </div>
      )}

      {/* 日ごとの希望入力 */}
      <div className="space-y-2">
        {periodDays.map(({ date, dayNum }) => {
          const dow = date.getDay()
          const entry = dayEntries.get(dayNum)
          const choice = entry?.choice ?? null
          const dayLabel = format(date, "M/d", { locale: ja })
          const dowLabel = format(date, "E", { locale: ja })

          return (
            <div
              key={dayNum}
              className={`bg-white rounded-xl border ${
                choice === "available" ? "border-gray-300" :
                choice === "off" ? "border-gray-200 bg-gray-50" :
                "border-gray-100"
              }`}
            >
              <div className="flex items-center px-3 py-2.5 gap-2">
                {/* 日付 */}
                <div className="w-14 flex-shrink-0">
                  <span className="text-sm font-bold text-gray-900">{dayLabel}</span>
                  <span className={`text-xs ml-0.5 ${
                    dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-gray-400"
                  }`}>{dowLabel}</span>
                </div>

                {/* 3択セグメント */}
                <div className="flex flex-1 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setDayChoice(dayNum, "available")}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-medium ${
                      choice === "available"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-400"
                    }`}
                  >
                    出勤
                  </button>
                  <button
                    onClick={() => setDayChoice(dayNum, "off")}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-medium ${
                      choice === "off"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-400"
                    }`}
                  >
                    休み
                  </button>
                </div>
              </div>

              {/* 時間帯（出勤選択時） */}
              {choice === "available" && (
                <div className="px-3 pb-2.5 flex items-center gap-1.5 ml-14">
                  <select
                    value={entry?.start ?? "11:00"}
                    onChange={e => updateTime(dayNum, "start", e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-0 appearance-none text-center"
                  >
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-gray-300 text-xs">—</span>
                  <select
                    value={entry?.end ?? "22:00"}
                    onChange={e => updateTime(dayNum, "end", e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-0 appearance-none text-center"
                  >
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-[11px] text-gray-400 tabular-nums ml-1 flex-shrink-0">
                    {formatHours(calcHours(entry?.start ?? "11:00", entry?.end ?? "22:00"))}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 備考 */}
      <div className="bg-white rounded-xl border border-gray-100 p-3">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="備考（連続勤務制限、希望など）"
          rows={2}
          className="w-full text-sm resize-none focus:outline-none placeholder:text-gray-300"
        />
      </div>

      {/* サマリー + 提出 */}
      <div className="pb-4 space-y-2.5">
        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <span>出勤 <span className="font-bold text-gray-700">{summary.available}</span></span>
          <span>休み <span className="font-bold text-gray-700">{summary.off}</span></span>
          <span>未選択 <span className="font-bold text-gray-700">{summary.unset}</span></span>
          {summary.totalHours > 0 && (
            <span>合計 <span className="font-bold text-gray-700">{formatHours(summary.totalHours)}</span></span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || (summary.available === 0 && summary.off === 0)}
          className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? "提出中..." : "提出する"}
        </button>
      </div>
    </div>
  )
}

// ========================================================================
// Tab 3: 欠勤連絡
// ========================================================================
function AbsenceTab({ profile }: { profile: { id: string; store_id: string } }) {
  const [upcomingShifts, setUpcomingShifts] = useState<MyShift[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShiftDate, setSelectedShiftDate] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchUpcoming = async () => {
      const supabase = createClient()
      const today = format(new Date(), "yyyy-MM-dd")
      const twoWeeksLater = format(addDays(new Date(), 14), "yyyy-MM-dd")
      const { data } = await supabase
        .from("shifts")
        .select("id, date, start_time, end_time, role, status")
        .eq("staff_id", profile.id)
        .gte("date", today)
        .lte("date", twoWeeksLater)
        .in("status", ["confirmed", "optimized"])
        .order("date")
        .order("start_time")
      setUpcomingShifts((data as MyShift[]) ?? [])
      setLoading(false)
    }
    fetchUpcoming()
  }, [profile.id])

  // 日付ごとにグループ化（hookはreturnの前に置く必要がある）
  const groupedByDate = useMemo(() => {
    const map = new Map<string, MyShift[]>()
    upcomingShifts.forEach(s => {
      if (!map.has(s.date)) map.set(s.date, [])
      map.get(s.date)!.push(s)
    })
    return Array.from(map.entries())
  }, [upcomingShifts])

  const handleSubmitAbsence = async () => {
    if (!selectedShiftDate) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/absence-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: profile.id,
          store_id: profile.store_id,
          date: selectedShiftDate,
          reason,
        }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      alert("欠勤連絡に失敗しました。もう一度お試しください。")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
  }

  if (submitted) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">欠勤連絡完了</h2>
        <p className="text-sm text-gray-500 text-center mb-2">
          {selectedShiftDate && format(new Date(selectedShiftDate + "T00:00"), "M月d日(E)", { locale: ja })}の欠勤を連絡しました。
        </p>
        <p className="text-xs text-gray-400 text-center mb-6">管理者に通知されました。代替スタッフの手配が行われます。</p>
        <button
          onClick={() => { setSubmitted(false); setSelectedShiftDate(null); setReason("") }}
          className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium active:bg-gray-300"
        >
          戻る
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">急な欠勤の連絡</p>
            <p className="text-xs text-amber-600 mt-0.5">体調不良などで出勤できない場合はこちらから連絡してください。</p>
          </div>
        </div>
      </div>

      {/* シフト選択 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">欠勤するシフトを選択</h2>
        {groupedByDate.length > 0 ? (
          <div className="space-y-2">
            {groupedByDate.map(([date, dayShifts]) => {
              const isSelected = selectedShiftDate === date
              const isNearToday = isToday(new Date(date + "T00:00"))
              return (
                <button
                  key={date}
                  onClick={() => setSelectedShiftDate(isSelected ? null : date)}
                  className={`w-full text-left p-3 rounded-xl transition-all border-2 ${
                    isSelected ? "border-amber-400 bg-amber-50" : "border-transparent bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-sm font-bold ${isNearToday ? "text-red-600" : "text-gray-800"}`}>
                        {format(new Date(date + "T00:00"), "M/d(E)", { locale: ja })}
                        {isNearToday && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">今日</span>}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {dayShifts.map(s => `${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)} ${s.role}`).join("、")}
                      </p>
                    </div>
                    {isSelected && <Check className="h-5 w-5 text-amber-600" />}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">今後2週間以内の確定シフトはありません</p>
        )}
      </div>

      {/* 理由入力 */}
      {selectedShiftDate && (
        <div className="bg-white rounded-2xl p-4 shadow-sm animate-in slide-in-from-bottom-2 duration-200">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">欠勤理由</h2>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="体調不良、家庭の事情など..."
            rows={3}
            className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
          />

          <button
            onClick={handleSubmitAbsence}
            disabled={submitting}
            className="w-full mt-3 py-3.5 bg-amber-500 text-white rounded-2xl text-sm font-bold active:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            {submitting ? "送信中..." : "欠勤を連絡する"}
          </button>
        </div>
      )}
    </div>
  )
}

// ========== Shared Components ==========
function StatusBadge({ status }: { status: string }) {
  const config = {
    confirmed: { label: "確定", className: "bg-green-100 text-green-700" },
    optimized: { label: "仮", className: "bg-orange-100 text-orange-700" },
    draft: { label: "下書き", className: "bg-gray-100 text-gray-600" },
  }[status] ?? { label: status, className: "bg-gray-100 text-gray-600" }

  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.className}`}>
      {config.label}
    </span>
  )
}
