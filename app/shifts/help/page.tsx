"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { format, addDays, startOfWeek } from "date-fns"
import { ja } from "date-fns/locale"
import {
  Building2, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeftRight,
  Users, Clock, HandHelping, MapPin, Train, ChevronLeft, CalendarDays,
  TrendingUp, Star, Send,
} from "lucide-react"
import Link from "next/link"

// ========== 型定義 ==========
interface HelpSlot {
  dayIndex: number
  hour: number
  role: "ホール" | "キッチン"
  shortage: number
}

interface StoreData {
  id: string
  name: string
  shortName: string
  color: string
  bgColor: string
  borderColor: string
  helpSlots: HelpSlot[]
}

interface AvailableHelper {
  id: string
  name: string
  storeId: string
  storeName: string
  position: "ホール" | "キッチン" | "両方"
  availableSlots: { dayIndex: number; start: string; end: string }[]
  rating: number // 1-5 スキル評価
}

interface HelpAssignment {
  helperId: string
  helperName: string
  fromStoreId: string
  fromStoreName: string
  toStoreId: string
  toStoreName: string
  dayIndex: number
  start: string
  end: string
  role: "ホール" | "キッチン"
  travelMinutes: number
  transportCost: number
}

interface OptimizationStep {
  title: string
  description: string
  detail: string
}

// ========== 定数 ==========
const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"]

// ========== モックデータ ==========
const storesData: StoreData[] = [
  {
    id: "tokyo",
    name: "Plate One 東京店",
    shortName: "東京",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    helpSlots: [
      { dayIndex: 0, hour: 20, role: "キッチン", shortage: 1 },
      { dayIndex: 0, hour: 21, role: "キッチン", shortage: 1 },
      { dayIndex: 1, hour: 19, role: "ホール", shortage: 1 },
      { dayIndex: 1, hour: 20, role: "ホール", shortage: 1 },
      { dayIndex: 3, hour: 10, role: "ホール", shortage: 1 },
      { dayIndex: 3, hour: 11, role: "ホール", shortage: 1 },
      { dayIndex: 4, hour: 20, role: "キッチン", shortage: 1 },
      { dayIndex: 4, hour: 21, role: "キッチン", shortage: 1 },
      { dayIndex: 5, hour: 10, role: "ホール", shortage: 1 },
      { dayIndex: 5, hour: 11, role: "ホール", shortage: 2 },
      { dayIndex: 5, hour: 12, role: "キッチン", shortage: 1 },
      { dayIndex: 5, hour: 19, role: "ホール", shortage: 1 },
      { dayIndex: 5, hour: 20, role: "ホール", shortage: 1 },
      { dayIndex: 6, hour: 11, role: "ホール", shortage: 1 },
      { dayIndex: 6, hour: 12, role: "ホール", shortage: 1 },
      { dayIndex: 6, hour: 12, role: "キッチン", shortage: 1 },
      { dayIndex: 6, hour: 19, role: "キッチン", shortage: 1 },
      { dayIndex: 6, hour: 14, role: "キッチン", shortage: 1 },
      { dayIndex: 6, hour: 15, role: "キッチン", shortage: 1 },
    ],
  },
  {
    id: "osaka",
    name: "Plate One 大阪店",
    shortName: "大阪",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    helpSlots: [
      { dayIndex: 4, hour: 19, role: "ホール", shortage: 1 },
      { dayIndex: 4, hour: 20, role: "ホール", shortage: 1 },
      { dayIndex: 5, hour: 18, role: "ホール", shortage: 2 },
      { dayIndex: 5, hour: 19, role: "ホール", shortage: 2 },
      { dayIndex: 5, hour: 20, role: "ホール", shortage: 1 },
      { dayIndex: 5, hour: 12, role: "キッチン", shortage: 1 },
      { dayIndex: 5, hour: 13, role: "キッチン", shortage: 1 },
      { dayIndex: 6, hour: 11, role: "キッチン", shortage: 1 },
      { dayIndex: 6, hour: 12, role: "キッチン", shortage: 1 },
      { dayIndex: 6, hour: 18, role: "ホール", shortage: 1 },
      { dayIndex: 6, hour: 19, role: "ホール", shortage: 2 },
      { dayIndex: 6, hour: 20, role: "ホール", shortage: 1 },
    ],
  },
  {
    id: "fukuoka",
    name: "Plate One 福岡店",
    shortName: "福岡",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    helpSlots: [
      { dayIndex: 4, hour: 19, role: "キッチン", shortage: 1 },
      { dayIndex: 4, hour: 20, role: "キッチン", shortage: 1 },
      { dayIndex: 5, hour: 11, role: "ホール", shortage: 1 },
      { dayIndex: 5, hour: 12, role: "ホール", shortage: 2 },
      { dayIndex: 5, hour: 18, role: "ホール", shortage: 1 },
      { dayIndex: 5, hour: 19, role: "ホール", shortage: 1 },
      { dayIndex: 5, hour: 20, role: "キッチン", shortage: 1 },
      { dayIndex: 6, hour: 11, role: "ホール", shortage: 1 },
      { dayIndex: 6, hour: 12, role: "ホール", shortage: 1 },
      { dayIndex: 6, hour: 19, role: "キッチン", shortage: 1 },
    ],
  },
]

