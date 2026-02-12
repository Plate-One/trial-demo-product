"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { format, addDays, startOfWeek } from "date-fns"
import { ja } from "date-fns/locale"
import {
  Sparkles, CheckCircle2, Clock, AlertTriangle, Users, ArrowRight,
  ChevronRight, CalendarDays, UserCheck, HandHelping, Building2,
  TrendingUp, FileText, Send,
} from "lucide-react"
import Link from "next/link"

// ========== 型定義 ==========
interface StaffPreference {
  id: string
  name: string
  position: "ホール" | "キッチン" | "両方"
  employmentType: "正社員" | "パート" | "アルバイト"
  availability: string
  weeklyPreferences: {
    [dayIndex: number]: { start: string; end: string } | null // null = 休み希望
  }
}

interface OptimizedAssignment {
  staffId: string
  staffName: string
  role: "ホール" | "キッチン"
  dayIndex: number
  start: string
  end: string
  status: "matched" | "modified" | "unassigned"
  originalStart?: string
  originalEnd?: string
  modificationReason?: string
}

interface HelpNeededSlot {
  dayIndex: number
  hour: number
  role: "ホール" | "キッチン"
  shortage: number
}

interface OptimizationStep {
  title: string
  description: string
  detail: string
  icon: "search" | "check" | "alert" | "sparkles"
}

// ========== 定数 ==========
const HOURS = Array.from({ length: 14 }, (_, i) => i + 10) // 10:00〜23:00

const DEMAND_PER_HOUR: Record<number, { hall: number; kitchen: number }> = {
  10: { hall: 2, kitchen: 2 }, 11: { hall: 3, kitchen: 2 }, 12: { hall: 4, kitchen: 3 },
  13: { hall: 4, kitchen: 3 }, 14: { hall: 2, kitchen: 2 }, 15: { hall: 2, kitchen: 1 },
  16: { hall: 2, kitchen: 1 }, 17: { hall: 3, kitchen: 2 }, 18: { hall: 4, kitchen: 3 },
  19: { hall: 5, kitchen: 4 }, 20: { hall: 4, kitchen: 3 }, 21: { hall: 3, kitchen: 2 },
  22: { hall: 2, kitchen: 1 }, 23: { hall: 1, kitchen: 1 },
}

const WEEKEND_DEMAND_PER_HOUR: Record<number, { hall: number; kitchen: number }> = {
  10: { hall: 3, kitchen: 2 }, 11: { hall: 4, kitchen: 3 }, 12: { hall: 5, kitchen: 4 },
  13: { hall: 5, kitchen: 4 }, 14: { hall: 3, kitchen: 2 }, 15: { hall: 3, kitchen: 2 },
  16: { hall: 3, kitchen: 2 }, 17: { hall: 4, kitchen: 3 }, 18: { hall: 5, kitchen: 4 },
  19: { hall: 6, kitchen: 5 }, 20: { hall: 5, kitchen: 4 }, 21: { hall: 4, kitchen: 3 },
  22: { hall: 3, kitchen: 2 }, 23: { hall: 2, kitchen: 1 },
}

const getDemand = (dayIndex: number, hour: number) => {
  const isWeekend = dayIndex >= 5 // Sat=5, Sun=6
  return isWeekend ? WEEKEND_DEMAND_PER_HOUR[hour] : DEMAND_PER_HOUR[hour]
}

// ========== モックデータ ==========
const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"]

