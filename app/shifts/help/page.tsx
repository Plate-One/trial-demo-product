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
import { HELP_ASSIGNMENTS } from "@/lib/help-assignments"

// ========== 型定義 ==========
interface HelpSlot {
  dayIndex: number
  start: string // "11:00" 形式
  end: string   // "13:00" 形式
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
  position: "ホール" | "キッチン"
  availableSlots: { dayIndex: number; start: string; end: string }[]
  rating: number
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

// ========== モックデータ（横浜・町田エリア 5店舗） ==========
const storesData: StoreData[] = [
  {
    id: "bayquarter",
    name: "キリンシティプラス横浜ベイクォーター店",
    shortName: "ベイクォーター",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    helpSlots: [
      { dayIndex: 0, start: "19:00", end: "21:00", role: "ホール", shortage: 1 },
      { dayIndex: 0, start: "19:00", end: "22:00", role: "キッチン", shortage: 1 },
      { dayIndex: 2, start: "19:00", end: "21:00", role: "ホール", shortage: 1 },
      { dayIndex: 4, start: "19:00", end: "21:00", role: "ホール", shortage: 1 },
      { dayIndex: 4, start: "19:00", end: "22:00", role: "キッチン", shortage: 1 },
      { dayIndex: 5, start: "11:00", end: "14:00", role: "ホール", shortage: 2 },
      { dayIndex: 5, start: "19:00", end: "22:00", role: "キッチン", shortage: 1 },
      { dayIndex: 6, start: "11:00", end: "14:00", role: "ホール", shortage: 1 },
      { dayIndex: 6, start: "18:00", end: "21:00", role: "キッチン", shortage: 1 },
    ],
  },
  {
    id: "mores",
    name: "キリンシティ 横浜モアーズ店",
    shortName: "モアーズ",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    helpSlots: [
      { dayIndex: 4, start: "19:00", end: "22:00", role: "ホール", shortage: 1 },
      { dayIndex: 5, start: "11:00", end: "14:00", role: "キッチン", shortage: 1 },
      { dayIndex: 5, start: "19:00", end: "22:00", role: "ホール", shortage: 2 },
      { dayIndex: 6, start: "11:00", end: "14:00", role: "キッチン", shortage: 1 },
      { dayIndex: 6, start: "19:00", end: "22:00", role: "ホール", shortage: 1 },
    ],
  },
  {
    id: "fti",
    name: "キリンシティ FOOD＆TIME ISETAN YOKOHAMA店",
    shortName: "FTI横浜",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    helpSlots: [
      { dayIndex: 4, start: "18:00", end: "21:00", role: "キッチン", shortage: 1 },
      { dayIndex: 4, start: "19:00", end: "21:00", role: "ホール", shortage: 1 },
      { dayIndex: 5, start: "11:00", end: "14:00", role: "ホール", shortage: 1 },
      { dayIndex: 5, start: "18:00", end: "21:00", role: "ホール", shortage: 2 },
      { dayIndex: 5, start: "19:00", end: "22:00", role: "キッチン", shortage: 1 },
      { dayIndex: 6, start: "11:00", end: "14:00", role: "ホール", shortage: 1 },
    ],
  },
  {
    id: "cial",
    name: "キリンシティ CIAL桜木町店",
    shortName: "CIAL桜木町",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    helpSlots: [
      { dayIndex: 3, start: "18:00", end: "21:00", role: "ホール", shortage: 1 },
      { dayIndex: 4, start: "19:00", end: "21:00", role: "ホール", shortage: 1 },
      { dayIndex: 4, start: "19:00", end: "22:00", role: "キッチン", shortage: 1 },
      { dayIndex: 5, start: "11:00", end: "14:00", role: "ホール", shortage: 2 },
      { dayIndex: 5, start: "13:00", end: "16:00", role: "キッチン", shortage: 1 },
      { dayIndex: 5, start: "19:00", end: "22:00", role: "ホール", shortage: 2 },
      { dayIndex: 6, start: "11:00", end: "14:00", role: "ホール", shortage: 1 },
      { dayIndex: 6, start: "13:00", end: "16:00", role: "キッチン", shortage: 1 },
      { dayIndex: 6, start: "19:00", end: "21:00", role: "ホール", shortage: 1 },
    ],
  },
  {
    id: "machida",
    name: "キリンシティ 町田店",
    shortName: "町田",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    helpSlots: [
      { dayIndex: 4, start: "18:00", end: "21:00", role: "ホール", shortage: 1 },
      { dayIndex: 4, start: "19:00", end: "22:00", role: "キッチン", shortage: 1 },
      { dayIndex: 5, start: "11:00", end: "14:00", role: "ホール", shortage: 1 },
      { dayIndex: 5, start: "18:00", end: "21:00", role: "ホール", shortage: 1 },
      { dayIndex: 5, start: "19:00", end: "22:00", role: "ホール", shortage: 2 },
      { dayIndex: 5, start: "19:00", end: "22:00", role: "キッチン", shortage: 1 },
      { dayIndex: 6, start: "11:00", end: "14:00", role: "ホール", shortage: 1 },
      { dayIndex: 6, start: "19:00", end: "22:00", role: "キッチン", shortage: 1 },
    ],
  },
]

const availableHelpers: AvailableHelper[] = [
  // ベイクォーター店のスタッフ
  {
    id: "h1", name: "中村 翔太", storeId: "bayquarter", storeName: "ベイクォーター店",
    position: "ホール", rating: 4,
    availableSlots: [
      { dayIndex: 5, start: "11:00", end: "16:00" },
      { dayIndex: 6, start: "11:00", end: "16:00" },
    ],
  },
  {
    id: "h2", name: "加藤 健一", storeId: "bayquarter", storeName: "ベイクォーター店",
    position: "キッチン", rating: 3,
    availableSlots: [
      { dayIndex: 3, start: "17:00", end: "22:00" },
      { dayIndex: 4, start: "17:00", end: "22:00" },
    ],
  },
  // モアーズ店のスタッフ
  {
    id: "h3", name: "松田 聡子", storeId: "mores", storeName: "モアーズ店",
    position: "キッチン", rating: 5,
    availableSlots: [
      { dayIndex: 0, start: "17:00", end: "22:00" },
      { dayIndex: 5, start: "10:00", end: "15:00" },
      { dayIndex: 6, start: "10:00", end: "20:00" },
    ],
  },
  {
    id: "h4", name: "吉田 美香", storeId: "mores", storeName: "モアーズ店",
    position: "ホール", rating: 4,
    availableSlots: [
      { dayIndex: 2, start: "17:00", end: "22:00" },
      { dayIndex: 5, start: "17:00", end: "22:00" },
      { dayIndex: 6, start: "10:00", end: "16:00" },
    ],
  },
  // FTI横浜店のスタッフ
  {
    id: "h5", name: "大西 翔平", storeId: "fti", storeName: "FTI横浜店",
    position: "ホール", rating: 3,
    availableSlots: [
      { dayIndex: 4, start: "17:00", end: "22:00" },
      { dayIndex: 6, start: "11:00", end: "15:00" },
    ],
  },
  {
    id: "h6", name: "田村 恵美", storeId: "fti", storeName: "FTI横浜店",
    position: "ホール", rating: 4,
    availableSlots: [
      { dayIndex: 5, start: "11:00", end: "16:00" },
      { dayIndex: 6, start: "17:00", end: "22:00" },
    ],
  },
  // CIAL桜木町店のスタッフ
  {
    id: "h7", name: "佐々木 健太", storeId: "cial", storeName: "CIAL桜木町店",
    position: "ホール", rating: 4,
    availableSlots: [
      { dayIndex: 0, start: "17:00", end: "22:00" },
      { dayIndex: 4, start: "17:00", end: "22:00" },
    ],
  },
  {
    id: "h8", name: "中島 龍太", storeId: "cial", storeName: "CIAL桜木町店",
    position: "キッチン", rating: 5,
    availableSlots: [
      { dayIndex: 5, start: "17:00", end: "22:00" },
      { dayIndex: 6, start: "10:00", end: "15:00" },
    ],
  },
  // 町田店のスタッフ
  {
    id: "h9", name: "森本 由美", storeId: "machida", storeName: "町田店",
    position: "ホール", rating: 4,
    availableSlots: [
      { dayIndex: 5, start: "10:00", end: "15:00" },
      { dayIndex: 6, start: "10:00", end: "15:00" },
    ],
  },
  {
    id: "h10", name: "岡田 拓也", storeId: "machida", storeName: "町田店",
    position: "キッチン", rating: 3,
    availableSlots: [
      { dayIndex: 4, start: "17:00", end: "22:00" },
      { dayIndex: 6, start: "17:00", end: "22:00" },
    ],
  },
]

// 店舗間の移動情報（横浜エリア内はJR・みなとみらい線・横浜市営地下鉄）
const travelInfo: Record<string, Record<string, { minutes: number; cost: number }>> = {
  bayquarter: {
    mores: { minutes: 10, cost: 180 },
    fti: { minutes: 12, cost: 180 },
    cial: { minutes: 15, cost: 200 },
    machida: { minutes: 40, cost: 570 },
  },
  mores: {
    bayquarter: { minutes: 10, cost: 180 },
    fti: { minutes: 8, cost: 180 },
    cial: { minutes: 12, cost: 200 },
    machida: { minutes: 35, cost: 570 },
  },
  fti: {
    bayquarter: { minutes: 12, cost: 180 },
    mores: { minutes: 8, cost: 180 },
    cial: { minutes: 10, cost: 200 },
    machida: { minutes: 38, cost: 570 },
  },
  cial: {
    bayquarter: { minutes: 15, cost: 200 },
    mores: { minutes: 12, cost: 200 },
    fti: { minutes: 10, cost: 200 },
    machida: { minutes: 42, cost: 640 },
  },
  machida: {
    bayquarter: { minutes: 40, cost: 570 },
    mores: { minutes: 35, cost: 570 },
    fti: { minutes: 38, cost: 570 },
    cial: { minutes: 42, cost: 640 },
  },
}

// ========== 最適化ロジック ==========
function runHelpOptimization(): {
  assignments: HelpAssignment[]
  steps: OptimizationStep[]
  resolvedCount: number
  totalSlots: number
} {
  // シフト一覧と同一のアサインデータを参照（lib/help-assignments.ts）
  const assignments: HelpAssignment[] = HELP_ASSIGNMENTS.map((a) => ({
    ...a,
    travelMinutes: a.travelMinutes ?? 0,
    transportCost: a.transportCost ?? 0,
  }))
  const steps: OptimizationStep[] = []
  const totalSlots = storesData.reduce((sum, store) => sum + store.helpSlots.length, 0)

  steps.push({
    title: "全店舗のヘルプ必要枠を集約",
    description: `5店舗合計 ${totalSlots} 枠のヘルプ必要枠を検出`,
    detail: storesData.map((s) => `${s.shortName}: ${s.helpSlots.length}枠`).join(" / "),
  })

  steps.push({
    title: "他店舗の空きスタッフを検索",
    description: `${availableHelpers.length}名のヘルプ可能スタッフを検出`,
    detail: storesData.map((s) => `${s.shortName}: ${availableHelpers.filter((h) => h.storeId === s.id).length}名`).join(" / "),
  })

  steps.push({
    title: "コスト最適な配置を計算",
    description: "移動コスト・スキル適合度・労働時間のバランスを最適化",
    detail: "横浜駅周辺3店舗は移動10〜15分と効率的。町田店は距離があるため優先度を調整",
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
      {/* ヘッダー（シフト作成のステップ4として表示） */}
      <div className="border-b">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Link href="/shifts/create" className="hover:text-gray-700">シフト作成</Link>
                <span>/</span>
                <span className="text-indigo-600 font-medium">ステップ4: ヘルプ枠の最適化とシフト確定</span>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/shifts/create">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <ChevronLeft className="h-4 w-4" />
                    シフト作成へ戻る
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-semibold text-gray-800">ヘルプ枠の最適化とシフト確定</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(weekStart, "yyyy年M月d日", { locale: ja })} 〜 {format(addDays(weekStart, 6), "M月d日", { locale: ja })}
                  </p>
                </div>
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
            {/* 店舗ごとのヘルプ時間枠と対応スタッフ */}
            <div className="space-y-4">
              {storesData.map((store) => {
                // この店舗のヘルプ時間枠に対して入れることができるスタッフをマッチング
                const getMatchingHelpers = (helpSlot: HelpSlot) => {
                  return availableHelpers.filter((helper) => {
                    // 同じ店舗のスタッフは除外
                    if (helper.storeId === store.id) return false
                    // ポジションが一致する必要がある
                    if (helper.position !== helpSlot.role) return false
                    // 同じ曜日で、時間が重なる必要がある
                    const matchingSlot = helper.availableSlots.find((slot) => {
                      if (slot.dayIndex !== helpSlot.dayIndex) return false
                      // 時間範囲が重なるかチェック
                      const helpStart = helpSlot.start
                      const helpEnd = helpSlot.end
                      const slotStart = slot.start
                      const slotEnd = slot.end
                      // 時間範囲が重なる条件: helpStart < slotEnd && helpEnd > slotStart
                      return helpStart < slotEnd && helpEnd > slotStart
                    })
                    return !!matchingSlot
                  })
                }

                // ポジション別にグルーピング
                const hallSlots = store.helpSlots.filter((slot) => slot.role === "ホール")
                const kitchenSlots = store.helpSlots.filter((slot) => slot.role === "キッチン")

                const renderSlotTable = (slots: HelpSlot[], position: "ホール" | "キッチン") => {
                  if (slots.length === 0) return null

                  return (
                    <div className="mb-4">
                      <div className={`px-4 py-2 border-b ${position === "ホール" ? "bg-blue-50" : "bg-emerald-50"}`}>
                        <Badge variant="outline" className={`text-xs ${
                          position === "ホール" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {position} ({slots.length}枠)
                        </Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="border-r p-3 text-left text-sm font-medium text-gray-600">日付</th>
                              <th className="border-r p-3 text-left text-sm font-medium text-gray-600">時間枠</th>
                              <th className="border-r p-3 text-center text-sm font-medium text-gray-600">不足人数</th>
                              <th className="p-3 text-left text-sm font-medium text-gray-600">対応可能スタッフ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {slots.map((helpSlot, slotIdx) => {
                              const matchingHelpers = getMatchingHelpers(helpSlot)
                              return (
                                <tr key={slotIdx} className="border-b hover:bg-gray-50">
                                  <td className="border-r p-3">
                                    <span className="text-sm font-medium text-gray-900">
                                      {format(weekDates[helpSlot.dayIndex], "M/d", { locale: ja })}
                                    </span>
                                  </td>
                                  <td className="border-r p-3">
                                    <span className="font-medium text-gray-900">{helpSlot.start}-{helpSlot.end}</span>
                                  </td>
                                  <td className="border-r p-3 text-center">
                                    <span className="text-sm font-medium text-red-600">{helpSlot.shortage}名</span>
                                  </td>
                                  <td className="p-3">
                                    {matchingHelpers.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {matchingHelpers.map((helper) => {
                                          const matchingSlot = helper.availableSlots.find((slot) => {
                                            if (slot.dayIndex !== helpSlot.dayIndex) return false
                                            const helpStart = helpSlot.start
                                            const helpEnd = helpSlot.end
                                            const slotStart = slot.start
                                            const slotEnd = slot.end
                                            return helpStart < slotEnd && helpEnd > slotStart
                                          })
                                          return (
                                            <div key={helper.id} className="flex items-center gap-2 border border-gray-200 rounded px-2 py-1 bg-white">
                                              <span className="text-sm font-medium text-gray-900">{helper.name}</span>
                                              <span className="text-xs text-gray-500">{helper.storeName}</span>
                                              {matchingSlot && (
                                                <span className="text-xs text-gray-500">
                                                  {matchingSlot.start}〜{matchingSlot.end}
                                                </span>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400">対応可能なスタッフなし</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={store.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="border-b bg-gray-50 px-4 py-3">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        {store.name}
                      </h3>
                    </div>
                    <div className="p-4">
                      {/* ホールセクション */}
                      {renderSlotTable(hallSlots, "ホール")}
                      {/* キッチンセクション */}
                      {renderSlotTable(kitchenSlots, "キッチン")}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 最適化ボタン */}
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                横浜・町田エリア 5店舗のヘルプ枠を一括で作成
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-lg mx-auto">
                各店舗の不足枠と空きスタッフを照合し、移動コスト・スキル適合度を考慮した最適なヘルプ配置を自動で提案します。
              </p>
              <Button size="lg" onClick={handleOptimize} className="gap-2">
                <Sparkles className="h-5 w-5" />
                一括作成を実行
              </Button>
            </div>
          </>
        )}

        {/* ===== 最適化中フェーズ ===== */}
        {phase === "optimizing" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
                <h3 className="text-xl font-semibold text-gray-900">ヘルプ一括作成中...</h3>
              </div>
              <Progress value={(currentStep / steps.length) * 100} className="h-3" />
              <p className="text-sm text-gray-600">
                ステップ {currentStep} / {steps.length}
              </p>

              <div className="space-y-3">
                {steps.slice(0, currentStep).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
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
            <div className="bg-white rounded-lg shadow-sm border p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">最適化完了</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <p className="text-sm text-gray-600">ヘルプ配置数</p>
                  <p className="text-2xl font-bold text-gray-900">{resolvedCount}件</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <p className="text-sm text-gray-600">対象スタッフ</p>
                  <p className="text-2xl font-bold text-gray-900">{new Set(assignments.map((a) => a.helperId)).size}名</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <p className="text-sm text-gray-600">交通費合計</p>
                  <p className="text-2xl font-bold text-gray-900">¥{totalTransportCost.toLocaleString()}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <p className="text-sm text-gray-600">充足率</p>
                  <p className="text-2xl font-bold text-gray-900">{((resolvedCount / totalSlots) * 100).toFixed(0)}%</p>
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <p className="text-base font-semibold text-gray-900">シフトを確定しました</p>
                <Button asChild className="gap-2">
                  <Link href="/shifts">
                    <CalendarDays className="h-4 w-4" />
                    シフト一覧で確認
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* 店舗別のヘルプ配置結果 */}
            {storesData.map((store) => {
              const storeHelp = storeAssignments(store.id)
              if (storeHelp.length === 0) return null
              return (
                <div key={store.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="border-b bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        {store.name} へのヘルプ配置
                      </h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
                              <span className="text-gray-700">{assignment.fromStoreName}</span>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">{store.shortName}</span>
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
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="border-b bg-gray-50 px-4 py-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-gray-600" />
                  店舗間ヘルプフロー
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
                  {storesData.map((store) => {
                    const incoming = assignments.filter((a) => a.toStoreId === store.id)
                    const outgoing = assignments.filter((a) => a.fromStoreId === store.id)
                    return (
                      <div key={store.id} className="border border-gray-200 rounded-lg p-3 text-center bg-white">
                        <MapPin className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                        <h4 className="font-semibold text-gray-800 text-sm">{store.shortName}</h4>
                        <div className="mt-2 space-y-1.5">
                          {incoming.length > 0 && (
                            <div className="border border-gray-200 rounded p-1.5 bg-white">
                              <div className="text-[10px] text-gray-600 font-medium">受入</div>
                              <div className="text-base font-bold text-gray-900">{incoming.length}名</div>
                            </div>
                          )}
                          {outgoing.length > 0 && (
                            <div className="border border-gray-200 rounded p-1.5 bg-white">
                              <div className="text-[10px] text-gray-600 font-medium">派遣</div>
                              <div className="text-base font-bold text-gray-900">{outgoing.length}名</div>
                            </div>
                          )}
                          <div className="border border-gray-200 rounded p-1.5 bg-white">
                            <div className="text-[10px] text-gray-600">元の不足</div>
                            <div className="text-base font-bold text-red-600">{store.helpSlots.length}枠</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* フロー矢印 */}
                <div className="mt-6 space-y-2">
                  {assignments.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-4 py-2 max-w-4xl mx-auto border border-gray-200">
                      <span className="text-gray-700">{a.fromStoreName}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{storesData.find((s) => s.id === a.toStoreId)?.shortName}</span>
                      <span className="text-gray-700 font-medium">{a.helperName}</span>
                      <span className="text-gray-500 text-xs">
                        {DAY_LABELS[a.dayIndex]} {a.start}〜{a.end} ({a.role})
                      </span>
                      <span className="text-gray-400 text-xs ml-auto">
                        <Train className="h-3 w-3 inline mr-0.5" />{a.travelMinutes}分 ¥{a.transportCost}
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