const availableHelpers: AvailableHelper[] = [
  // 東京店のスタッフ（大阪・福岡をヘルプ可能）
  {
    id: "h1", name: "中村 翔太", storeId: "tokyo", storeName: "東京店",
    position: "両方", rating: 4,
    availableSlots: [
      { dayIndex: 0, start: "18:00", end: "23:00" },
      { dayIndex: 1, start: "18:00", end: "23:00" },
    ],
  },
  {
    id: "h2", name: "加藤 健一", storeId: "tokyo", storeName: "東京店",
    position: "キッチン", rating: 3,
    availableSlots: [
      { dayIndex: 5, start: "10:00", end: "18:00" },
      { dayIndex: 6, start: "10:00", end: "18:00" },
    ],
  },

  // 大阪店のスタッフ（東京・福岡をヘルプ可能）
  {
    id: "h3", name: "松田 聡子", storeId: "osaka", storeName: "大阪店",
    position: "キッチン", rating: 5,
    availableSlots: [
      { dayIndex: 0, start: "17:00", end: "22:00" },
      { dayIndex: 3, start: "9:00", end: "15:00" },
      { dayIndex: 6, start: "10:00", end: "20:00" },
    ],
  },
  {
    id: "h4", name: "吉田 美香", storeId: "osaka", storeName: "大阪店",
    position: "ホール", rating: 4,
    availableSlots: [
      { dayIndex: 5, start: "9:00", end: "15:00" },
      { dayIndex: 6, start: "10:00", end: "16:00" },
    ],
  },
  {
    id: "h5", name: "大西 翔平", storeId: "osaka", storeName: "大阪店",
    position: "ホール", rating: 3,
    availableSlots: [
      { dayIndex: 1, start: "17:00", end: "22:00" },
      { dayIndex: 4, start: "17:00", end: "22:00" },
    ],
  },

  // 福岡店のスタッフ（東京・大阪をヘルプ可能）
  {
    id: "h6", name: "佐々木 健太", storeId: "fukuoka", storeName: "福岡店",
    position: "ホール", rating: 4,
    availableSlots: [
      { dayIndex: 3, start: "9:00", end: "14:00" },
      { dayIndex: 4, start: "17:00", end: "22:00" },
    ],
  },
  {
    id: "h7", name: "中島 龍太", storeId: "fukuoka", storeName: "福岡店",
    position: "キッチン", rating: 5,
    availableSlots: [
      { dayIndex: 0, start: "17:00", end: "23:00" },
      { dayIndex: 5, start: "10:00", end: "22:00" },
    ],
  },
  {
    id: "h8", name: "森本 由美", storeId: "fukuoka", storeName: "福岡店",
    position: "両方", rating: 4,
    availableSlots: [
      { dayIndex: 5, start: "17:00", end: "23:00" },
      { dayIndex: 6, start: "10:00", end: "20:00" },
    ],
  },
]

// 店舗間の移動情報
const travelInfo: Record<string, Record<string, { minutes: number; cost: number }>> = {
  tokyo: {
    osaka: { minutes: 150, cost: 13870 },
    fukuoka: { minutes: 300, cost: 22220 },
  },
  osaka: {
    tokyo: { minutes: 150, cost: 13870 },
    fukuoka: { minutes: 150, cost: 15400 },
  },
  fukuoka: {
    tokyo: { minutes: 300, cost: 22220 },
    osaka: { minutes: 150, cost: 15400 },
  },
}

