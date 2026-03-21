"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Bell, Pin, CalendarDays, AlertCircle, Info, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "shift_confirmed" | "shift_changed" | "announcement" | "reminder"
  title: string
  body: string
  date: string
  read: boolean
  pinned?: boolean
}

// Generate notifications from shift data
function useNotifications(profileId: string | undefined, storeId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profileId || !storeId) return

    const fetchNotifications = async () => {
      setLoading(true)
      const supabase = createClient()
      const today = format(new Date(), "yyyy-MM-dd")

      // Fetch recent confirmed shifts as notifications
      const { data: confirmedShifts } = await supabase
        .from("shifts")
        .select("id, date, start_time, end_time, status")
        .eq("staff_id", profileId)
        .eq("status", "confirmed")
        .gte("date", today)
        .order("date")
        .limit(5)

      // Fetch recent shift periods status
      const { data: periods } = await supabase
        .from("shift_periods")
        .select("id, period_start, period_end, status")
        .eq("store_id", storeId)
        .order("period_start", { ascending: false })
        .limit(3)

      const notifs: Notification[] = []

      // Shift period announcements
      periods?.forEach(p => {
        if (p.status === "collecting") {
          notifs.push({
            id: `period-${p.id}`,
            type: "reminder",
            title: "希望シフト受付中",
            body: `${format(new Date(p.period_start + "T00:00"), "M月d日", { locale: ja })}〜${format(new Date(p.period_end + "T00:00"), "M月d日", { locale: ja })}のシフト希望を受け付けています。早めに提出してください。`,
            date: new Date().toISOString(),
            read: false,
            pinned: true,
          })
        }
        if (p.status === "confirmed") {
          notifs.push({
            id: `confirmed-${p.id}`,
            type: "shift_confirmed",
            title: "シフトが確定しました",
            body: `${format(new Date(p.period_start + "T00:00"), "M月d日", { locale: ja })}〜${format(new Date(p.period_end + "T00:00"), "M月d日", { locale: ja })}のシフトが確定しました。シフトカレンダーでご確認ください。`,
            date: p.period_start + "T00:00:00",
            read: false,
          })
        }
      })

      // Upcoming shifts
      if (confirmedShifts && confirmedShifts.length > 0) {
        const nextShift = confirmedShifts[0]
        notifs.push({
          id: `next-${nextShift.id}`,
          type: "reminder",
          title: "次のシフト",
          body: `${format(new Date(nextShift.date + "T00:00"), "M月d日(E)", { locale: ja })} ${nextShift.start_time.slice(0, 5)}〜${nextShift.end_time.slice(0, 5)}`,
          date: new Date().toISOString(),
          read: false,
        })
      }

      // Static announcements
      notifs.push({
        id: "welcome",
        type: "announcement",
        title: "従業員アプリへようこそ",
        body: "シフト確認、希望提出、勤怠履歴の確認がアプリからできるようになりました。下部のナビゲーションからご利用ください。",
        date: new Date().toISOString(),
        read: true,
        pinned: true,
      })

      setNotifications(notifs)
      setLoading(false)
    }

    fetchNotifications()
  }, [profileId, storeId])

  return { notifications, loading }
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  shift_confirmed: { icon: CalendarDays, color: "text-green-600", bg: "bg-green-100" },
  shift_changed: { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100" },
  announcement: { icon: Info, color: "text-blue-600", bg: "bg-blue-100" },
  reminder: { icon: Bell, color: "text-purple-600", bg: "bg-purple-100" },
}

export default function NotificationsPage() {
  const { profile } = useAuth()
  const { notifications, loading } = useNotifications(profile?.id, profile?.store_id)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  const markRead = (id: string) => {
    setReadIds(prev => new Set([...prev, id]))
  }

  if (!profile) return null

  const pinnedNotifs = notifications.filter(n => n.pinned)
  const regularNotifs = notifications.filter(n => !n.pinned)

  return (
    <div>
      <header className="bg-white px-5 py-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">お知らせ</h1>
      </header>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <Bell className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">お知らせはありません</p>
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinnedNotifs.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Pin className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-bold text-gray-500">固定</span>
                </div>
                <div className="space-y-2">
                  {pinnedNotifs.map(n => {
                    const config = typeConfig[n.type] ?? typeConfig.announcement
                    const Icon = config.icon
                    const isRead = n.read || readIds.has(n.id)
                    return (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={cn(
                          "w-full text-left bg-white rounded-xl p-4 shadow-sm border transition-colors",
                          isRead ? "border-gray-100" : "border-blue-200 bg-blue-50/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">{n.title}</span>
                              {!isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{n.body}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Regular */}
            {regularNotifs.length > 0 && (
              <div>
                <span className="text-xs font-bold text-gray-500 mb-2 block">通知</span>
                <div className="space-y-2">
                  {regularNotifs.map(n => {
                    const config = typeConfig[n.type] ?? typeConfig.announcement
                    const Icon = config.icon
                    const isRead = n.read || readIds.has(n.id)
                    return (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={cn(
                          "w-full text-left bg-white rounded-xl p-4 shadow-sm border transition-colors",
                          isRead ? "border-gray-100" : "border-blue-200 bg-blue-50/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">{n.title}</span>
                              {!isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{n.body}</p>
                            <p className="text-[10px] text-gray-300 mt-1">
                              {format(new Date(n.date), "M/d HH:mm", { locale: ja })}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