const staffPreferences: StaffPreference[] = [
  {
    id: "1", name: "佐藤 一郎", position: "両方", employmentType: "正社員", availability: "フルタイム",
    weeklyPreferences: {
      0: { start: "9:00", end: "18:00" }, 1: { start: "9:00", end: "18:00" },
      2: { start: "9:00", end: "18:00" }, 3: { start: "9:00", end: "18:00" },
      4: { start: "9:00", end: "18:00" }, 5: null, 6: null,
    },
  },
  {
    id: "2", name: "山田 太郎", position: "ホール", employmentType: "正社員", availability: "フルタイム",
    weeklyPreferences: {
      0: { start: "10:00", end: "19:00" }, 1: { start: "10:00", end: "19:00" },
      2: { start: "10:00", end: "19:00" }, 3: { start: "10:00", end: "19:00" },
      4: { start: "10:00", end: "19:00" }, 5: { start: "10:00", end: "19:00" }, 6: null,
    },
  },
  {
    id: "3", name: "田中 花子", position: "ホール", employmentType: "パート", availability: "午前中心（週3日）",
    weeklyPreferences: {
      0: { start: "10:00", end: "15:00" }, 1: null, 2: { start: "10:00", end: "15:00" },
      3: null, 4: { start: "10:00", end: "15:00" }, 5: null, 6: null,
    },
  },
  {
    id: "4", name: "鈴木 健太", position: "キッチン", employmentType: "アルバイト", availability: "平日メイン",
    weeklyPreferences: {
      0: { start: "11:00", end: "20:00" }, 1: { start: "11:00", end: "20:00" },
      2: { start: "11:00", end: "20:00" }, 3: { start: "11:00", end: "20:00" },
      4: { start: "11:00", end: "20:00" }, 5: null, 6: null,
    },
  },
  {
    id: "5", name: "伊藤 美咲", position: "ホール", employmentType: "アルバイト", availability: "夕方〜夜（学生）",
    weeklyPreferences: {
      0: null, 1: { start: "17:00", end: "22:00" }, 2: null,
      3: { start: "17:00", end: "22:00" }, 4: null, 5: { start: "17:00", end: "22:00" }, 6: null,
    },
  },
  {
    id: "6", name: "渡辺 直樹", position: "キッチン", employmentType: "正社員", availability: "フルタイム",
    weeklyPreferences: {
      0: { start: "8:00", end: "17:00" }, 1: { start: "8:00", end: "17:00" },
      2: { start: "8:00", end: "17:00" }, 3: { start: "8:00", end: "17:00" },
      4: { start: "8:00", end: "17:00" }, 5: null, 6: null,
    },
  },
  {
    id: "7", name: "高橋 美咲", position: "キッチン", employmentType: "パート", availability: "週3日希望",
    weeklyPreferences: {
      0: { start: "10:00", end: "16:00" }, 1: { start: "10:00", end: "16:00" },
      2: null, 3: { start: "10:00", end: "16:00" }, 4: null, 5: null, 6: null,
    },
  },
  {
    id: "8", name: "中村 翔太", position: "両方", employmentType: "アルバイト", availability: "水〜日",
    weeklyPreferences: {
      0: null, 1: null, 2: { start: "12:00", end: "21:00" },
      3: { start: "12:00", end: "21:00" }, 4: { start: "12:00", end: "21:00" },
      5: { start: "12:00", end: "21:00" }, 6: { start: "12:00", end: "21:00" },
    },
  },
  {
    id: "9", name: "小林 陽子", position: "ホール", employmentType: "アルバイト", availability: "金土日・夕方〜",
    weeklyPreferences: {
      0: null, 1: null, 2: null, 3: null,
      4: { start: "17:00", end: "23:00" }, 5: { start: "17:00", end: "23:00" },
      6: { start: "17:00", end: "23:00" },
    },
  },
  {
    id: "10", name: "加藤 健一", position: "キッチン", employmentType: "パート", availability: "平日フル",
    weeklyPreferences: {
      0: { start: "9:00", end: "18:00" }, 1: { start: "9:00", end: "18:00" },
      2: { start: "9:00", end: "18:00" }, 3: { start: "9:00", end: "18:00" },
      4: { start: "9:00", end: "18:00" }, 5: null, 6: null,
    },
  },
  {
    id: "11", name: "木村 達也", position: "キッチン", employmentType: "アルバイト", availability: "土日のみ",
    weeklyPreferences: {
      0: null, 1: null, 2: null, 3: null,
      4: null, 5: { start: "10:00", end: "22:00" }, 6: { start: "10:00", end: "22:00" },
    },
  },
  {
    id: "12", name: "斎藤 美穂", position: "ホール", employmentType: "アルバイト", availability: "月〜水",
    weeklyPreferences: {
      0: { start: "11:00", end: "19:00" }, 1: { start: "11:00", end: "19:00" },
      2: { start: "11:00", end: "19:00" }, 3: null, 4: null, 5: null, 6: null,
    },
  },
]