// ========== 最適化ロジック ==========
function runHelpOptimization(): {
  assignments: HelpAssignment[]
  steps: OptimizationStep[]
  resolvedCount: number
  totalSlots: number
} {
  const assignments: HelpAssignment[] = []
  const steps: OptimizationStep[] = []
  const totalSlots = storesData.reduce((sum, store) => sum + store.helpSlots.length, 0)

  steps.push({
    title: "全店舗のヘルプ必要枠を集約",
    description: `3店舗合計 ${totalSlots} 枠のヘルプ必要枠を検出`,
    detail: storesData.map((s) => `${s.shortName}: ${s.helpSlots.length}枠`).join(" / "),
  })

  steps.push({
    title: "他店舗の空きスタッフを検索",
    description: `${availableHelpers.length}名のヘルプ可能スタッフを検出`,
    detail: `東京: ${availableHelpers.filter((h) => h.storeId === "tokyo").length}名 / 大阪: ${availableHelpers.filter((h) => h.storeId === "osaka").length}名 / 福岡: ${availableHelpers.filter((h) => h.storeId === "fukuoka").length}名`,
  })

  // 東京店の月曜夜キッチン不足 → 大阪の松田を割り当て
  assignments.push({
    helperId: "h3", helperName: "松田 聡子",
    fromStoreId: "osaka", fromStoreName: "大阪店",
    toStoreId: "tokyo", toStoreName: "東京店",
    dayIndex: 0, start: "19:00", end: "22:00", role: "キッチン",
    travelMinutes: 150, transportCost: 13870,
  })

  // 東京店の火曜夜ホール不足 → 大阪の大西を割り当て
  assignments.push({
    helperId: "h5", helperName: "大西 翔平",
    fromStoreId: "osaka", fromStoreName: "大阪店",
    toStoreId: "tokyo", toStoreName: "東京店",
    dayIndex: 1, start: "18:00", end: "21:00", role: "ホール",
    travelMinutes: 150, transportCost: 13870,
  })

  // 東京店の木曜午前ホール不足 → 福岡の佐々木を割り当て
  assignments.push({
    helperId: "h6", helperName: "佐々木 健太",
    fromStoreId: "fukuoka", fromStoreName: "福岡店",
    toStoreId: "tokyo", toStoreName: "東京店",
    dayIndex: 3, start: "10:00", end: "13:00", role: "ホール",
    travelMinutes: 300, transportCost: 22220,
  })

  // 東京店の土曜午前ホール不足 → 大阪の吉田を割り当て
  assignments.push({
    helperId: "h4", helperName: "吉田 美香",
    fromStoreId: "osaka", fromStoreName: "大阪店",
    toStoreId: "tokyo", toStoreName: "東京店",
    dayIndex: 5, start: "10:00", end: "13:00", role: "ホール",
    travelMinutes: 150, transportCost: 13870,
  })

  // 東京店の土曜キッチン不足 → 福岡の中島を割り当て
  assignments.push({
    helperId: "h7", helperName: "中島 龍太",
    fromStoreId: "fukuoka", fromStoreName: "福岡店",
    toStoreId: "tokyo", toStoreName: "東京店",
    dayIndex: 5, start: "11:00", end: "14:00", role: "キッチン",
    travelMinutes: 300, transportCost: 22220,
  })

  // 大阪店の金曜夜ホール不足 → 東京の中村を割り当て
  assignments.push({
    helperId: "h1", helperName: "中村 翔太",
    fromStoreId: "tokyo", fromStoreName: "東京店",
    toStoreId: "osaka", toStoreName: "大阪店",
    dayIndex: 4, start: "18:00", end: "21:00", role: "ホール",
    travelMinutes: 150, transportCost: 13870,
  })

  // 大阪店の土曜夕方ホール不足 → 福岡の森本を割り当て
  assignments.push({
    helperId: "h8", helperName: "森本 由美",
    fromStoreId: "fukuoka", fromStoreName: "福岡店",
    toStoreId: "osaka", toStoreName: "大阪店",
    dayIndex: 5, start: "17:00", end: "21:00", role: "ホール",
    travelMinutes: 150, transportCost: 15400,
  })

  // 大阪店の日曜キッチン不足 → 東京の加藤を割り当て
  assignments.push({
    helperId: "h2", helperName: "加藤 健一",
    fromStoreId: "tokyo", fromStoreName: "東京店",
    toStoreId: "osaka", toStoreName: "大阪店",
    dayIndex: 6, start: "10:00", end: "14:00", role: "キッチン",
    travelMinutes: 150, transportCost: 13870,
  })

  // 福岡店の土曜午前ホール不足 → 大阪の吉田を割り当て (吉田は日曜空き)
  assignments.push({
    helperId: "h4", helperName: "吉田 美香",
    fromStoreId: "osaka", fromStoreName: "大阪店",
    toStoreId: "fukuoka", toStoreName: "福岡店",
    dayIndex: 6, start: "10:00", end: "14:00", role: "ホール",
    travelMinutes: 150, transportCost: 15400,
  })

  // 福岡店の日曜キッチン不足 → 大阪の松田を割り当て
  assignments.push({
    helperId: "h3", helperName: "松田 聡子",
    fromStoreId: "osaka", fromStoreName: "大阪店",
    toStoreId: "fukuoka", toStoreName: "福岡店",
    dayIndex: 6, start: "17:00", end: "21:00", role: "キッチン",
    travelMinutes: 150, transportCost: 15400,
  })

  steps.push({
    title: "コスト最適な配置を計算",
    description: "移動コスト・スキル適合度・労働時間のバランスを最適化",
    detail: `距離が近い店舗間を優先し、スキル評価の高いスタッフを選定`,
  })

  steps.push({
    title: "ヘルプ配置の決定",
    description: `${assignments.length}件のヘルプ配置を決定`,
    detail: assignments.map((a) => `${a.helperName}: ${a.fromStoreName}→${a.toStoreName}`).join(" / "),
  })

  const resolvedCount = assignments.length
  steps.push({
    title: "最適化完了",
    description: `全${totalSlots}枠中 ${resolvedCount}枠にヘルプを配置完了`,
    detail: `残り ${totalSlots - resolvedCount} 枠は応募・追加採用で対応推奨`,
  })

  return { assignments, steps, resolvedCount, totalSlots }
}

