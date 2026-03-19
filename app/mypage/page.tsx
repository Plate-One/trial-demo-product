"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { format, addDays, startOfWeek, addMonths, startOfMonth, endOfMonth, isToday as dateFnsIsToday } from "date-fns"
import { ja } from "date-fns/locale"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import {
  Loader2, CalendarDays, Users, Bell, UserCircle,
  ChevronLeft, ChevronRight, Send, AlertTriangle, Check,
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

const ROLE_COLORS: Record<string, string> = {
  "キッチン": "#7c5cbf",
  "ホール": "#2a9d8f",
  "バー": "#e07a36",
  "MGR": "#d1477a",
}

// ========== Types ==========
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
  short_name: string
  hourly_wage_hall: number
  hourly_wage_kitchen: number
}

interface TeamShiftRow {
  date: string
  start_time: string
  end_time: string
  role: string
  status: string
  staff: { name: string; role: string; position: string } | null
  staff_id: string
}

interface NewsItem {
  id: number
  date: string
  title: string
  body: string
  pin?: boolean
}

interface ShiftPeriodInfo {
  id: string
  period_start: string
  period_end: string
  status: string
}

type Tab = "home" | "team" | "news" | "profile"
type SubPage = null | "submit" | "absence"
type DayChoice = "available" | "off" | null
interface DayEntry { choice: DayChoice; start: string; end: string }

// ========== Tap feedback style ==========
const tap = "active:scale-[0.97] active:opacity-70 transition-all"
const tapLight = "active:bg-gray-100 transition-colors"