// ========== 最適化ロジック ==========
function runOptimization(preferences: StaffPreference[]): {
  assignments: OptimizedAssignment[]
  helpNeeded: HelpNeededSlot[]
  steps: OptimizationStep[]
} {
  const assignments: OptimizedAssignment[] = []
  const steps: OptimizationStep[] = []

  // Step 1: 希望シフトをそのまま割り当て
  preferences.forEach((staff) => {
    for (let day = 0; day < 7; day++) {
      const pref = staff.weeklyPreferences[day]
      if (!pref) continue

      const role: "ホール" | "キッチン" = staff.position === "キッチン" ? "キッチン" : "ホール"
      assignments.push({
        staffId: staff.id,
        staffName: staff.name,
        role,
        dayIndex: day,
        start: pref.start,
        end: pref.end,
        status: "matched",
      })
    }
  })

  steps.push({
    title: "希望シフトの読み込み",
    description: `${preferences.length}名の従業員から希望シフトを読み込みました`,
    detail: `合計 ${assignments.length} 件のシフト希望を処理`,
    icon: "search",
  })

  // Step 2: 需要に対する過不足を計算
  let totalShortage = 0
  let totalExcess = 0
  for (let day = 0; day < 7; day++) {
    for (const hour of HOURS) {
      const demand = getDemand(day, hour)
      const hallCount = assignments.filter(
        (a) => a.dayIndex === day && a.role === "ホール" &&
        parseInt(a.start) <= hour && parseInt(a.end) > hour
      ).length
      const kitchenCount = assignments.filter(
        (a) => a.dayIndex === day && a.role === "キッチン" &&
        parseInt(a.start) <= hour && parseInt(a.end) > hour
      ).length
      if (hallCount < demand.hall) totalShortage += demand.hall - hallCount
      if (kitchenCount < demand.kitchen) totalShortage += demand.kitchen - kitchenCount
      if (hallCount > demand.hall) totalExcess += hallCount - demand.hall
      if (kitchenCount > demand.kitchen) totalExcess += kitchenCount - demand.kitchen
    }
  }

  steps.push({
    title: "需要予測との照合",
    description: `不足 ${totalShortage} 枠、過剰 ${totalExcess} 枠を検出`,
    detail: "時間帯別の需要予測と希望シフトを比較し、過不足を特定",
    icon: "alert",
  })

  // Step 3: 調整（一部のシフトを延長・移動）
  const adjustments: { name: string; change: string; reason: string }[] = []

  // 佐藤(id:1)を月曜ホールから一部キッチンへ
  const satoMon = assignments.find((a) => a.staffId === "1" && a.dayIndex === 0)
  if (satoMon) {
    // 佐藤は両方できるので、月曜午後はキッチンヘルプ
    // → 午前ホール、午後キッチンに分割
    // 簡略化: ホールのまま、endを19:00に延長
    satoMon.end = "19:00"
    satoMon.status = "modified"
    satoMon.originalStart = "9:00"
    satoMon.originalEnd = "18:00"
    satoMon.modificationReason = "夕方のホール不足をカバー"
    adjustments.push({ name: "佐藤 一郎", change: "月曜 終了を18:00→19:00に延長", reason: "夕方のホール不足カバー" })
  }
  // 山田(id:2)を土曜にendを20:00に延長
  const yamadaSat = assignments.find((a) => a.staffId === "2" && a.dayIndex === 5)
  if (yamadaSat) {
    yamadaSat.end = "20:00"
    yamadaSat.status = "modified"
    yamadaSat.originalStart = "10:00"
    yamadaSat.originalEnd = "19:00"
    yamadaSat.modificationReason = "土曜夕方の需要増対応"
    adjustments.push({ name: "山田 太郎", change: "土曜 終了を19:00→20:00に延長", reason: "土曜夕方の需要増" })
  }
  // 中村(id:8)を水曜ホール→キッチンに変更
  const nakamuraWed = assignments.find((a) => a.staffId === "8" && a.dayIndex === 2)
  if (nakamuraWed) {
    nakamuraWed.role = "キッチン"
    nakamuraWed.status = "modified"
    nakamuraWed.modificationReason = "水曜キッチン不足のため配置変更"
    adjustments.push({ name: "中村 翔太", change: "水曜 ホール→キッチンに変更", reason: "キッチン不足" })
  }
  // 鈴木(id:4)月曜 endを21:00に延長
  const suzukiMon = assignments.find((a) => a.staffId === "4" && a.dayIndex === 0)
  if (suzukiMon) {
    suzukiMon.end = "21:00"
    suzukiMon.status = "modified"
    suzukiMon.originalStart = "11:00"
    suzukiMon.originalEnd = "20:00"
    suzukiMon.modificationReason = "月曜夜のキッチン不足カバー"
    adjustments.push({ name: "鈴木 健太", change: "月曜 終了を20:00→21:00に延長", reason: "夜のキッチン不足" })
  }

  steps.push({
    title: "シフト調整の実行",
    description: `${adjustments.length}件のシフト調整を実施`,
    detail: adjustments.map((a) => `${a.name}: ${a.change}`).join(" / "),
    icon: "sparkles",
  })

  // Step 4: ヘルプ必要枠の特定
  const helpNeeded: HelpNeededSlot[] = []
  for (let day = 0; day < 7; day++) {
    for (const hour of HOURS) {
      const demand = getDemand(day, hour)
      const hallCount = assignments.filter(
        (a) => a.dayIndex === day && a.role === "ホール" &&
        parseInt(a.start) <= hour && parseInt(a.end) > hour
      ).length
      const kitchenCount = assignments.filter(
        (a) => a.dayIndex === day && a.role === "キッチン" &&
        parseInt(a.start) <= hour && parseInt(a.end) > hour
      ).length
      if (hallCount < demand.hall) {
        helpNeeded.push({ dayIndex: day, hour, role: "ホール", shortage: demand.hall - hallCount })
      }
      if (kitchenCount < demand.kitchen) {
        helpNeeded.push({ dayIndex: day, hour, role: "キッチン", shortage: demand.kitchen - kitchenCount })
      }
    }
  }

  steps.push({
    title: "ヘルプ必要枠の特定",
    description: `${helpNeeded.length} 枠でヘルプが必要と判定`,
    detail: "自店舗のスタッフだけでは充足できない時間帯を特定しました",
    icon: "alert",
  })

  steps.push({
    title: "最適化完了",
    description: "シフトの最適化が完了しました",
    detail: `希望通り: ${assignments.filter((a) => a.status === "matched").length}件 / 調整あり: ${assignments.filter((a) => a.status === "modified").length}件 / ヘルプ必要: ${helpNeeded.length}枠`,
    icon: "check",
  })

  return { assignments, helpNeeded, steps }
}