// ========== メインコンポーネント ==========
export default function MultiStoreHelpOptimization() {
  const [phase, setPhase] = useState<"overview" | "optimizing" | "result">("overview")
  const [currentStep, setCurrentStep] = useState(0)

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), [])
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const optimizationResult = useMemo(() => runHelpOptimization(), [])
  const { assignments, steps, resolvedCount, totalSlots } = optimizationResult

  const handleOptimize = async () => {
    setPhase("optimizing")
    setCurrentStep(0)
    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setCurrentStep(i + 1)
    }
    await new Promise((resolve) => setTimeout(resolve, 800))
    setPhase("result")
  }

  // 統計
  const totalTransportCost = assignments.reduce((sum, a) => sum + a.transportCost, 0)
  const storeAssignments = (storeId: string) => assignments.filter((a) => a.toStoreId === storeId)

  const getStoreStyle = (storeId: string) => {
    const store = storesData.find((s) => s.id === storeId)
    return store || storesData[0]
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* ヘッダー */}
      <div className="border-b">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Link href="/shifts">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  戻る
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  複数店舗ヘルプ一括最適化
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {format(weekStart, "yyyy年M月d日", { locale: ja })} 〜 {format(addDays(weekStart, 6), "M月d日", { locale: ja })}
                </p>
              </div>
            </div>
            {phase === "result" && (
              <Button variant="outline" size="sm" className="gap-2">
                <Send className="h-4 w-4" />
                ヘルプスタッフに通知
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ===== 概要フェーズ ===== */}
        {phase === "overview" && (
          <>
            {/* 全店舗サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {storesData.map((store) => (
                <div key={store.id} className={`${store.bgColor} border ${store.borderColor} rounded-lg p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold ${store.color} flex items-center gap-2`}>
                      <MapPin className="h-5 w-5" />
                      {store.name}
                    </h3>
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {store.helpSlots.length}枠
                    </Badge>
                  </div>

                  {/* 曜日別ヘルプ必要枠 */}
                  <div className="space-y-2">
                    {Array.from({ length: 7 }, (_, day) => {
                      const daySlots = store.helpSlots.filter((s) => s.dayIndex === day)
                      if (daySlots.length === 0) return null
                      return (
                        <div key={day} className="bg-white rounded-lg p-2 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">
                              {format(weekDates[day], "M/d (E)", { locale: ja })}
                            </span>
                            <span className="text-xs text-red-600 font-medium">{daySlots.length}枠不足</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {daySlots.map((slot, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px] py-0 h-5 bg-red-50 text-red-700 border-red-200">
                                {slot.hour}時 {slot.role} -{slot.shortage}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* ヘルプ可能スタッフ */}
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  ヘルプ可能なスタッフ一覧
                </h3>
                <p className="text-sm text-gray-600 mt-1">他店舗のヘルプに入れるスタッフです</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border-b p-3 text-left text-sm font-medium text-gray-600">スタッフ</th>
                      <th className="border-b p-3 text-center text-sm font-medium text-gray-600">所属</th>
                      <th className="border-b p-3 text-center text-sm font-medium text-gray-600">ポジション</th>
                      <th className="border-b p-3 text-center text-sm font-medium text-gray-600">スキル</th>
                      <th className="border-b p-3 text-left text-sm font-medium text-gray-600">ヘルプ可能日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableHelpers.map((helper) => (
                      <tr key={helper.id} className="hover:bg-gray-50">
                        <td className="border-b p-3">
                          <span className="font-medium text-gray-900 text-sm">{helper.name}</span>
                        </td>
                        <td className="border-b p-3 text-center">
                          <Badge variant="outline" className={`text-xs ${getStoreStyle(helper.storeId).bgColor} ${getStoreStyle(helper.storeId).color} ${getStoreStyle(helper.storeId).borderColor}`}>
                            {helper.storeName}
                          </Badge>
                        </td>
                        <td className="border-b p-3 text-center">
                          <Badge variant="outline" className={`text-xs ${
                            helper.position === "ホール" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            helper.position === "キッチン" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "bg-purple-50 text-purple-700 border-purple-200"
                          }`}>{helper.position}</Badge>
                        </td>
                        <td className="border-b p-3 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < helper.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                            ))}
                          </div>
                        </td>
                        <td className="border-b p-3">
                          <div className="flex flex-wrap gap-1">
                            {helper.availableSlots.map((slot, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                {DAY_LABELS[slot.dayIndex]} {slot.start}〜{slot.end}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 最適化ボタン */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-emerald-50 border border-blue-200 rounded-lg p-6 text-center">
              <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                3店舗のヘルプ枠を一括で最適化
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-lg mx-auto">
                各店舗の不足枠と空きスタッフを照合し、移動コスト・スキル適合度を考慮した最適なヘルプ配置を自動で提案します。
              </p>
              <Button size="lg" onClick={handleOptimize} className="gap-2">
                <Sparkles className="h-5 w-5" />
                一括最適化を実行
              </Button>
            </div>
          </>
        )}

        {/* ===== 最適化中フェーズ ===== */}
        {phase === "optimizing" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <h3 className="text-xl font-semibold text-blue-900">複数店舗ヘルプ最適化中...</h3>
              </div>
              <Progress value={(currentStep / steps.length) * 100} className="h-3" />
              <p className="text-sm text-blue-700">
                ステップ {currentStep} / {steps.length}
              </p>

              <div className="space-y-3">
                {steps.slice(0, currentStep).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-blue-100">
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
          </div>
        )}

        {/* ===== 結果フェーズ ===== */}
        {phase === "result" && (
          <>
            {/* 結果サマリー */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <h2 className="text-lg font-semibold text-green-900">最適化完了</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-gray-600">ヘルプ配置数</p>
                  <p className="text-2xl font-bold text-green-900">{resolvedCount}件</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600">対象スタッフ</p>
                  <p className="text-2xl font-bold text-blue-900">{new Set(assignments.map((a) => a.helperId)).size}名</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <p className="text-sm text-gray-600">交通費合計</p>
                  <p className="text-2xl font-bold text-amber-900">{totalTransportCost.toLocaleString()}円</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600">充足率</p>
                  <p className="text-2xl font-bold text-purple-900">{((resolvedCount / totalSlots) * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>

            {/* 店舗別のヘルプ配置結果 */}
            {storesData.map((store) => {
              const storeHelp = storeAssignments(store.id)
              if (storeHelp.length === 0) return null
              return (
                <div key={store.id} className={`rounded-lg border ${store.borderColor} overflow-hidden`}>
                  <div className={`${store.bgColor} px-5 py-3 border-b ${store.borderColor}`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${store.color} flex items-center gap-2`}>
                        <MapPin className="h-5 w-5" />
                        {store.name} へのヘルプ配置
                      </h3>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        {storeHelp.length}件配置
                      </Badge>
                    </div>
                  </div>
                  <div className="divide-y">
                    {storeHelp.map((assignment, idx) => (
                      <div key={idx} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          {/* 左: ヘルパー情報 */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900">{assignment.helperName}</span>
                              <Badge variant="outline" className={`text-xs ${
                                assignment.role === "ホール" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>{assignment.role}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <CalendarDays className="h-4 w-4" />
                                {format(weekDates[assignment.dayIndex], "M/d (E)", { locale: ja })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {assignment.start}〜{assignment.end}
                              </div>
                            </div>
                          </div>
                          {/* 右: 移動情報 */}
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className={`${getStoreStyle(assignment.fromStoreId).bgColor} ${getStoreStyle(assignment.fromStoreId).color} ${getStoreStyle(assignment.fromStoreId).borderColor}`}>
                                {assignment.fromStoreName}
                              </Badge>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                              <Badge variant="outline" className={`${getStoreStyle(assignment.toStoreId).bgColor} ${getStoreStyle(assignment.toStoreId).color} ${getStoreStyle(assignment.toStoreId).borderColor}`}>
                                {store.shortName}店
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 justify-end">
                              <div className="flex items-center gap-1">
                                <Train className="h-3 w-3" />
                                {assignment.travelMinutes}分
                              </div>
                              <span>¥{assignment.transportCost.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* 店舗間フロー図 */}
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  店舗間ヘルプフロー
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
                  {storesData.map((store) => {
                    const incoming = assignments.filter((a) => a.toStoreId === store.id)
                    const outgoing = assignments.filter((a) => a.fromStoreId === store.id)
                    return (
                      <div key={store.id} className={`${store.bgColor} border-2 ${store.borderColor} rounded-xl p-4 text-center`}>
                        <MapPin className={`h-8 w-8 ${store.color} mx-auto mb-2`} />
                        <h4 className={`font-bold ${store.color} text-lg`}>{store.shortName}店</h4>
                        <div className="mt-3 space-y-2">
                          {incoming.length > 0 && (
                            <div className="bg-white rounded-lg p-2 border border-green-200">
                              <div className="text-xs text-green-700 font-medium">受入</div>
                              <div className="text-lg font-bold text-green-800">{incoming.length}名</div>
                            </div>
                          )}
                          {outgoing.length > 0 && (
                            <div className="bg-white rounded-lg p-2 border border-blue-200">
                              <div className="text-xs text-blue-700 font-medium">派遣</div>
                              <div className="text-lg font-bold text-blue-800">{outgoing.length}名</div>
                            </div>
                          )}
                          <div className="bg-white rounded-lg p-2 border border-gray-200">
                            <div className="text-xs text-gray-600">元の不足</div>
                            <div className="text-lg font-bold text-red-700">{store.helpSlots.length}枠</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* フロー矢印 */}
                <div className="mt-6 space-y-2">
                  {assignments.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-4 py-2 max-w-3xl mx-auto">
                      <Badge variant="outline" className={`${getStoreStyle(a.fromStoreId).bgColor} ${getStoreStyle(a.fromStoreId).color} ${getStoreStyle(a.fromStoreId).borderColor}`}>
                        {a.fromStoreName}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <Badge variant="outline" className={`${getStoreStyle(a.toStoreId).bgColor} ${getStoreStyle(a.toStoreId).color} ${getStoreStyle(a.toStoreId).borderColor}`}>
                        {storesData.find((s) => s.id === a.toStoreId)?.name}
                      </Badge>
                      <span className="text-gray-700 font-medium">{a.helperName}</span>
                      <span className="text-gray-500">
                        {DAY_LABELS[a.dayIndex]} {a.start}〜{a.end} ({a.role})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={() => setPhase("overview")} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                概要に戻る
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  レポート出力
                </Button>
                <Button className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  ヘルプ配置を確定
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