// ========== Main ==========
export default function MyPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [subPage, setSubPage] = useState<SubPage>(null)
  const [now, setNow] = useState(new Date())
  const [store, setStore] = useState<StoreInfo | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [authLoading, user, router])

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
        .select("name, short_name, hourly_wage_hall, hourly_wage_kitchen")
        .eq("id", profile.store_id)
        .maybeSingle()
      if (data) setStore(data)
    }
    fetchStore()
  }, [profile?.store_id])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    )
  }
  if (!user || !profile) return null

  const timeStr = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
  const hourlyRate = profile.role === "ホール"
    ? (store?.hourly_wage_hall ?? 1150)
    : (store?.hourly_wage_kitchen ?? 1200)

  const navTo = (tab: Tab) => { setActiveTab(tab); setSubPage(null) }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen flex flex-col bg-white font-sans text-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center px-5 py-3 border-b border-gray-100 sticky top-0 z-10 bg-white">
        <span className="font-bold text-base">{store?.name ?? "読み込み中..."}</span>
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <div className="text-xs font-semibold text-gray-700 leading-tight">{profile.name}</div>
            <div className="text-[10px] text-gray-400 leading-tight">{profile.role}</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            <UserCircle className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto pb-16">
        {subPage === "submit" ? (
          <SubmitPage profile={profile} onBack={() => setSubPage(null)} />
        ) : subPage === "absence" ? (
          <AbsencePage profile={profile} onBack={() => setSubPage(null)} />
        ) : (
          <>
            {activeTab === "home" && <HomeTab profile={profile} now={now} timeStr={timeStr} hourlyRate={hourlyRate} />}
            {activeTab === "team" && <TeamTab profile={profile} />}
            {activeTab === "news" && <NewsTab profile={profile} />}
            {activeTab === "profile" && (
              <ProfileTab profile={profile} hourlyRate={hourlyRate} signOut={signOut} onSubPage={setSubPage} />
            )}
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex bg-white border-t border-gray-100 z-10">
        {([
          { id: "home" as Tab, label: "シフト", icon: CalendarDays },
          { id: "team" as Tab, label: "全体", icon: Users },
          { id: "news" as Tab, label: "通知", icon: Bell },
          { id: "profile" as Tab, label: "マイページ", icon: UserCircle },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => navTo(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 pt-2.5 ${tap} ${
              activeTab === t.id && !subPage ? "text-gray-900" : "text-gray-400"
            }`}
          >
            <t.icon className="h-5 w-5" />
            <span className={`text-[11px] ${activeTab === t.id && !subPage ? "font-bold" : "font-medium"}`}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ========================================================================
// Week Navigation Helper
// ========================================================================
function WeekNav({ weekStart, onChange, label }: { weekStart: Date; onChange: (d: Date) => void; label?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <button onClick={() => onChange(addDays(weekStart, -7))} className={`p-2 -ml-2 rounded-lg ${tap}`}>
        <ChevronLeft className="h-5 w-5 text-gray-400" />
      </button>
      <span className="text-sm font-bold text-gray-900">
        {label ?? `${format(weekStart, "M/d")}〜${format(addDays(weekStart, 6), "M/d")}`}
      </span>
      <button onClick={() => onChange(addDays(weekStart, 7))} className={`p-2 -mr-2 rounded-lg ${tap}`}>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </button>
    </div>
  )
}

// ========================================================================
// Home Tab
// ========================================================================
function HomeTab({
  profile, now, timeStr, hourlyRate,
}: {
  profile: { id: string; store_id: string; role: string; position: string }
  now: Date; timeStr: string; hourlyRate: number
}) {
  const [shifts, setShifts] = useState<MyShift[]>([])
  const [loading, setLoading] = useState(true)
  const [clocked, setClocked] = useState(false)
  const [clockedTime, setClockedTime] = useState<string | null>(null)
  const [selectedShift, setSelectedShift] = useState<MyShift | null>(null)
  const [coworkers, setCoworkers] = useState<TeamShiftRow[]>([])
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const fetchShifts = useCallback(async () => {
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
  }, [profile.id, weekStart])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  const todayStr = format(new Date(), "yyyy-MM-dd")
  const todayShift = shifts.find(s => s.date === todayStr)

  // Next shift (for off days)
  const nextShift = useMemo(() => {
    if (todayShift) return null
    return shifts.find(s => s.date > todayStr) ?? null
  }, [shifts, todayStr, todayShift])

  const weekStats = useMemo(() => {
    const workDays = shifts.length
    const totalHours = shifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
    return { workDays, totalHours, estimated: Math.round(totalHours * hourlyRate) }
  }, [shifts, hourlyRate])

  const shiftByDate = useMemo(() => {
    const m = new Map<string, MyShift>()
    shifts.forEach(s => { if (!m.has(s.date)) m.set(s.date, s) })
    return m
  }, [shifts])

  useEffect(() => {
    if (!selectedShift) { setCoworkers([]); return }
    const fetchCoworkers = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("shifts")
        .select("date, start_time, end_time, role, status, staff_id, staff:staff(name, role, position)")
        .eq("store_id", profile.store_id)
        .eq("date", selectedShift.date)
        .neq("staff_id", profile.id)
        .order("start_time")
      setCoworkers((data as TeamShiftRow[]) ?? [])
    }
    fetchCoworkers()
  }, [selectedShift, profile.store_id, profile.id])

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
  }

  // ── Detail View ──
  if (selectedShift) {
    const shiftDate = new Date(selectedShift.date + "T00:00")
    const hours = calcHours(selectedShift.start_time, selectedShift.end_time)
    return (
      <div className="px-5 py-4">
        <button onClick={() => setSelectedShift(null)} className={`text-sm text-purple-600 font-medium mb-3 ${tap}`}>
          ← 戻る
        </button>
        <div className="text-sm text-gray-400">{format(shiftDate, "M月d日(E)", { locale: ja })}</div>
        <div className="text-[28px] font-bold my-1">
          {selectedShift.start_time.slice(0, 5)} → {selectedShift.end_time.slice(0, 5)}
        </div>
        <div className="text-sm text-gray-500 mb-4">
          {selectedShift.role}　{hours.toFixed(1)}h
          <StatusBadge status={selectedShift.status} />
        </div>
        {coworkers.length > 0 && (
          <>
            <div className="text-sm font-semibold text-gray-400 tracking-wide pt-2 pb-2">
              同日スタッフ（{coworkers.length}人）
            </div>
            {coworkers.map((c, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-gray-50">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ROLE_COLORS[c.staff?.role ?? ""] ?? "#999" }} />
                <span className="text-sm flex-1">{c.staff?.name ?? "—"}</span>
                <span className="text-xs text-gray-400">{c.start_time.slice(0, 5)}–{c.end_time.slice(0, 5)}</span>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  // ── Home View ──
  return (
    <div className="px-5 py-4">
      {/* Today Card */}
      <div className="bg-gray-50 rounded-xl p-5 mb-3">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">
            {now.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
          </span>
          <span className="text-sm text-gray-300">{timeStr}</span>
        </div>
        {todayShift ? (
          <>
            <div className="text-3xl font-bold tracking-tight">
              {todayShift.start_time.slice(0, 5)} → {todayShift.end_time.slice(0, 5)}
            </div>
            <div className="text-sm text-gray-500 mb-4">
              {todayShift.role}
              <StatusBadge status={todayShift.status} />
            </div>
            <button
              onClick={() => { setClocked(!clocked); setClockedTime(timeStr) }}
              className={`w-full py-3.5 rounded-lg text-base font-semibold ${tap} ${
                clocked ? "bg-white border border-gray-200 text-gray-900" : "bg-gray-900 text-white"
              }`}
            >
              {clocked ? "退勤する" : "出勤する"}
            </button>
            {clocked && clockedTime && (
              <div className="text-center text-xs text-gray-400 mt-2">{clockedTime} 出勤済み</div>
            )}
          </>
        ) : (
          <div>
            <div className="text-lg text-gray-300 font-medium py-2">お休み</div>
            {nextShift && (
              <div className="text-xs text-gray-400 mt-1">
                次の出勤: {format(new Date(nextShift.date + "T00:00"), "M/d(E)", { locale: ja })} {nextShift.start_time.slice(0, 5)}〜
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center py-3 mb-1">
        <div className="flex-1 text-center">
          <span className="text-lg font-bold">{weekStats.workDays}</span>
          <span className="text-xs text-gray-400 ml-1">日</span>
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex-1 text-center">
          <span className="text-lg font-bold">{weekStats.totalHours.toFixed(1)}</span>
          <span className="text-xs text-gray-400 ml-1">時間</span>
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex-1 text-center">
          <span className="text-lg font-bold">¥{weekStats.estimated.toLocaleString()}</span>
          <span className="text-xs text-gray-400 ml-1">見込み</span>
        </div>
      </div>

      {/* Week Nav + List */}
      <WeekNav weekStart={weekStart} onChange={setWeekStart} />
      {weekDays.map((day, i) => {
        const dateStr = format(day, "yyyy-MM-dd")
        const shift = shiftByDate.get(dateStr)
        const isToday = dateFnsIsToday(day)
        const isOff = !shift
        return (
          <div
            key={i}
            onClick={() => shift && setSelectedShift(shift)}
            className={`flex items-center gap-3 py-3 border-b border-gray-50 ${
              isOff ? "opacity-40" : `cursor-pointer ${tapLight}`
            } ${isToday ? "border-b-purple-100" : ""}`}
          >
            <div className={`w-11 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-center leading-tight ${
              isToday ? "bg-gray-900 text-white" : "bg-gray-100"
            }`}>
              <span className="text-[11px]">{format(day, "E", { locale: ja })}</span>
              <span className="text-lg font-bold">{day.getDate()}</span>
            </div>
            {isOff ? (
              <span className="text-sm text-gray-400 font-medium">OFF</span>
            ) : (
              <div className="flex-1">
                <div className="text-base font-semibold">
                  {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    {calcHours(shift.start_time, shift.end_time).toFixed(1)}h
                  </span>
                  <StatusBadge status={shift.status} />
                </div>
                <div className="text-xs font-medium mt-0.5" style={{ color: ROLE_COLORS[shift.role] ?? "#999" }}>
                  {shift.role}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ========================================================================
// Team Tab
// ========================================================================
function TeamTab({ profile }: { profile: { id: string; store_id: string; role: string } }) {
  const [teamShifts, setTeamShifts] = useState<TeamShiftRow[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"day" | "week">("day")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay(); return d === 0 ? 6 : d - 1
  })
  const [detailShift, setDetailShift] = useState<TeamShiftRow | null>(null)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const fetchTeam = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const start = format(weekStart, "yyyy-MM-dd")
      const end = format(addDays(weekStart, 6), "yyyy-MM-dd")
      const { data } = await supabase
        .from("shifts")
        .select("date, start_time, end_time, role, status, staff_id, staff:staff(name, role, position)")
        .eq("store_id", profile.store_id)
        .gte("date", start).lte("date", end)
        .order("start_time")
      setTeamShifts((data as TeamShiftRow[]) ?? [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [profile.store_id, weekStart])

  useEffect(() => { fetchTeam() }, [fetchTeam])

  const allStaff = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string }>()
    teamShifts.forEach(s => {
      if (s.staff?.name && !map.has(s.staff_id))
        map.set(s.staff_id, { id: s.staff_id, name: s.staff.name, role: s.staff.role })
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [teamShifts])

  const filteredStaff = useMemo(() =>
    roleFilter === "all" ? allStaff : allStaff.filter(s => s.role === roleFilter),
  [allStaff, roleFilter])

  const shiftMap = useMemo(() => {
    const m = new Map<string, TeamShiftRow[]>()
    teamShifts.forEach(s => {
      const key = `${s.staff_id}_${s.date}`
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(s)
    })
    return m
  }, [teamShifts])

  const roles = useMemo(() => {
    const set = new Set<string>()
    allStaff.forEach(s => set.add(s.role))
    return Array.from(set)
  }, [allStaff])

  const selectedDateStr = format(weekDays[selectedDay], "yyyy-MM-dd")
  const dayShifts = useMemo(() => {
    let filtered = teamShifts.filter(s => s.date === selectedDateStr)
    if (roleFilter !== "all") filtered = filtered.filter(s => s.staff?.role === roleFilter)
    return filtered
  }, [teamShifts, selectedDateStr, roleFilter])

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
  }

  return (
    <div className="px-5 py-4">
      <div className="text-lg font-bold mb-3">全体シフト</div>

      {/* View toggle + Role filter */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {(["day", "week"] as const).map(v => (
          <button key={v} onClick={() => setViewMode(v)}
            className={`px-3 py-1.5 border rounded-full text-xs font-medium ${tap} ${
              viewMode === v ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200"
            }`}
          >{v === "day" ? "日別" : "週間"}</button>
        ))}
        <div className="flex-1" />
        {["all", ...roles].map(f => (
          <button key={f} onClick={() => setRoleFilter(f)}
            className={`px-3 py-1.5 border rounded-full text-xs font-medium ${tap} ${
              roleFilter === f ? "text-white border-transparent" : "bg-white text-gray-500 border-gray-200"
            }`}
            style={roleFilter === f ? { backgroundColor: ROLE_COLORS[f] ?? "#222", borderColor: ROLE_COLORS[f] ?? "#222" } : {}}
          >{f === "all" ? "全" : f.slice(0, 2)}</button>
        ))}
      </div>

      {/* Week Nav */}
      <WeekNav weekStart={weekStart} onChange={(d) => { setWeekStart(d); setSelectedDay(0) }} />

      {/* Day selector */}
      <div className="flex gap-0.5 mb-3">
        {weekDays.map((d, i) => {
          const isToday = dateFnsIsToday(d)
          const dayCount = teamShifts.filter(s => s.date === format(d, "yyyy-MM-dd")).length
          return (
            <div key={i} onClick={() => setSelectedDay(i)}
              className={`flex-1 text-center py-1.5 rounded-lg cursor-pointer flex flex-col items-center gap-px ${tap} ${
                selectedDay === i ? "bg-gray-900 text-white" : "bg-gray-50"
              } ${isToday && selectedDay !== i ? "font-bold" : ""}`}
            >
              <span className="text-[11px] opacity-50">{format(d, "E", { locale: ja })}</span>
              <span className={`text-base ${selectedDay === i ? "font-bold" : "font-medium"}`}>{d.getDate()}</span>
              <span className="text-[10px] opacity-40">{dayCount}</span>
            </div>
          )
        })}
      </div>

      {/* Day View */}
      {viewMode === "day" && (
        <div>
          <div className="text-sm text-gray-400 mb-2">
            {format(weekDays[selectedDay], "M月d日(E)", { locale: ja })} — {dayShifts.length}人出勤
          </div>
          {dayShifts.map((sh, i) => {
            const isMe = sh.staff_id === profile.id
            return (
              <div key={i} onClick={() => setDetailShift(detailShift === sh ? null : sh)}
                className={`flex items-center gap-2.5 py-3 px-2.5 border-b border-gray-50 rounded-md cursor-pointer ${tapLight} ${
                  isMe ? "bg-purple-50/50" : ""
                }`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ROLE_COLORS[sh.staff?.role ?? ""] ?? "#999" }} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${isMe ? "font-bold" : "font-medium"}`}>
                    {sh.staff?.name ?? "—"}
                    {isMe && <span className="text-[10px] text-purple-600 ml-1">自分</span>}
                  </div>
                  <div className="text-xs text-gray-400">{sh.staff?.role}</div>
                </div>
                <div className="text-sm font-semibold text-gray-600 whitespace-nowrap">
                  {sh.start_time.slice(0, 5)}–{sh.end_time.slice(0, 5)}
                </div>
              </div>
            )
          })}
          {dayShifts.length === 0 && (
            <div className="text-center py-12">
              <CalendarDays className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <div className="text-base text-gray-300">この日のシフトはありません</div>
            </div>
          )}
        </div>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <div className="relative">
          <div className="absolute left-0 top-0 w-[80px] z-[3] bg-white">
            <div className="h-10 flex items-center pl-2 border-b border-gray-200">
              <span className="text-xs text-gray-300">名前</span>
            </div>
            {filteredStaff.map(st => {
              const isMe = st.id === profile.id
              return (
                <div key={st.id} className={`h-[52px] flex items-center gap-1.5 pl-2 border-b border-gray-50 overflow-hidden ${isMe ? "bg-purple-50/50" : ""}`}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ROLE_COLORS[st.role] ?? "#999" }} />
                  <span className={`text-xs truncate ${isMe ? "font-bold text-purple-700" : "text-gray-700"}`}>{st.name}</span>
                </div>
              )
            })}
          </div>
          <div className="ml-[80px] overflow-x-auto">
            <div style={{ minWidth: `${weekDays.length * 48}px` }}>
              <div className="flex h-10 border-b border-gray-200 items-center">
                {weekDays.map((d, i) => {
                  const isToday = dateFnsIsToday(d)
                  return (
                    <div key={i} className={`flex-1 min-w-[48px] text-center text-xs ${isToday ? "text-gray-900 font-bold" : "text-gray-400"}`}>
                      <div>{format(d, "E", { locale: ja })}</div>
                      <div className="text-sm font-semibold">{d.getDate()}</div>
                    </div>
                  )
                })}
              </div>
              {filteredStaff.map(st => {
                const isMe = st.id === profile.id
                return (
                  <div key={st.id} className={`flex h-[52px] border-b border-gray-50 ${isMe ? "bg-purple-50/50" : ""}`}>
                    {weekDays.map((d, di) => {
                      const dateStr = format(d, "yyyy-MM-dd")
                      const isToday = dateFnsIsToday(d)
                      const sh = (shiftMap.get(`${st.id}_${dateStr}`) ?? [])[0]
                      return (
                        <div key={di} className={`flex-1 min-w-[48px] flex items-center justify-center px-0.5 ${
                          isToday ? (isMe ? "bg-purple-50/30" : "bg-gray-50/50") : ""
                        }`}>
                          {sh ? (
                            <div className={`py-1.5 px-1 rounded-lg text-center leading-snug w-full cursor-pointer ${tap}`}
                              style={{ backgroundColor: (ROLE_COLORS[st.role] ?? "#999") + (isMe ? "25" : "15") }}
                              onClick={() => setDetailShift(sh)}
                            >
                              <div className="text-xs font-bold" style={{ color: ROLE_COLORS[st.role] ?? "#666" }}>
                                {sh.start_time.slice(0, 5)}
                              </div>
                              <div className="text-[11px] text-gray-400">{sh.end_time.slice(0, 5)}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-200">–</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
          {detailShift && (
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 mt-2.5 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-base font-semibold">
                    {detailShift.staff?.name ?? "—"}
                    <span className="text-xs text-gray-400 font-normal ml-2">{detailShift.staff?.role}</span>
                  </div>
                  <div className="text-sm mt-0.5">
                    {format(new Date(detailShift.date + "T00:00"), "M月d日(E)", { locale: ja })}{" "}
                    {detailShift.start_time.slice(0, 5)} → {detailShift.end_time.slice(0, 5)}
                    <span className="text-gray-400 ml-2">{calcHours(detailShift.start_time, detailShift.end_time).toFixed(1)}h</span>
                  </div>
                </div>
                <button onClick={() => setDetailShift(null)} className={`text-lg text-gray-300 p-1 ${tap}`}>✕</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ========================================================================
// News Tab
// ========================================================================
function NewsTab({ profile }: { profile: { id: string; store_id: string } }) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("announcements")
          .select("id, created_at, title, body, is_pinned")
          .eq("store_id", profile.store_id)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(20)
        if (!error && data && data.length > 0) {
          setNews(data.map((n: any) => ({
            id: n.id, date: format(new Date(n.created_at), "M/d"),
            title: n.title, body: n.body, pin: n.is_pinned,
          })))
        } else {
          setNews([{ id: 1, date: format(new Date(), "M/d"), title: "お知らせはまだありません", body: "管理者からのお知らせがここに表示されます。" }])
        }
      } catch {
        setNews([{ id: 1, date: format(new Date(), "M/d"), title: "お知らせはまだありません", body: "管理者からのお知らせがここに表示されます。" }])
      } finally { setLoading(false) }
    }
    fetchNews()
  }, [profile.store_id])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>

  return (
    <div className="px-5 py-4">
      <div className="text-sm font-semibold text-gray-400 tracking-wide pb-2">お知らせ</div>
      {news.map(n => (
        <div key={n.id} className={`py-3.5 border-b border-gray-50 cursor-pointer ${tapLight}`}
          onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}>
          <div className="flex items-center gap-2 mb-1">
            {n.pin && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded flex-shrink-0">重要</span>}
            <span className="text-xs text-gray-400">{n.date}</span>
          </div>
          <div className="text-sm font-semibold">{n.title}</div>
          {expandedId === n.id && <div className="text-sm text-gray-500 mt-2 leading-relaxed">{n.body}</div>}
        </div>
      ))}
    </div>
  )
}

// ========================================================================
// Profile Tab (with links to submit/absence)
// ========================================================================
function ProfileTab({
  profile, hourlyRate, signOut, onSubPage,
}: {
  profile: { id: string; store_id: string; name: string; role: string; position: string }
  hourlyRate: number; signOut: () => void; onSubPage: (p: SubPage) => void
}) {
  const [monthlyShifts, setMonthlyShifts] = useState<MyShift[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))

  useEffect(() => {
    const fetchMonthly = async () => {
      setLoading(true)
      const supabase = createClient()
      const start = format(currentMonth, "yyyy-MM-dd")
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd")
      const { data } = await supabase
        .from("shifts")
        .select("id, date, start_time, end_time, role, status")
        .eq("staff_id", profile.id)
        .gte("date", start).lte("date", end)
        .order("date", { ascending: false })
        .order("start_time")
      setMonthlyShifts((data as MyShift[]) ?? [])
      setLoading(false)
    }
    fetchMonthly()
  }, [profile.id, currentMonth])

  const stats = useMemo(() => {
    const totalHours = monthlyShifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
    return { days: monthlyShifts.length, hours: totalHours, estimated: Math.round(totalHours * hourlyRate) }
  }, [monthlyShifts, hourlyRate])

  const recentShifts = monthlyShifts.slice(0, 5)

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>

  return (
    <div className="px-5 py-4">
      {/* Profile header */}
      <div className="text-center py-6 pb-5">
        <div className="text-xl font-bold">{profile.name}</div>
        <div className="text-sm text-gray-400 mt-1">
          {profile.role}　{profile.position}　時給 ¥{hourlyRate.toLocaleString()}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <button onClick={() => onSubPage("submit")}
          className={`flex items-center gap-2 bg-gray-50 rounded-xl p-4 ${tap}`}>
          <Send className="h-5 w-5 text-purple-500" />
          <div className="text-left">
            <div className="text-sm font-semibold">希望提出</div>
            <div className="text-[10px] text-gray-400">シフト希望を送る</div>
          </div>
        </button>
        <button onClick={() => onSubPage("absence")}
          className={`flex items-center gap-2 bg-gray-50 rounded-xl p-4 ${tap}`}>
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div className="text-left">
            <div className="text-sm font-semibold">欠勤連絡</div>
            <div className="text-[10px] text-gray-400">休む時はこちら</div>
          </div>
        </button>
      </div>

      {/* Month nav + stats */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCurrentMonth(m => addMonths(m, -1))} className={`p-2 -ml-2 rounded-lg ${tap}`}>
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </button>
        <span className="text-sm font-bold">{format(currentMonth, "yyyy年M月", { locale: ja })}</span>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className={`p-2 -mr-2 rounded-lg ${tap}`}>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { value: `${stats.days}日`, label: "出勤" },
          { value: `${stats.hours.toFixed(1)}h`, label: "実働" },
          { value: `¥${stats.estimated.toLocaleString()}`, label: "月給見込" },
        ].map((r, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4">
            <div className="text-xl font-bold">{r.value}</div>
            <div className="text-xs text-gray-400 mt-1">{r.label}</div>
          </div>
        ))}
      </div>

      {/* Recent shifts */}
      <div className="text-sm font-semibold text-gray-400 tracking-wide pb-2">直近のシフト</div>
      {recentShifts.length > 0 ? (
        recentShifts.map((s, i) => {
          const d = new Date(s.date + "T00:00")
          return (
            <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50">
              <span className="text-sm font-medium">{format(d, "M/d(E)", { locale: ja })}</span>
              <span className="text-sm text-gray-500">{s.start_time.slice(0, 5)} → {s.end_time.slice(0, 5)}</span>
            </div>
          )
        })
      ) : (
        <div className="text-center py-8 text-base text-gray-300">この月のシフトはありません</div>
      )}

      <button onClick={signOut} className={`w-full mt-8 py-3.5 border border-gray-200 rounded-lg text-base text-gray-500 font-medium ${tap}`}>
        ログアウト
      </button>
    </div>
  )
}

// ========================================================================
// Submit Page (希望提出)
// ========================================================================
function SubmitPage({ profile, onBack }: { profile: { id: string; store_id: string }; onBack: () => void }) {
  const [periods, setPeriods] = useState<ShiftPeriodInfo[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<ShiftPeriodInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [notes, setNotes] = useState("")
  const [dayEntries, setDayEntries] = useState<Map<number, DayEntry>>(new Map())

  useEffect(() => {
    const fetch = async () => {
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
    fetch()
  }, [profile.store_id])

  const periodDays = useMemo(() => {
    if (!selectedPeriod) return []
    const days: { date: Date; dayNum: number }[] = []
    let d = new Date(selectedPeriod.period_start + "T00:00")
    const end = new Date(selectedPeriod.period_end + "T00:00")
    let dayNum = 1
    while (d <= end) { days.push({ date: new Date(d), dayNum }); d = addDays(d, 1); dayNum++ }
    return days
  }, [selectedPeriod])

  const setDayChoice = (dayNum: number, choice: DayChoice) => {
    setDayEntries(prev => {
      const next = new Map(prev)
      const current = next.get(dayNum)
      if (current?.choice === choice) { next.delete(dayNum) }
      else { next.set(dayNum, { choice, start: current?.start ?? "11:00", end: current?.end ?? "22:00" }) }
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

  const summary = useMemo(() => {
    let available = 0, off = 0, unset = 0, totalHours = 0
    periodDays.forEach(({ dayNum }) => {
      const entry = dayEntries.get(dayNum)
      if (entry?.choice === "available") { available++; totalHours += calcHours(entry.start, entry.end) }
      else if (entry?.choice === "off") off++
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
        if (entry.choice === "off") requested_days_off.push(dayNum)
        else if (entry.choice === "available") available_days.push({ day: dayNum, start: entry.start, end: entry.end })
      })
      const res = await fetch("/api/shift-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_period_id: selectedPeriod.id, staff_id: profile.id,
          submission_type: "希望提出",
          requested_days_off: requested_days_off.length > 0 ? requested_days_off : null,
          available_days: available_days.length > 0 ? available_days : null,
          notes: notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch { alert("提出に失敗しました。もう一度お試しください。") }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>

  if (submitted) {
    return (
      <div className="p-5 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-lg font-bold mb-1">提出完了</h2>
        <p className="text-sm text-gray-500 text-center mb-6">シフト希望を提出しました。</p>
        <button onClick={onBack} className={`px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium ${tap}`}>戻る</button>
      </div>
    )
  }

  if (periods.length === 0) {
    return (
      <div className="p-5 flex flex-col items-center justify-center min-h-[60vh]">
        <button onClick={onBack} className={`self-start text-sm text-purple-600 font-medium mb-6 ${tap}`}>← 戻る</button>
        <CalendarDays className="h-12 w-12 text-gray-200 mb-3" />
        <h2 className="text-base font-bold text-gray-700 mb-1">受付中のシフト期間がありません</h2>
        <p className="text-sm text-gray-400 text-center">管理者がシフト期間を作成すると提出できます。</p>
      </div>
    )
  }

  const TIME_OPTIONS = Array.from({ length: 25 }, (_, i) => {
    const h = Math.floor(i / 2) + 10
    const m = i % 2 === 0 ? "00" : "30"
    return `${h}:${m}`
  })

  return (
    <div className="p-5 space-y-3">
      <button onClick={onBack} className={`text-sm text-purple-600 font-medium ${tap}`}>← 戻る</button>

      {periods.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {periods.map(p => (
            <button key={p.id}
              onClick={() => { setSelectedPeriod(p); setDayEntries(new Map()) }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${tap} ${
                selectedPeriod?.id === p.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {format(new Date(p.period_start + "T00:00"), "M/d")}〜{format(new Date(p.period_end + "T00:00"), "M/d")}
            </button>
          ))}
        </div>
      )}

      {selectedPeriod && (
        <div className="text-center py-1">
          <p className="text-base font-bold">
            {format(new Date(selectedPeriod.period_start + "T00:00"), "M月d日", { locale: ja })}〜
            {format(new Date(selectedPeriod.period_end + "T00:00"), "M月d日", { locale: ja })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">各日の希望を入力してください</p>
        </div>
      )}

      <div className="space-y-2">
        {periodDays.map(({ date, dayNum }) => {
          const dow = date.getDay()
          const entry = dayEntries.get(dayNum)
          const choice = entry?.choice ?? null
          return (
            <div key={dayNum} className={`bg-white rounded-xl border ${
              choice === "available" ? "border-gray-300" : choice === "off" ? "border-gray-200 bg-gray-50" : "border-gray-100"
            }`}>
              <div className="flex items-center px-3 py-2.5 gap-2">
                <div className="w-14 flex-shrink-0">
                  <span className="text-sm font-bold">{format(date, "M/d", { locale: ja })}</span>
                  <span className={`text-xs ml-0.5 ${dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-gray-400"}`}>
                    {format(date, "E", { locale: ja })}
                  </span>
                </div>
                <div className="flex flex-1 bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setDayChoice(dayNum, "available")}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium ${tap} ${
                      choice === "available" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
                    }`}>出勤</button>
                  <button onClick={() => setDayChoice(dayNum, "off")}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium ${tap} ${
                      choice === "off" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
                    }`}>休み</button>
                </div>
              </div>
              {choice === "available" && (
                <div className="px-3 pb-2.5 flex items-center gap-1.5 ml-14">
                  <select value={entry?.start ?? "11:00"} onChange={e => updateTime(dayNum, "start", e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-0 appearance-none text-center">
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-gray-300 text-xs">—</span>
                  <select value={entry?.end ?? "22:00"} onChange={e => updateTime(dayNum, "end", e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-0 appearance-none text-center">
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-xs text-gray-400 tabular-nums ml-1 flex-shrink-0">
                    {formatHours(calcHours(entry?.start ?? "11:00", entry?.end ?? "22:00"))}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-3">
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="備考（連続勤務制限、希望など）" rows={2}
          className="w-full text-sm resize-none focus:outline-none placeholder:text-gray-300" />
      </div>

      <div className="pb-4 space-y-2.5">
        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <span>出勤 <span className="font-bold text-gray-700">{summary.available}</span></span>
          <span>休み <span className="font-bold text-gray-700">{summary.off}</span></span>
          <span>未選択 <span className="font-bold text-gray-700">{summary.unset}</span></span>
          {summary.totalHours > 0 && <span>合計 <span className="font-bold text-gray-700">{formatHours(summary.totalHours)}</span></span>}
        </div>
        <button onClick={handleSubmit}
          disabled={submitting || (summary.available === 0 && summary.off === 0)}
          className={`w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold disabled:opacity-30 flex items-center justify-center gap-2 ${tap}`}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? "提出中..." : "提出する"}
        </button>
      </div>
    </div>
  )
}

// ========================================================================
// Absence Page (欠勤連絡)
// ========================================================================
function AbsencePage({ profile, onBack }: { profile: { id: string; store_id: string }; onBack: () => void }) {
  const [upcomingShifts, setUpcomingShifts] = useState<MyShift[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const today = format(new Date(), "yyyy-MM-dd")
      const twoWeeks = format(addDays(new Date(), 14), "yyyy-MM-dd")
      const { data } = await supabase
        .from("shifts")
        .select("id, date, start_time, end_time, role, status")
        .eq("staff_id", profile.id)
        .gte("date", today).lte("date", twoWeeks)
        .in("status", ["confirmed", "optimized"])
        .order("date").order("start_time")
      setUpcomingShifts((data as MyShift[]) ?? [])
      setLoading(false)
    }
    fetch()
  }, [profile.id])

  const groupedByDate = useMemo(() => {
    const map = new Map<string, MyShift[]>()
    upcomingShifts.forEach(s => { if (!map.has(s.date)) map.set(s.date, []); map.get(s.date)!.push(s) })
    return Array.from(map.entries())
  }, [upcomingShifts])

  const handleSubmit = async () => {
    if (!selectedDate) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/absence-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: profile.id, store_id: profile.store_id, date: selectedDate, reason }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch { alert("欠勤連絡に失敗しました。") }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>

  if (submitted) {
    return (
      <div className="p-5 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold mb-1">欠勤連絡完了</h2>
        <p className="text-sm text-gray-500 text-center mb-2">
          {selectedDate && format(new Date(selectedDate + "T00:00"), "M月d日(E)", { locale: ja })}の欠勤を連絡しました。
        </p>
        <p className="text-xs text-gray-400 text-center mb-6">管理者に通知されました。</p>
        <button onClick={onBack} className={`px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium ${tap}`}>戻る</button>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-4">
      <button onClick={onBack} className={`text-sm text-purple-600 font-medium ${tap}`}>← 戻る</button>

      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">急な欠勤の連絡</p>
            <p className="text-xs text-amber-600 mt-0.5">体調不良などで出勤できない場合はこちらから。</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">欠勤するシフトを選択</h2>
        {groupedByDate.length > 0 ? (
          <div className="space-y-2">
            {groupedByDate.map(([date, dayShifts]) => {
              const isSelected = selectedDate === date
              const isNearToday = dateFnsIsToday(new Date(date + "T00:00"))
              return (
                <button key={date} onClick={() => setSelectedDate(isSelected ? null : date)}
                  className={`w-full text-left p-3 rounded-xl border-2 ${tap} ${
                    isSelected ? "border-amber-400 bg-amber-50" : "border-transparent bg-gray-50"
                  }`}>
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

      {selectedDate && (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">欠勤理由</h2>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="体調不良、家庭の事情など..." rows={3}
            className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <button onClick={handleSubmit} disabled={submitting}
            className={`w-full mt-3 py-3.5 bg-amber-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 ${tap}`}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            {submitting ? "送信中..." : "欠勤を連絡する"}
          </button>
        </div>
      )}
    </div>
  )
}

// ========== Shared ==========
function StatusBadge({ status }: { status: string }) {
  const config = {
    confirmed: { label: "確定", cls: "bg-green-100 text-green-700" },
    optimized: { label: "仮", cls: "bg-orange-100 text-orange-700" },
    draft: { label: "下書き", cls: "bg-gray-100 text-gray-600" },
  }[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" }
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ml-2 ${config.cls}`}>
      {config.label}
    </span>
  )
}
