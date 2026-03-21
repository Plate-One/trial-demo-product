"use client"

import { useState, useEffect, useMemo } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ja } from "date-fns/locale"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import {
  UserCircle, MapPin, Briefcase, Clock, LogOut,
  ChevronRight, Shield, Phone, Mail, CalendarDays,
  Loader2, AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface StoreInfo {
  name: string
  hourly_wage_hall: number
  hourly_wage_kitchen: number
}

interface StaffDetail {
  id: string
  name: string
  role: string
  position: string
  employment_type: string
  status: string
  phone?: string
  email?: string
  created_at: string
}

interface MonthlyStats {
  workDays: number
  totalHours: number
  estimatedPay: number
}

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  return (eh * 60 + em - sh * 60 - sm) / 60
}

const roleLabels: Record<string, string> = {
  "店長": "店長",
  "マネージャー": "マネージャー",
  "チーフ": "チーフ",
  "スタッフ": "スタッフ",
}

const positionLabels: Record<string, string> = {
  "ホール": "ホール",
  "キッチン": "キッチン",
  "両方": "ホール・キッチン",
}

const employmentLabels: Record<string, string> = {
  "正社員": "正社員",
  "パート": "パート",
  "アルバイト": "アルバイト",
}

export default function ProfilePage() {
  const { profile, signOut } = useAuth()
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [staffDetail, setStaffDetail] = useState<StaffDetail | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAbsenceForm, setShowAbsenceForm] = useState(false)
  const [absenceDate, setAbsenceDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [absenceReason, setAbsenceReason] = useState("")
  const [absenceSubmitting, setAbsenceSubmitting] = useState(false)
  const [absenceSubmitted, setAbsenceSubmitted] = useState(false)

  useEffect(() => {
    if (!profile?.id || !profile?.store_id) return

    const fetchData = async () => {
      setLoading(true)
      const supabase = createClient()

      // Fetch store info
      const { data: storeData } = await supabase
        .from("stores")
        .select("name, hourly_wage_hall, hourly_wage_kitchen")
        .eq("id", profile.store_id)
        .maybeSingle()
      if (storeData) setStore(storeData)

      // Fetch staff detail
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, name, role, position, employment_type, status, created_at")
        .eq("id", profile.id)
        .maybeSingle()
      if (staffData) setStaffDetail(staffData as StaffDetail)

      // Fetch this month's stats
      const monthStart = startOfMonth(new Date())
      const monthEnd = endOfMonth(new Date())
      const { data: shifts } = await supabase
        .from("shifts")
        .select("start_time, end_time")
        .eq("staff_id", profile.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"))

      if (shifts) {
        const totalHours = shifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
        const hourlyRate = profile.position === "ホール"
          ? (storeData?.hourly_wage_hall ?? 1150)
          : (storeData?.hourly_wage_kitchen ?? 1200)
        setMonthlyStats({
          workDays: shifts.length,
          totalHours,
          estimatedPay: Math.round(totalHours * hourlyRate),
        })
      }

      setLoading(false)
    }

    fetchData()
  }, [profile?.id, profile?.store_id, profile?.position])

  const handleAbsenceSubmit = async () => {
    if (!profile) return
    setAbsenceSubmitting(true)
    try {
      const res = await fetch("/api/absence-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: profile.id,
          store_id: profile.store_id,
          date: absenceDate,
          reason: absenceReason,
        }),
      })
      if (res.ok) {
        setAbsenceSubmitted(true)
        setAbsenceReason("")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setAbsenceSubmitting(false)
    }
  }

  if (!profile) return null

  return (
    <div>
      <header className="bg-white px-5 py-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">マイページ</h1>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="px-5 py-4">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{profile.name?.charAt(0) ?? "?"}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{staffDetail?.name ?? profile.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium",
                    profile.position === "ホール" ? "bg-teal-100 text-teal-700" :
                    profile.position === "キッチン" ? "bg-purple-100 text-purple-700" :
                    "bg-blue-100 text-blue-700"
                  )}>
                    {positionLabels[profile.position] ?? profile.position}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {roleLabels[profile.role] ?? profile.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{store?.name ?? "未設定"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{employmentLabels[staffDetail?.employment_type ?? ""] ?? "未設定"}</span>
              </div>
              {staffDetail?.created_at && (
                <div className="flex items-center gap-3 text-sm">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">入社日: {format(new Date(staffDetail.created_at), "yyyy年M月d日", { locale: ja })}</span>
                </div>
              )}
            </div>
          </div>

          {/* This month stats */}
          {monthlyStats && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 mb-4">
              <h3 className="text-xs font-bold text-blue-700 mb-3">今月の実績 ({format(new Date(), "M月", { locale: ja })})</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-700">{monthlyStats.workDays}</p>
                  <p className="text-[10px] text-blue-500">出勤日数</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-700">{monthlyStats.totalHours.toFixed(1)}</p>
                  <p className="text-[10px] text-blue-500">勤務時間</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-700">¥{monthlyStats.estimatedPay.toLocaleString()}</p>
                  <p className="text-[10px] text-blue-500">見込み給与</p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <Link href="/employee/attendance" className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">勤怠履歴</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>
            <Link href="/employee/shifts" className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">シフトカレンダー</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>
            <Link href="/employee/requests" className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">希望シフト提出</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>
            <button
              onClick={() => { setShowAbsenceForm(!showAbsenceForm); setAbsenceSubmitted(false) }}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">欠勤連絡</span>
              </div>
              <ChevronRight className={cn("h-4 w-4 text-gray-300 transition-transform", showAbsenceForm && "rotate-90")} />
            </button>
          </div>

          {/* Absence Form */}
          {showAbsenceForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">欠勤連絡</h3>
              {absenceSubmitted ? (
                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                  <p className="text-sm font-medium text-green-700">連絡が送信されました</p>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">日付</label>
                    <input
                      type="date"
                      value={absenceDate}
                      onChange={(e) => setAbsenceDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">理由</label>
                    <textarea
                      value={absenceReason}
                      onChange={(e) => setAbsenceReason(e.target.value)}
                      placeholder="欠勤の理由を入力..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                    />
                  </div>
                  <button
                    onClick={handleAbsenceSubmit}
                    disabled={absenceSubmitting || !absenceReason.trim()}
                    className="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold disabled:bg-gray-300 active:scale-[0.98] transition-transform"
                  >
                    {absenceSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "欠勤連絡を送信"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Logout */}
          <button
            onClick={signOut}
            className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-center gap-2 text-red-500 text-sm font-medium active:bg-red-50 transition-colors mb-8"
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </div>
      )}
    </div>
  )
}