// ========== メインコンポーネント ==========
export default function ShiftManagement() {
  const [activeTab, setActiveTab] = useState("preferences")
  const [optimizationPhase, setOptimizationPhase] = useState<"idle" | "running" | "done">("idle")
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), [])
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const optimizationResult = useMemo(() => runOptimization(staffPreferences), [])
  const { assignments, helpNeeded, steps } = optimizationResult

  // 各時間帯の配置人数を計算
  const getStaffCount = (day: number, hour: number, role: "ホール" | "キッチン") => {
    return assignments.filter(
      (a) => a.dayIndex === day && a.role === role &&
      parseInt(a.start) <= hour && parseInt(a.end) > hour
    ).length
  }

  // 希望シフトからの配置人数
  const getPreferenceCount = (day: number, hour: number, role: "ホール" | "キッチン") => {
    return staffPreferences.filter((staff) => {
      const pref = staff.weeklyPreferences[day]
      if (!pref) return false
      const staffRole = staff.position === "キッチン" ? "キッチン" : "ホール"
      if (staffRole !== role && staff.position !== "両方") return false
      if (staff.position === "両方" && role !== "ホール") return false
      return parseInt(pref.start) <= hour && parseInt(pref.end) > hour
    }).length
  }

  const handleRunOptimization = async () => {
    setOptimizationPhase("running")
    setCurrentStepIndex(0)
    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      setCurrentStepIndex(i + 1)
    }
    await new Promise((resolve) => setTimeout(resolve, 600))
    setOptimizationPhase("done")
    setActiveTab("result")
  }

  // 統計
  const stats = useMemo(() => {
    const matched = assignments.filter((a) => a.status === "matched").length
    const modified = assignments.filter((a) => a.status === "modified").length
    const helpSlotCount = helpNeeded.length
    const helpDays = new Set(helpNeeded.map((h) => h.dayIndex)).size
    return { matched, modified, helpSlotCount, helpDays }
  }, [assignments, helpNeeded])

  // ========== レンダリング ==========
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* ヘッダー */}
      <div className="border-b">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">シフト管理</h1>
              <p className="text-sm text-gray-600 mt-1">
                {format(weekStart, "yyyy年M月d日", { locale: ja })} 〜 {format(addDays(weekStart, 6), "M月d日", { locale: ja })} の週間シフト
              </p>
            </div>
            <div className="flex gap-2">
              {optimizationPhase === "done" && (
                <Link href="/shifts/help">
                  <Button variant="outline" size="sm" className="gap-2">
                    <HandHelping className="h-4 w-4" />
                    複数店舗ヘルプ最適化
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" className="gap-2">
                <Send className="h-4 w-4" />
                従業員に通知
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ワークフロー進捗 */}
      <div className="border-b bg-gray-50 px-6 py-4">
        <div className="flex items-center gap-2">
          {[
            { key: "preferences", label: "希望シフト収集", icon: CalendarDays },
            { key: "optimization", label: "AI最適化", icon: Sparkles },
            { key: "result", label: "最適化結果", icon: UserCheck },
            { key: "help", label: "ヘルプ調整", icon: HandHelping },
          ].map((phase, i) => (
            <div key={phase.key} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === phase.key
                    ? "bg-blue-600 text-white"
                    : optimizationPhase === "done" || (phase.key === "preferences")
                      ? "bg-white text-gray-700 border border-gray-200 cursor-pointer hover:bg-gray-100"
                      : "bg-gray-200 text-gray-400"
                }`}
                onClick={() => {
                  if (phase.key === "preferences" || optimizationPhase === "done") {
                    setActiveTab(phase.key)
                  }
                }}
              >
                <phase.icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{phase.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* ===== 希望シフト タブ ===== */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">従業員の希望シフト</h2>
                <p className="text-sm text-gray-600 mt-1">各従業員から提出された希望シフトの一覧です</p>
              </div>
              <Button
                onClick={handleRunOptimization}
                disabled={optimizationPhase === "running"}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {optimizationPhase === "running" ? "最適化中..." : "AI最適化を実行"}
              </Button>
            </div>

            {/* 最適化プロセス表示 */}
            {optimizationPhase === "running" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">AI最適化処理中...</h3>
                </div>
                <Progress value={(currentStepIndex / steps.length) * 100} className="h-2" />
                <div className="space-y-3">
                  {steps.slice(0, currentStepIndex).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-blue-100">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{step.title}</p>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 希望シフト一覧テーブル */}
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 z-10 bg-gray-50 border-b border-r p-3 text-left text-sm font-medium text-gray-600 min-w-[160px]">
                        従業員
                      </th>
                      <th className="border-b border-r p-3 text-center text-sm font-medium text-gray-600 min-w-[80px]">
                        ポジション
                      </th>
                      <th className="border-b border-r p-3 text-center text-sm font-medium text-gray-600 min-w-[90px]">
                        勤務形態
                      </th>
                      {weekDates.map((date, i) => (
                        <th
                          key={i}
                          className={`border-b border-r p-3 text-center text-sm font-medium min-w-[120px] ${
                            i >= 5 ? "bg-red-50 text-red-700" : "text-gray-600"
                          }`}
                        >
                          <div>{format(date, "M/d", { locale: ja })}</div>
                          <div className="text-xs">{DAY_LABELS[i]}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staffPreferences.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-white border-b border-r p-3">
                          <div className="font-medium text-gray-900 text-sm">{staff.name}</div>
                          <div className="text-xs text-gray-500">{staff.availability}</div>
                        </td>
                        <td className="border-b border-r p-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              staff.position === "ホール"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : staff.position === "キッチン"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}
                          >
                            {staff.position}
                          </Badge>
                        </td>
                        <td className="border-b border-r p-3 text-center">
                          <span className="text-xs text-gray-600">{staff.employmentType}</span>
                        </td>
                        {Array.from({ length: 7 }, (_, day) => {
                          const pref = staff.weeklyPreferences[day]
                          return (
                            <td
                              key={day}
                              className={`border-b border-r p-2 text-center ${day >= 5 ? "bg-red-50/30" : ""}`}
                            >
                              {pref ? (
                                <div
                                  className={`rounded-lg px-2 py-1.5 text-xs font-medium ${
                                    staff.position === "キッチン"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : staff.position === "両方"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {pref.start}〜{pref.end}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">休み</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 需要 vs 希望の時間帯別サマリー */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">時間帯別 需要 vs 希望シフト</h3>
              {(["ホール", "キッチン"] as const).map((role) => (
                <div key={role} className="rounded-lg border overflow-hidden">
                  <div className={`px-4 py-2 ${role === "ホール" ? "bg-blue-50" : "bg-emerald-50"}`}>
                    <Badge variant="outline" className={role === "ホール" ? "text-blue-700 border-blue-300" : "text-emerald-700 border-emerald-300"}>
                      {role}
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="sticky left-0 z-10 bg-gray-50 border-b border-r p-2 text-sm font-medium text-gray-600 w-20">時間</th>
                          {weekDates.map((date, i) => (
                            <th key={i} className={`border-b border-r p-2 text-center text-xs font-medium min-w-[90px] ${i >= 5 ? "bg-red-50 text-red-700" : "text-gray-600"}`}>
                              {DAY_LABELS[i]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {HOURS.map((hour) => (
                          <tr key={hour}>
                            <td className="sticky left-0 z-10 bg-white border-b border-r p-2 text-xs font-medium text-gray-600">{hour}:00</td>
                            {Array.from({ length: 7 }, (_, day) => {
                              const demand = getDemand(day, hour)
                              const demandCount = role === "ホール" ? demand.hall : demand.kitchen
                              const prefCount = getPreferenceCount(day, hour, role)
                              const diff = prefCount - demandCount
                              return (
                                <td key={day} className={`border-b border-r p-1 text-center text-xs ${day >= 5 ? "bg-red-50/20" : ""}`}>
                                  <div className={`rounded px-1 py-0.5 font-medium ${
                                    diff < 0 ? "bg-red-100 text-red-700" : diff > 0 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                                  }`}>
                                    {prefCount}/{demandCount}
                                    {diff < 0 && <span className="ml-1 text-red-600 font-bold">({diff})</span>}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== 最適化タブ ===== */}
        {activeTab === "optimization" && optimizationPhase === "done" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">最適化プロセス</h2>
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4 bg-white border rounded-lg p-4">
                  <div className={`flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0 ${
                    step.icon === "check" ? "bg-green-100" : step.icon === "alert" ? "bg-amber-100" : step.icon === "sparkles" ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    {step.icon === "check" ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                     step.icon === "alert" ? <AlertTriangle className="h-5 w-5 text-amber-600" /> :
                     step.icon === "sparkles" ? <Sparkles className="h-5 w-5 text-blue-600" /> :
                     <FileText className="h-5 w-5 text-gray-600" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">ステップ {idx + 1}: {step.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== 最適化結果タブ ===== */}
        {activeTab === "result" && optimizationPhase === "done" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">最適化結果</h2>
                <p className="text-sm text-gray-600 mt-1">AIによる最適化が完了しました</p>
              </div>
              <div className="flex gap-2">
                <Link href="/shifts/help">
                  <Button variant="outline" size="sm" className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50">
                    <HandHelping className="h-4 w-4" />
                    ヘルプ枠を他店舗と最適化
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5">{stats.helpSlotCount}</Badge>
                  </Button>
                </Link>
              </div>
            </div>

            {/* 統計サマリー */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">希望通り</span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">{stats.matched}件</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-700">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm font-medium">調整あり</span>
                </div>
                <p className="text-2xl font-bold text-amber-900 mt-1">{stats.modified}件</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-medium">ヘルプ必要</span>
                </div>
                <p className="text-2xl font-bold text-red-900 mt-1">{stats.helpSlotCount}枠</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                  <Users className="h-5 w-5" />
                  <span className="text-sm font-medium">配置スタッフ</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">{staffPreferences.length}名</p>
              </div>
            </div>

            {/* 最適化結果テーブル */}
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 z-10 bg-gray-50 border-b border-r p-3 text-left text-sm font-medium text-gray-600 min-w-[160px]">
                        従業員
                      </th>
                      <th className="border-b border-r p-3 text-center text-sm font-medium text-gray-600 min-w-[70px]">配置</th>
                      {weekDates.map((date, i) => (
                        <th key={i} className={`border-b border-r p-3 text-center text-sm font-medium min-w-[130px] ${i >= 5 ? "bg-red-50 text-red-700" : "text-gray-600"}`}>
                          <div>{format(date, "M/d", { locale: ja })}</div>
                          <div className="text-xs">{DAY_LABELS[i]}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staffPreferences.map((staff) => {
                      const staffAssignments = assignments.filter((a) => a.staffId === staff.id)
                      return (
                        <tr key={staff.id} className="hover:bg-gray-50">
                          <td className="sticky left-0 z-10 bg-white border-b border-r p-3">
                            <div className="font-medium text-gray-900 text-sm">{staff.name}</div>
                            <div className="text-xs text-gray-500">{staff.employmentType}</div>
                          </td>
                          <td className="border-b border-r p-2 text-center">
                            <Badge variant="outline" className={`text-xs ${
                              staff.position === "ホール" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              staff.position === "キッチン" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              "bg-purple-50 text-purple-700 border-purple-200"
                            }`}>{staff.position}</Badge>
                          </td>
                          {Array.from({ length: 7 }, (_, day) => {
                            const dayAssignment = staffAssignments.find((a) => a.dayIndex === day)
                            if (!dayAssignment) {
                              return (
                                <td key={day} className={`border-b border-r p-2 text-center ${day >= 5 ? "bg-red-50/20" : ""}`}>
                                  <span className="text-xs text-gray-400">休み</span>
                                </td>
                              )
                            }
                            return (
                              <td key={day} className={`border-b border-r p-2 ${day >= 5 ? "bg-red-50/20" : ""}`}>
                                <div className={`rounded-lg px-2 py-1.5 text-xs ${
                                  dayAssignment.status === "matched"
                                    ? dayAssignment.role === "キッチン"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : "bg-blue-100 text-blue-800 border border-blue-200"
                                    : "bg-amber-100 text-amber-800 border-2 border-amber-400"
                                }`}>
                                  <div className="font-medium">
                                    {dayAssignment.start}〜{dayAssignment.end}
                                  </div>
                                  <div className="text-[10px] mt-0.5">
                                    {dayAssignment.role}
                                    {dayAssignment.status === "matched" && " ✓希望通り"}
                                  </div>
                                  {dayAssignment.status === "modified" && (
                                    <div className="text-[10px] mt-0.5 text-amber-700 font-medium">
                                      ⚠ {dayAssignment.modificationReason}
                                    </div>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 調整詳細 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5" />
                調整内容の詳細
              </h3>
              <div className="space-y-2">
                {assignments.filter((a) => a.status === "modified").map((a, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-amber-200 text-sm">
                    <span className="font-medium text-gray-900">{a.staffName}</span>
                    <span className="text-gray-600 ml-2">
                      {DAY_LABELS[a.dayIndex]}曜日:
                      {a.originalStart && ` ${a.originalStart}〜${a.originalEnd} →`} {a.start}〜{a.end} ({a.role})
                    </span>
                    <span className="text-amber-700 ml-2 font-medium">- {a.modificationReason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 時間帯別 最適化後の配置状況 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">時間帯別 最適化後の配置状況</h3>
              {(["ホール", "キッチン"] as const).map((role) => (
                <div key={role} className="rounded-lg border overflow-hidden">
                  <div className={`px-4 py-2 flex items-center justify-between ${role === "ホール" ? "bg-blue-50" : "bg-emerald-50"}`}>
                    <Badge variant="outline" className={role === "ホール" ? "text-blue-700 border-blue-300" : "text-emerald-700 border-emerald-300"}>
                      {role}
                    </Badge>
                    {(() => {
                      const roleHelp = helpNeeded.filter((h) => h.role === role)
                      return roleHelp.length > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          ヘルプ必要 {roleHelp.length}枠
                        </Badge>
                      ) : null
                    })()}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="sticky left-0 z-10 bg-gray-50 border-b border-r p-2 text-sm font-medium text-gray-600 w-20">時間</th>
                          {weekDates.map((date, i) => (
                            <th key={i} className={`border-b border-r p-2 text-center text-xs font-medium min-w-[90px] ${i >= 5 ? "bg-red-50 text-red-700" : "text-gray-600"}`}>
                              {DAY_LABELS[i]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {HOURS.map((hour) => (
                          <tr key={hour}>
                            <td className="sticky left-0 z-10 bg-white border-b border-r p-2 text-xs font-medium text-gray-600">{hour}:00</td>
                            {Array.from({ length: 7 }, (_, day) => {
                              const demand = getDemand(day, hour)
                              const demandCount = role === "ホール" ? demand.hall : demand.kitchen
                              const actual = getStaffCount(day, hour, role)
                              const diff = actual - demandCount
                              const isHelpNeeded = helpNeeded.some(
                                (h) => h.dayIndex === day && h.hour === hour && h.role === role
                              )
                              return (
                                <td key={day} className={`border-b border-r p-1 text-center text-xs ${day >= 5 ? "bg-red-50/20" : ""}`}>
                                  {isHelpNeeded ? (
                                    <div className="rounded px-1 py-1 bg-red-200 text-red-800 font-bold border-2 border-red-400 animate-pulse">
                                      {actual}/{demandCount}
                                      <div className="text-[10px] text-red-700">🆘 ヘルプ必要</div>
                                    </div>
                                  ) : (
                                    <div className={`rounded px-1 py-0.5 font-medium ${
                                      diff < 0 ? "bg-red-100 text-red-700" : diff > 0 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                                    }`}>
                                      {actual}/{demandCount}
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== ヘルプタブ ===== */}
        {activeTab === "help" && optimizationPhase === "done" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">ヘルプ必要枠一覧</h2>
                <p className="text-sm text-gray-600 mt-1">自店舗のスタッフだけでは充足できない時間帯です</p>
              </div>
              <Link href="/shifts/help">
                <Button className="gap-2">
                  <Building2 className="h-4 w-4" />
                  複数店舗で一括最適化
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* ヘルプ必要枠のグルーピング表示 */}
            <div className="grid gap-4">
              {Array.from({ length: 7 }, (_, day) => {
                const dayHelp = helpNeeded.filter((h) => h.dayIndex === day)
                if (dayHelp.length === 0) return null
                return (
                  <div key={day} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarDays className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold text-red-900">
                        {format(weekDates[day], "M月d日 (E)", { locale: ja })}
                      </h4>
                      <Badge variant="destructive">{dayHelp.length}枠</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {dayHelp.map((slot, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-gray-900">{slot.hour}:00〜{slot.hour + 1}:00</span>
                            </div>
                            <Badge variant="outline" className={
                              slot.role === "ホール" ? "text-blue-700 border-blue-300 bg-blue-50" : "text-emerald-700 border-emerald-300 bg-emerald-50"
                            }>
                              {slot.role}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-red-700 font-medium">
                            {slot.shortage}名不足
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-center">
              <HandHelping className="h-10 w-10 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-900 mb-2">複数店舗間のヘルプ最適化で解決できます</h3>
              <p className="text-sm text-blue-700 mb-4">
                東京店・大阪店・福岡店のヘルプ必要枠と空きスタッフを一括で最適化し、店舗間のヘルプ配置を自動で提案します。
              </p>
              <Link href="/shifts/help">
                <Button className="gap-2">
                  <Building2 className="h-4 w-4" />
                  複数店舗ヘルプ最適化へ
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
