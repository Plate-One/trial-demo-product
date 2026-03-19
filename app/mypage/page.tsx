"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { format, addDays, startOfWeek, isToday as dateFnsIsToday } from "date-fns"
import { ja } from "date-fns/locale"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

// ========== Helpers ==========
function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  return (eh * 60 + em - sh * 60 - sm) / 60
}

const ROLE_COLORS: Record<string, string> = {
  "キッチン": "#7c5cbf",
  "ホール": "#2a9d8f",
  "バー": "#e07a36",
  "MGR": "#d1477a",
}

const ROLE_BG: Record<string, string> = {
  "キッチン": "bg-purple-50 border-l-purple-500",
  "ホール": "bg-teal-50 border-l-teal-500",
  "バー": "bg-orange-50 border-l-orange-500",
  "MGR": "bg-pink-50 border-l-pink-500",
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

type Tab = "home" | "team" | "news" | "profile"

// ========== Main ==========
export default function MyPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [now, setNow] = useState(new Date())
  const [store, setStore] = useState<StoreInfo | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Fetch store info
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

  return (
    <div className="max-w-[430px] mx-auto min-h-screen flex flex-col bg-white font-sans text-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100 sticky top-0 z-10 bg-white">
        <span className="font-bold text-[15px]">{store?.name ?? "読み込み中..."}</span>
        <span className="text-xs text-gray-400">{timeStr}</span>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto pb-16">
        {activeTab === "home" && (
          <HomeTab profile={profile} now={now} timeStr={timeStr} hourlyRate={hourlyRate} />
        )}
        {activeTab === "team" && <TeamTab profile={profile} />}
        {activeTab === "news" && <NewsTab profile={profile} />}
        {activeTab === "profile" && (
          <ProfileTab profile={profile} hourlyRate={hourlyRate} signOut={signOut} />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex bg-white border-t border-gray-100 z-10">
        {([
          { id: "home" as Tab, label: "シフト" },
          { id: "team" as Tab, label: "全体" },
          { id: "news" as Tab, label: "通知" },
          { id: "profile" as Tab, label: "マイページ" },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2.5 pb-2 text-[11px] font-medium transition-colors ${
              activeTab === t.id ? "text-gray-900 font-bold" : "text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ========================================================================
// Home Tab
// ========================================================================
function HomeTab({
  profile,
  now,
  timeStr,
  hourlyRate,
}: {
  profile: { id: string; store_id: string; role: string; position: string }
  now: Date
  timeStr: string
  hourlyRate: number
}) {
  const [shifts, setShifts] = useState<MyShift[]>([])
  const [loading, setLoading] = useState(true)
  const [clocked, setClocked] = useState(false)
  const [clockedTime, setClockedTime] = useState<string | null>(null)
  const [selectedShift, setSelectedShift] = useState<MyShift | null>(null)
  const [coworkers, setCoworkers] = useState<TeamShiftRow[]>([])

  // Fetch this week's shifts
  const weekStart = useMemo(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 })
  }, [])

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
  [weekStart])

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
        .gte("date", start)
        .lte("date", end)
        .order("date")
        .order("start_time")
      setShifts((data as MyShift[]) ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [profile.id, weekStart])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  // Find today's shift
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const todayShift = shifts.find(s => s.date === todayStr)

  // Weekly stats
  const weekStats = useMemo(() => {
    const workDays = shifts.length
    const totalHours = shifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
    return { workDays, totalHours, estimated: Math.round(totalHours * hourlyRate) }
  }, [shifts, hourlyRate])

  // Map shifts by date for quick lookup
  const shiftByDate = useMemo(() => {
    const m = new Map<string, MyShift>()
    shifts.forEach(s => { if (!m.has(s.date)) m.set(s.date, s) })
    return m
  }, [shifts])

  // Fetch coworkers for selected shift
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
        <button onClick={() => setSelectedShift(null)} className="text-[13px] text-purple-600 font-medium mb-3">
          ← 戻る
        </button>
        <div className="text-xs text-gray-400">
          {format(shiftDate, "M月d日(E)", { locale: ja })}
        </div>
        <div className="text-[26px] font-bold my-1">
          {selectedShift.start_time.slice(0, 5)} → {selectedShift.end_time.slice(0, 5)}
        </div>
        <div className="text-xs text-gray-500 mb-4">
          {selectedShift.role}　{hours.toFixed(1)}h
          <StatusBadge status={selectedShift.status} />
        </div>

        {coworkers.length > 0 && (
          <>
            <div className="text-xs font-semibold text-gray-400 tracking-wide pt-2 pb-2">
              同日スタッフ（{coworkers.length}人）
            </div>
            {coworkers.map((c, i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ROLE_COLORS[c.staff?.role ?? ""] ?? "#999" }}
                />
                <span className="text-[13px] flex-1">{c.staff?.name ?? "—"}</span>
                <span className="text-[11px] text-gray-400">
                  {c.start_time.slice(0, 5)}–{c.end_time.slice(0, 5)}
                </span>
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
          <span className="text-xs text-gray-400">
            {now.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
          </span>
          <span className="text-xs text-gray-300">{timeStr}</span>
        </div>
        {todayShift ? (
          <>
            <div className="text-[28px] font-bold tracking-tight">
              {todayShift.start_time.slice(0, 5)} → {todayShift.end_time.slice(0, 5)}
            </div>
            <div className="text-xs text-gray-500 mb-3.5">{todayShift.role}</div>
            <button
              onClick={() => { setClocked(!clocked); setClockedTime(timeStr) }}
              className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                clocked
                  ? "bg-white border border-gray-200 text-gray-900"
                  : "bg-gray-900 text-white"
              }`}
            >
              {clocked ? "退勤する" : "出勤する"}
            </button>
            {clocked && clockedTime && (
              <div className="text-center text-[11px] text-gray-400 mt-1.5">
                {clockedTime} 出勤済み
              </div>
            )}
          </>
        ) : (
          <div className="text-base text-gray-300 font-medium py-2">お休み</div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center py-3 mb-1">
        <div className="flex-1 text-center">
          <span className="text-base font-bold">{weekStats.workDays}</span>
          <span className="text-[10px] text-gray-400 ml-0.5">日</span>
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex-1 text-center">
          <span className="text-base font-bold">{weekStats.totalHours.toFixed(1)}</span>
          <span className="text-[10px] text-gray-400 ml-0.5">時間</span>
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex-1 text-center">
          <span className="text-base font-bold">¥{weekStats.estimated.toLocaleString()}</span>
          <span className="text-[10px] text-gray-400 ml-0.5">見込み</span>
        </div>
      </div>

      {/* Week List */}
      <div className="text-xs font-semibold text-gray-400 tracking-wide py-3 pb-2">今週のシフト</div>
      {weekDays.map((day, i) => {
        const dateStr = format(day, "yyyy-MM-dd")
        const shift = shiftByDate.get(dateStr)
        const isToday = dateFnsIsToday(day)
        const isOff = !shift

        return (
          <div
            key={i}
            onClick={() => shift && setSelectedShift(shift)}
            className={`flex items-center gap-3 py-2.5 border-b border-gray-50 ${
              isOff ? "opacity-40" : "cursor-pointer"
            } ${isToday ? "border-b-purple-100" : ""}`}
          >
            {/* Day cell */}
            <div className={`w-10 h-11 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-center leading-tight ${
              isToday ? "bg-gray-900 text-white" : "bg-gray-100"
            }`}>
              <span className="text-[10px]">{format(day, "E", { locale: ja })}</span>
              <span className="text-base font-bold">{day.getDate()}</span>
            </div>

            {isOff ? (
              <span className="text-[13px] text-gray-400 font-medium">OFF</span>
            ) : (
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                  <span className="text-[11px] text-gray-400 font-normal ml-1.5">
                    {calcHours(shift.start_time, shift.end_time).toFixed(1)}h
                  </span>
                </div>
                <div className="text-[11px] font-medium mt-px" style={{ color: ROLE_COLORS[shift.role] ?? "#999" }}>
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
    // Index of today in the week (0=Mon)
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1
  })
  const [detailShift, setDetailShift] = useState<TeamShiftRow | null>(null)

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), [])
  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
  [weekStart])

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

  useEffect(() => { fetchTeam() }, [fetchTeam])

  // All unique staff
  const allStaff = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string }>()
    teamShifts.forEach(s => {
      if (s.staff?.name && !map.has(s.staff_id)) {
        map.set(s.staff_id, { id: s.staff_id, name: s.staff.name, role: s.staff.role })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [teamShifts])

  const filteredStaff = useMemo(() =>
    roleFilter === "all" ? allStaff : allStaff.filter(s => s.role === roleFilter),
  [allStaff, roleFilter])

  // Shift lookup
  const shiftMap = useMemo(() => {
    const m = new Map<string, TeamShiftRow[]>()
    teamShifts.forEach(s => {
      const key = `${s.staff_id}_${s.date}`
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(s)
    })
    return m
  }, [teamShifts])

  // Unique roles present
  const roles = useMemo(() => {
    const set = new Set<string>()
    allStaff.forEach(s => set.add(s.role))
    return Array.from(set)
  }, [allStaff])

  // Day view data
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
      <div className="text-[17px] font-bold mb-3">全体シフト</div>

      {/* View toggle + Role filter */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {(["day", "week"] as const).map(v => (
          <button
            key={v}
            onClick={() => setViewMode(v)}
            className={`px-2.5 py-1 border rounded-full text-[10px] font-medium transition-colors ${
              viewMode === v
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-500 border-gray-200"
            }`}
          >
            {v === "day" ? "日別" : "週間"}
          </button>
        ))}
        <div className="flex-1" />
        {["all", ...roles].map(f => (
          <button
            key={f}
            onClick={() => setRoleFilter(f)}
            className={`px-2.5 py-1 border rounded-full text-[10px] font-medium transition-colors ${
              roleFilter === f
                ? "text-white border-transparent"
                : "bg-white text-gray-500 border-gray-200"
            }`}
            style={roleFilter === f ? { backgroundColor: ROLE_COLORS[f] ?? "#222", borderColor: ROLE_COLORS[f] ?? "#222" } : {}}
          >
            {f === "all" ? "全" : f.slice(0, 2)}
          </button>
        ))}
      </div>

      {/* Day selector */}
      <div className="flex gap-0.5 mb-3">
        {weekDays.map((d, i) => {
          const isToday = dateFnsIsToday(d)
          const dayCount = teamShifts.filter(s => s.date === format(d, "yyyy-MM-dd")).length
          return (
            <div
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`flex-1 text-center py-1.5 rounded-lg cursor-pointer flex flex-col items-center gap-px ${
                selectedDay === i
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50"
              } ${isToday && selectedDay !== i ? "font-bold" : ""}`}
            >
              <span className="text-[10px] opacity-50">{format(d, "E", { locale: ja })}</span>
              <span className={`text-[15px] ${selectedDay === i ? "font-bold" : "font-medium"}`}>{d.getDate()}</span>
              <span className="text-[9px] opacity-40">{dayCount}</span>
            </div>
          )
        })}
      </div>

      {/* Day View */}
      {viewMode === "day" && (
        <div>
          <div className="text-xs text-gray-400 mb-2">
            {format(weekDays[selectedDay], "M月d日(E)", { locale: ja })} — {dayShifts.length}人出勤
          </div>
          {dayShifts.map((sh, i) => {
            const isMe = sh.staff_id === profile.id
            return (
              <div
                key={i}
                onClick={() => setDetailShift(detailShift === sh ? null : sh)}
                className={`flex items-center gap-2 py-2.5 px-2 border-b border-gray-50 rounded-md cursor-pointer ${
                  isMe ? "bg-purple-50/50" : ""
                }`}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ROLE_COLORS[sh.staff?.role ?? ""] ?? "#999" }}
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-[13px] ${isMe ? "font-bold" : "font-medium"}`}>
                    {sh.staff?.name ?? "—"}
                    {isMe && <span className="text-[9px] text-purple-600 ml-1">自分</span>}
                  </div>
                  <div className="text-[11px] text-gray-400">{sh.staff?.role}</div>
                </div>
                <div className="text-[13px] font-semibold text-gray-600 whitespace-nowrap">
                  {sh.start_time.slice(0, 5)}–{sh.end_time.slice(0, 5)}
                </div>
              </div>
            )
          })}
          {dayShifts.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-300">この日のシフトはありません</div>
          )}
        </div>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <div className="relative">
          {/* Frozen left column */}
          <div className="absolute left-0 top-0 w-[90px] z-[3] bg-white">
            <div className="h-8 flex items-center pl-1 border-b border-gray-200">
              <span className="text-[9px] text-gray-300">名前</span>
            </div>
            {filteredStaff.map(st => {
              const isMe = st.id === profile.id
              return (
                <div
                  key={st.id}
                  className={`h-9 flex items-center gap-1 pl-1 border-b border-gray-50 overflow-hidden ${
                    isMe ? "bg-purple-50/50" : ""
                  }`}
                >
                  <div
                    className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                    style={{ backgroundColor: ROLE_COLORS[st.role] ?? "#999" }}
                  />
                  <span className={`text-[10px] truncate ${
                    isMe ? "font-bold text-purple-700" : "text-gray-700"
                  }`}>
                    {st.name}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Scrollable area */}
          <div className="ml-[90px] overflow-x-auto">
            <div style={{ minWidth: `${weekDays.length * 60}px` }}>
              {/* Header */}
              <div className="flex h-8 border-b border-gray-200 items-center">
                {weekDays.map((d, i) => {
                  const isToday = dateFnsIsToday(d)
                  return (
                    <div
                      key={i}
                      className={`w-[60px] flex-shrink-0 text-center text-[11px] ${
                        isToday ? "text-gray-900 font-bold" : "text-gray-400"
                      }`}
                    >
                      {format(d, "E", { locale: ja })} {d.getDate()}
                    </div>
                  )
                })}
              </div>

              {/* Rows */}
              {filteredStaff.map(st => {
                const isMe = st.id === profile.id
                return (
                  <div
                    key={st.id}
                    className={`flex h-9 border-b border-gray-50 ${isMe ? "bg-purple-50/50" : ""}`}
                  >
                    {weekDays.map((d, di) => {
                      const dateStr = format(d, "yyyy-MM-dd")
                      const isToday = dateFnsIsToday(d)
                      const dayShifts = shiftMap.get(`${st.id}_${dateStr}`) ?? []
                      const sh = dayShifts[0]
                      return (
                        <div
                          key={di}
                          className={`w-[60px] flex-shrink-0 flex items-center justify-center ${
                            isToday ? (isMe ? "bg-purple-50/30" : "bg-gray-50/50") : ""
                          }`}
                        >
                          {sh ? (
                            <div
                              className="py-0.5 px-1 rounded text-center leading-tight w-[90%] border-l-2 cursor-pointer"
                              style={{
                                backgroundColor: (ROLE_COLORS[st.role] ?? "#999") + (isMe ? "18" : "10"),
                                borderLeftColor: ROLE_COLORS[st.role] ?? "#999",
                              }}
                              onClick={() => setDetailShift(sh)}
                            >
                              <div className={`text-[9px] font-semibold ${isMe ? "text-gray-800" : "text-gray-500"}`}>
                                {sh.start_time.slice(0, 5)}
                              </div>
                              <div className={`text-[9px] font-semibold ${isMe ? "text-gray-800" : "text-gray-500"}`}>
                                {sh.end_time.slice(0, 5)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-200">–</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detail popup */}
          {detailShift && (
            <div className="bg-white border border-gray-200 rounded-xl p-3 mt-2.5 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-semibold">
                    {detailShift.staff?.name ?? "—"}
                    <span className="text-[11px] text-gray-400 font-normal ml-1.5">{detailShift.staff?.role}</span>
                  </div>
                  <div className="text-[13px] mt-0.5">
                    {format(new Date(detailShift.date + "T00:00"), "M月d日(E)", { locale: ja })}{" "}
                    {detailShift.start_time.slice(0, 5)} → {detailShift.end_time.slice(0, 5)}
                    <span className="text-gray-400 ml-1.5">
                      {calcHours(detailShift.start_time, detailShift.end_time).toFixed(1)}h
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDetailShift(null)}
                  className="text-base text-gray-300 p-1 hover:text-gray-500"
                >
                  ✕
                </button>
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
    // Try to fetch from announcements table, fallback to static data
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
            id: n.id,
            date: format(new Date(n.created_at), "M/d"),
            title: n.title,
            body: n.body,
            pin: n.is_pinned,
          })))
        } else {
          // Fallback: show placeholder
          setNews([
            { id: 1, date: format(new Date(), "M/d"), title: "お知らせはまだありません", body: "管理者からのお知らせがここに表示されます。" },
          ])
        }
      } catch {
        setNews([
          { id: 1, date: format(new Date(), "M/d"), title: "お知らせはまだありません", body: "管理者からのお知らせがここに表示されます。" },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [profile.store_id])

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
  }

  return (
    <div className="px-5 py-4">
      <div className="text-xs font-semibold text-gray-400 tracking-wide pb-2">お知らせ</div>
      {news.map(n => (
        <div
          key={n.id}
          className="py-3 border-b border-gray-50 cursor-pointer"
          onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            {n.pin && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex-shrink-0">
                重要
              </span>
            )}
            <span className="text-[11px] text-gray-400">{n.date}</span>
          </div>
          <div className="text-[13px] font-semibold">{n.title}</div>
          {expandedId === n.id && (
            <div className="text-xs text-gray-500 mt-2 leading-relaxed">{n.body}</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ========================================================================
// Profile Tab
// ========================================================================
function ProfileTab({
  profile,
  hourlyRate,
  signOut,
}: {
  profile: { id: string; store_id: string; name: string; role: string; position: string }
  hourlyRate: number
  signOut: () => void
}) {
  const [monthlyShifts, setMonthlyShifts] = useState<MyShift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMonthly = async () => {
      const supabase = createClient()
      const now = new Date()
      const start = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd")
      const end = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd")
      const { data } = await supabase
        .from("shifts")
        .select("id, date, start_time, end_time, role, status")
        .eq("staff_id", profile.id)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false })
        .order("start_time")
      setMonthlyShifts((data as MyShift[]) ?? [])
      setLoading(false)
    }
    fetchMonthly()
  }, [profile.id])

  const stats = useMemo(() => {
    const totalHours = monthlyShifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
    return {
      days: monthlyShifts.length,
      hours: totalHours,
      estimated: Math.round(totalHours * hourlyRate),
    }
  }, [monthlyShifts, hourlyRate])

  // Recent shifts (last 5)
  const recentShifts = monthlyShifts.slice(0, 5)

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
  }

  return (
    <div className="px-5 py-4">
      {/* Profile header */}
      <div className="text-center py-6 pb-5">
        <div className="text-lg font-bold">{profile.name}</div>
        <div className="text-xs text-gray-400 mt-1">
          {profile.role}　{profile.position}　時給 ¥{hourlyRate.toLocaleString()}
        </div>
      </div>

      {/* Monthly stats */}
      <div className="text-xs font-semibold text-gray-400 tracking-wide pb-2">今月の実績</div>
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {[
          { value: `${stats.days}日`, label: "出勤" },
          { value: `${stats.hours.toFixed(1)}h`, label: "実働" },
          { value: `¥${stats.estimated.toLocaleString()}`, label: "月給見込" },
        ].map((r, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3.5">
            <div className="text-lg font-bold">{r.value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{r.label}</div>
          </div>
        ))}
      </div>

      {/* Recent shifts */}
      <div className="text-xs font-semibold text-gray-400 tracking-wide pb-2">直近のシフト</div>
      {recentShifts.length > 0 ? (
        recentShifts.map((s, i) => {
          const d = new Date(s.date + "T00:00")
          return (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-gray-50">
              <span className="text-[13px] font-medium">
                {format(d, "M/d(E)", { locale: ja })}
              </span>
              <span className="text-xs text-gray-500">
                {s.start_time.slice(0, 5)} → {s.end_time.slice(0, 5)}
              </span>
            </div>
          )
        })
      ) : (
        <div className="text-center py-8 text-sm text-gray-300">今月のシフトはありません</div>
      )}

      {/* Logout */}
      <button
        onClick={signOut}
        className="w-full mt-8 py-3 border border-gray-200 rounded-lg text-sm text-gray-500 font-medium"
      >
        ログアウト
      </button>
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
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 ${config.cls}`}>
      {config.label}
    </span>
  )
}
