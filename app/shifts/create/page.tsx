"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { format, startOfMonth, subMonths, addMonths, addDays, startOfWeek } from "date-fns"
import { ja } from "date-fns/locale"
import {
  Send, Save, Plus, Minus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Sparkles, X, Cloud, Sun, CloudRain, CloudSun, Mail,
  Users, TrendingUp, DollarSign, BarChart3, ArrowRight, CheckCircle2,
  AlertTriangle, Clock, CalendarDays, Train, HandHelping, Eye, EyeOff,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { StatCard } from "@/components/stat-card"
import { useToast } from "@/components/toast"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { HELP_ASSIGNMENTS } from "@/lib/help-assignments"
import { getPositionColor, getEmploymentColor } from "@/lib/mock-data/staff"
import {
  type DayStaffing, type HourlyStaffing, type KpiSummary,
  OPERATING_HOURS, HOURLY_WAGE_HALL, HOURLY_WAGE_KITCHEN,
  isPeakHour, getPeriodRange, generatePeriodData, generateAIProposal,
  generatePeriodDataFromForecasts,
  calculateKpis, analyzeProblemCells, getDeviations,
} from "@/lib/shift-create-data"
import { useStoreContext } from "@/lib/hooks/use-store-context"
import { useDemandForecasts, useForecastGeneration, useShiftOptimization } from "@/lib/hooks/use-demand-forecast"

// ========== 天気アイコン ==========
const WeatherIcon = ({ icon, className = "h-4 w-4" }: { icon: string; className?: string }) => {
  switch (icon) {
    case "sun": return <Sun className={`${className} text-orange-500`} />
    case "cloud": return <Cloud className={`${className} text-gray-500`} />
    case "cloud-sun": return <CloudSun className={`${className} text-amber-500`} />
    case "rain": return <CloudRain className={`${className} text-blue-500`} />
    default: return <Sun className={`${className} text-orange-500`} />
  }
}

// ========== ステップ定義 ==========
type WizardStep = 1 | 2 | 3 | 4 | 5
const STEPS = [
  { step: 1 as const, label: "需要予測", description: "時間帯別の需要予測を確認" },
  { step: 2 as const, label: "人員計画", description: "推奨人員数を調整" },
  { step: 3 as const, label: "提出確認", description: "提出状況確認とAI最適化" },
  { step: 4 as const, label: "シフト確認", description: "AI結果を確認・提出" },
  { step: 5 as const, label: "ヘルプ最適化", description: "ヘルプ配置と確定" },
]

// ========== ヘルプ最適化用ステップ ==========
const OPTIMIZATION_STEPS = [
  { title: "ヘルプ必要枠を集約", description: "ベイクォーター店の不足枠を検出" },
  { title: "空きスタッフを検索", description: "近隣店舗のヘルプ可能スタッフを照合" },
  { title: "コスト最適な配置を計算", description: "移動コスト・スキル適合度を最適化" },
  { title: "ヘルプ配置の決定", description: "最適なヘルプ配置を決定" },
]

// ========== AIシフト最適化ステップ ==========
const AI_SHIFT_STEPS = [
  { label: "需要予測データを分析中..." },
  { label: "従業員の希望・制約を反映中..." },
  { label: "最適なシフトを計算中..." },
  { label: "シフト案を生成完了" },
]

// ========== スタッフ提出状況モックデータ ==========
interface StaffSubmission {
  staffId: string
  name: string
  position: "ホール" | "キッチン" | "両方"
  role: string
  employmentType: "正社員" | "パート" | "アルバイト"
  submissionType: "休暇希望" | "出勤希望"
  submitted: boolean
  submittedAt?: string
  requestedDaysOff?: number[]
  availableDays?: { day: number; start: string; end: string }[]
  availableSummary?: string
}

const STAFF_SUBMISSIONS: StaffSubmission[] = [
  // 正社員 — 休暇希望日を回答
  { staffId: "1", name: "佐藤 一郎", position: "両方", role: "店長", employmentType: "正社員", submissionType: "休暇希望", submitted: true, submittedAt: "2026-02-22", requestedDaysOff: [1, 5, 8, 15] },
  { staffId: "4", name: "山田 太郎", position: "ホール", role: "マネージャー", employmentType: "正社員", submissionType: "休暇希望", submitted: true, submittedAt: "2026-02-21", requestedDaysOff: [4, 11] },
  { staffId: "6", name: "渡辺 直樹", position: "キッチン", role: "チーフ", employmentType: "正社員", submissionType: "休暇希望", submitted: true, submittedAt: "2026-02-24", requestedDaysOff: [7, 8] },
  // パート・アルバイト — 出勤可能日と希望時間帯を回答
  { staffId: "2", name: "田中 花子", position: "ホール", role: "スタッフ", employmentType: "パート", submissionType: "出勤希望", submitted: true, submittedAt: "2026-02-20",
    availableSummary: "週4日",
    availableDays: [
      { day: 2, start: "10:00", end: "16:00" }, { day: 3, start: "10:00", end: "16:00" },
      { day: 4, start: "10:00", end: "16:00" }, { day: 7, start: "11:00", end: "17:00" },
      { day: 9, start: "10:00", end: "16:00" }, { day: 10, start: "10:00", end: "16:00" },
      { day: 11, start: "10:00", end: "16:00" }, { day: 14, start: "11:00", end: "17:00" },
    ] },
  { staffId: "3", name: "鈴木 健太", position: "キッチン", role: "スタッフ", employmentType: "アルバイト", submissionType: "出勤希望", submitted: true, submittedAt: "2026-02-23",
    availableSummary: "週3日",
    availableDays: [
      { day: 2, start: "17:00", end: "22:00" }, { day: 4, start: "17:00", end: "22:00" },
      { day: 6, start: "17:00", end: "22:00" }, { day: 9, start: "17:00", end: "22:00" },
      { day: 11, start: "17:00", end: "22:00" }, { day: 13, start: "17:00", end: "22:00" },
    ] },
  { staffId: "5", name: "伊藤 美咲", position: "ホール", role: "スタッフ", employmentType: "アルバイト", submissionType: "出勤希望", submitted: false },
]

// ========== メインコンポーネント ==========
export default function ShiftCreation() {
  const today = new Date()
  const router = useRouter()
  const { showToast } = useToast()
  const { selectedStore } = useStoreContext()
  const storeId = selectedStore?.id || ""

  // ウィザード状態
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // 期間状態
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(today))
  const [periodHalf, setPeriodHalf] = useState<"first" | "second">(() => (today.getDate() <= 15 ? "first" : "second"))

  // データ状態
  const [periodData, setPeriodData] = useState<DayStaffing[]>([])
  const [expandedForecastDays, setExpandedForecastDays] = useState<Set<number>>(new Set())
  const [expandedHours, setExpandedHours] = useState<Set<number>>(new Set(OPERATING_HOURS))
  const [showProblemsOnly, setShowProblemsOnly] = useState(true)
  const [showAIProposal, setShowAIProposal] = useState(false)
  const [aiProposalData, setAIProposalData] = useState<DayStaffing[]>([])

  // ステップ3: 差異リスト表示数
  const [showAllDeviations, setShowAllDeviations] = useState(false)

  // ステップ4: ヘルプ最適化
  const [helpPhase, setHelpPhase] = useState<"overview" | "optimizing" | "result">("overview")
  const [optimizationStep, setOptimizationStep] = useState(0)

  // AI最適化アニメーション
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [aiOptPhase, setAiOptPhase] = useState(0)

  const { start: periodStart, end: periodEnd } = useMemo(() => getPeriodRange(currentMonth, periodHalf), [currentMonth, periodHalf])

  // DB予測データ取得
  const startDateStr = format(periodStart, "yyyy-MM-dd")
  const endDateStr = format(periodEnd, "yyyy-MM-dd")
  const { forecasts } = useDemandForecasts(storeId, startDateStr, endDateStr)
  const { generateForecast, generating: forecastGenerating } = useForecastGeneration()
  const { optimizeShifts: optimizeShiftsApi, confirmShifts, optimizing: shiftOptimizing } = useShiftOptimization()

  // DB予測データがあればそれを使い、なければモックデータにフォールバック
  useEffect(() => {
    if (forecasts.length > 0) {
      const data = generatePeriodDataFromForecasts(forecasts)
      setPeriodData(data)
      setAIProposalData(generateAIProposal(data))
    } else {
      const data = generatePeriodData(periodStart, periodEnd)
      setPeriodData(data)
      setAIProposalData(generateAIProposal(data))
    }
  }, [forecasts, periodStart, periodEnd])

  // KPI計算
  const kpis = useMemo(() => calculateKpis(periodData), [periodData])
  const recommendedKpis = useMemo(() => calculateKpis(aiProposalData), [aiProposalData])
  const problems = useMemo(() => analyzeProblemCells(periodData), [periodData])
  const deviations = useMemo(() => getDeviations(periodData), [periodData])

  // ベイクォーター店のヘルプアサイン
  const bayquarterHelp = useMemo(() => HELP_ASSIGNMENTS.filter(a => a.toStoreId === "bayquarter"), [])
  const totalTransportCost = useMemo(() => bayquarterHelp.reduce((sum, a) => sum + (a.transportCost || 0), 0), [bayquarterHelp])
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), [])
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"]

  // ヘルプ必要枠（曜日ベース → dayOfWeek: 0=日,1=月,...6=土）
  const HELP_SHORTAGE_SLOTS = [
    { dayOfWeek: 1, start: "19:00", end: "21:00", role: "ホール" as const, shortage: 1 },
    { dayOfWeek: 1, start: "19:00", end: "22:00", role: "キッチン" as const, shortage: 1 },
    { dayOfWeek: 3, start: "19:00", end: "21:00", role: "ホール" as const, shortage: 1 },
    { dayOfWeek: 5, start: "19:00", end: "21:00", role: "ホール" as const, shortage: 1 },
    { dayOfWeek: 5, start: "19:00", end: "22:00", role: "キッチン" as const, shortage: 1 },
    { dayOfWeek: 6, start: "11:00", end: "14:00", role: "ホール" as const, shortage: 2 },
    { dayOfWeek: 6, start: "19:00", end: "22:00", role: "キッチン" as const, shortage: 1 },
    { dayOfWeek: 0, start: "11:00", end: "14:00", role: "ホール" as const, shortage: 1 },
    { dayOfWeek: 0, start: "18:00", end: "21:00", role: "キッチン" as const, shortage: 1 },
  ]

  // 仮シフト表データ生成
  const previewShiftData = useMemo(() => {
    if (periodData.length === 0) return { staffRows: [], helpRows: [], dates: [] }

    const dates = periodData.map(d => d.date)

    // スタッフ行
    const staffRows = STAFF_SUBMISSIONS.map(staff => {
      const shifts: (string | null)[] = dates.map((date) => {
        const dayNum = date.getDate()
        if (staff.employmentType === "正社員") {
          if (staff.requestedDaysOff?.includes(dayNum)) return null
          return "11-22"
        }
        if (!staff.submitted) return null
        const available = staff.availableDays?.find(a => a.day === dayNum)
        if (!available) return null
        return `${available.start.replace(":00", "")}-${available.end.replace(":00", "")}`
      })
      return { ...staff, shifts }
    })

    // ヘルプ行（日付ごとにヘルプ枠を集約）
    type HelpCell = { role: string; start: string; end: string; shortage: number }[]
    const helpByDate: HelpCell[] = dates.map((date) => {
      const dow = date.getDay()
      return HELP_SHORTAGE_SLOTS.filter(s => s.dayOfWeek === dow).map(s => ({
        role: s.role, start: s.start, end: s.end, shortage: s.shortage,
      }))
    })

    return { staffRows, helpRows: helpByDate, dates }
  }, [periodData])

  // 注目日のフラグ
  const flaggedDays = useMemo(() =>
    periodData.filter(d => d.event || d.isHoliday || d.weather.icon === "rain"), [periodData])

  // 日別客数チャートデータ
  const dailyChartData = useMemo(() =>
    periodData.map(d => ({
      date: format(d.date, "d日", { locale: ja }),
      customers: d.forecastCustomers,
      isWeekend: d.date.getDay() === 0 || d.date.getDay() === 6,
    })), [periodData])

  // 提出状況の集計
  const submissionStats = useMemo(() => {
    const total = STAFF_SUBMISSIONS.length
    const submitted = STAFF_SUBMISSIONS.filter(s => s.submitted).length
    return { total, submitted, percentage: Math.round((submitted / total) * 100) }
  }, [])

  // 時間帯別平均予測データ
  const hourlyAverages = useMemo(() => {
    if (periodData.length === 0) return []
    return OPERATING_HOURS.map(hour => {
      const avgCustomers = Math.round(periodData.reduce((sum, d) => sum + d.hourlyForecast[hour].customers, 0) / periodData.length)
      const avgSales = Math.round(periodData.reduce((sum, d) => sum + d.hourlyForecast[hour].sales, 0) / periodData.length)
      const avgSpend = Math.round(periodData.reduce((sum, d) => sum + d.hourlyForecast[hour].avgSpend, 0) / periodData.length)
      const suggestedHall = Math.round(periodData.reduce((sum, d) => sum + d.hourlyForecast[hour].suggestedHall, 0) / periodData.length * 10) / 10
      const suggestedKitchen = Math.round(periodData.reduce((sum, d) => sum + d.hourlyForecast[hour].suggestedKitchen, 0) / periodData.length * 10) / 10
      return { hour, avgCustomers, avgSales, avgSpend, suggestedHall, suggestedKitchen, isPeak: isPeakHour(hour) }
    })
  }, [periodData])

  const submissionDeadline = useMemo(() => addDays(periodStart, -5), [periodStart])
  const daysUntilDeadline = useMemo(() => {
    const diff = Math.ceil((submissionDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [submissionDeadline])

  // ========== ハンドラー ==========
  const hasProblem = (dayIndex: number, hour: number, position: "hall" | "kitchen") => {
    if (!periodData[dayIndex]) return false
    const day = periodData[dayIndex]
    const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
    const currentCount = staffing[hour] || 0
    const suggested = position === "hall" ? day.hourlyForecast[hour].suggestedHall : day.hourlyForecast[hour].suggestedKitchen
    return currentCount !== suggested
  }

  const handlePrevPeriod = () => {
    if (currentStep >= 2 && !window.confirm("期間を変更すると編集内容がリセットされます。よろしいですか？")) return
    if (periodHalf === "first") { setCurrentMonth(subMonths(currentMonth, 1)); setPeriodHalf("second") }
    else { setPeriodHalf("first") }
  }
  const handleNextPeriod = () => {
    if (currentStep >= 2 && !window.confirm("期間を変更すると編集内容がリセットされます。よろしいですか？")) return
    if (periodHalf === "second") { setCurrentMonth(addMonths(currentMonth, 1)); setPeriodHalf("first") }
    else { setPeriodHalf("second") }
  }
  const handleThisPeriod = () => {
    if (currentStep >= 2 && !window.confirm("期間を変更すると編集内容がリセットされます。よろしいですか？")) return
    setCurrentMonth(startOfMonth(today)); setPeriodHalf(today.getDate() <= 15 ? "first" : "second")
  }

  const handleStaffCountChange = (dayIndex: number, hour: number, position: "hall" | "kitchen", change: number) => {
    setPeriodData((prev) => {
      const newData = [...prev]
      const staffingKey = position === "hall" ? "hallStaffing" : "kitchenStaffing"
      const currentCount = newData[dayIndex][staffingKey][hour] || 0
      newData[dayIndex] = {
        ...newData[dayIndex],
        [staffingKey]: { ...newData[dayIndex][staffingKey], [hour]: Math.max(0, currentCount + change) },
      }
      return newData
    })
  }

  const handleDirectInput = (dayIndex: number, hour: number, position: "hall" | "kitchen", value: string) => {
    const count = Number.parseInt(value) || 0
    setPeriodData((prev) => {
      const newData = [...prev]
      const staffingKey = position === "hall" ? "hallStaffing" : "kitchenStaffing"
      newData[dayIndex] = {
        ...newData[dayIndex],
        [staffingKey]: { ...newData[dayIndex][staffingKey], [hour]: Math.max(0, count) },
      }
      return newData
    })
  }

  const toggleHourExpansion = (hour: number) => {
    setExpandedHours((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(hour)) newSet.delete(hour)
      else newSet.add(hour)
      return newSet
    })
  }

  const applyAIProposal = () => { setPeriodData(aiProposalData); setShowAIProposal(false) }

  // ステップ遷移
  const goToStep = (step: WizardStep) => {
    setCurrentStep(step)
    // スクロールコンテナ（main要素）を先頭に戻す
    const scrollContainer = document.querySelector("main")
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }
  const handleConfirmForecast = () => {
    setCompletedSteps(prev => new Set([...prev, 1]))
    goToStep(2)
  }
  const handleSendSubmissionRequest = () => {
    setCompletedSteps(prev => new Set([...prev, 2]))
    goToStep(3)
    showToast("スタッフにシフト提出依頼を送信しました", "info")
  }
  const handleAIOptimize = async () => {
    setIsOptimizing(true)
    setAiOptPhase(0)

    try {
      // ステップ1: 需要予測
      setAiOptPhase(1)
      if (storeId && forecasts.length === 0) {
        await generateForecast(storeId, startDateStr, endDateStr)
      }
      await new Promise(r => setTimeout(r, 800))

      // ステップ2: スタッフ希望反映
      setAiOptPhase(2)
      await new Promise(r => setTimeout(r, 800))

      // ステップ3: 最適化API呼び出し
      setAiOptPhase(3)
      if (storeId) {
        try {
          await optimizeShiftsApi(storeId, startDateStr, endDateStr)
        } catch {
          // APIが失敗してもモックで続行
        }
      }
      await new Promise(r => setTimeout(r, 800))

      // ステップ4: 完了
      setAiOptPhase(4)
      await new Promise(r => setTimeout(r, 600))

      setPeriodData(aiProposalData)
    } catch (e: any) {
      showToast(`最適化エラー: ${e.message}`, "error")
    }

    setIsOptimizing(false)
    setCompletedSteps(prev => new Set([...prev, 3]))
    goToStep(4)
    showToast("AIが最適なシフトを作成しました")
  }
  const handleSkipToReview = () => {
    setCompletedSteps(prev => new Set([...prev, 3]))
    goToStep(4)
  }
  const handleSubmit = () => {
    setCompletedSteps(prev => new Set([...prev, 4]))
    goToStep(5)
    showToast("シフトを提出しました")
  }
  const handleSaveDraft = () => { showToast("下書きを保存しました") }
  const handleFinalize = () => {
    showToast("シフトを確定しました")
    router.push("/shifts")
  }

  // ヘルプ最適化実行
  const handleOptimize = async () => {
    setHelpPhase("optimizing")
    setOptimizationStep(0)
    for (let i = 0; i < OPTIMIZATION_STEPS.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setOptimizationStep(i + 1)
    }
    await new Promise((resolve) => setTimeout(resolve, 800))
    setHelpPhase("result")
  }

  if (periodData.length === 0) return null

  const periodLabel = `${format(currentMonth, "yyyy年M月", { locale: ja })} ${periodHalf === "first" ? "前半（1〜15日）" : "後半（16日〜末日）"}`

  // ========== シフトテーブル ==========
  const renderShiftTable = (position: "hall" | "kitchen", title: string, hours: number, bg: string) => {
    const dataToShow = showAIProposal ? aiProposalData : periodData
    const wage = position === "hall" ? HOURLY_WAGE_HALL : HOURLY_WAGE_KITCHEN

    return (
      <div key={position} className={`rounded-lg border overflow-hidden ${bg}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white/60 backdrop-blur">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <Badge variant="secondary">{hours}h</Badge>
            <span className="text-xs text-gray-500">@¥{wage.toLocaleString()}/h</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 z-10 bg-gray-50 border-b border-r p-2 text-center font-medium text-gray-600 w-24">
                  <div className="text-xs">時間</div>
                </th>
                {periodData.map((day, dayIndex) => {
                  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
                  const isSpecialDay = isWeekend || day.isHoliday
                  return (
                    <th key={dayIndex} className={`border-b border-r p-2 text-center min-w-[120px] ${isSpecialDay ? "bg-red-50" : "bg-gray-50"}`}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-xs ${isSpecialDay ? "text-red-600" : "text-gray-500"}`}>
                          {format(day.date, "E", { locale: ja })}
                        </span>
                        <span className={`text-base font-bold ${isSpecialDay ? "text-red-600" : "text-gray-800"}`}>
                          {format(day.date, "d")}
                        </span>
                        <div className="flex items-center gap-1">
                          <WeatherIcon icon={day.weather.icon} className="h-3 w-3" />
                          <span className="text-[10px] text-gray-500">{day.weather.label}</span>
                        </div>
                        {day.isHoliday && <span className="text-[9px] text-red-600">{day.holidayName}</span>}
                        <span className="text-[10px] text-gray-500">予測 {day.forecastCustomers}人</span>
                      </div>
                    </th>
                  )
                })}
                <th className="border-b p-2 text-center font-medium text-gray-600 w-16 bg-gray-100">合計</th>
              </tr>
            </thead>
            <tbody>
              {OPERATING_HOURS.map((hour) => {
                const hourTotal = periodData.reduce((sum, day) => {
                  const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
                  return sum + (staffing[hour] || 0)
                }, 0)
                const hasProblemInHour = periodData.some((_, dayIndex) => hasProblem(dayIndex, hour, position))
                const isExpanded = expandedHours.has(hour)
                const shouldShow = !showProblemsOnly || hasProblemInHour
                if (!shouldShow && !isExpanded) return null
                const peak = isPeakHour(hour)

                return (
                  <tr
                    key={hour}
                    className={`hover:bg-gray-50/50 ${hasProblemInHour ? "bg-amber-50/30" : ""} ${!isExpanded && !hasProblemInHour ? "hidden" : ""} ${peak ? "border-l-4 border-l-amber-400" : ""}`}
                  >
                    <td className={`sticky left-0 z-10 border-b border-r p-1.5 text-center ${peak ? "bg-amber-50" : "bg-white"}`}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => toggleHourExpansion(hour)} className="p-0.5 hover:bg-gray-100 rounded">
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-500" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-500" />}
                        </button>
                        <div>
                          <span className="text-sm font-medium text-gray-700">{hour}:00</span>
                          {peak && <div className="text-[8px] text-amber-600 font-medium">ピーク</div>}
                        </div>
                      </div>
                    </td>
                    {dataToShow.map((day, dayIndex) => {
                      const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
                      const currentCount = staffing[hour] || 0
                      const forecast = day.hourlyForecast[hour]
                      const suggested = position === "hall" ? forecast.suggestedHall : forecast.suggestedKitchen
                      const diff = currentCount - suggested
                      const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
                      const isSpecialDay = isWeekend || day.isHoliday
                      const isProblemCell = diff !== 0

                      return (
                        <td
                          key={dayIndex}
                          className={`border-b border-r p-1 ${isSpecialDay ? "bg-red-50/30" : ""} ${showAIProposal && isProblemCell ? "ring-2 ring-blue-300" : ""}`}
                        >
                          <div className="flex flex-col items-center">
                            <div className="text-[9px] text-gray-400 mb-0.5">
                              {forecast.customers}人 × ¥{forecast.avgSpend.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Button
                                variant="ghost" size="sm"
                                className="h-9 w-9 min-h-[36px] min-w-[36px] p-0 rounded-full hover:bg-gray-200"
                                onClick={() => handleStaffCountChange(dayIndex, hour, position, -1)}
                                disabled={currentCount <= 0 || showAIProposal}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number" value={currentCount}
                                onChange={(e) => handleDirectInput(dayIndex, hour, position, e.target.value)}
                                className="w-10 h-9 text-center text-sm font-semibold p-0 border-gray-200"
                                min="0" disabled={showAIProposal}
                              />
                              <Button
                                variant="ghost" size="sm"
                                className="h-9 w-9 min-h-[36px] min-w-[36px] p-0 rounded-full hover:bg-gray-200"
                                onClick={() => handleStaffCountChange(dayIndex, hour, position, 1)}
                                disabled={showAIProposal}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
                              <span>推奨{suggested}</span>
                              {diff !== 0 && (
                                <span className={`px-1 rounded font-medium ${diff < 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                  {diff > 0 ? `+${diff}` : diff}
                                </span>
                              )}
                              {diff === 0 && (
                                <span className="text-green-600 px-1 rounded bg-green-50 font-medium">OK</span>
                              )}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                    <td className="border-b p-2 text-center font-medium bg-gray-50 text-sm">{hourTotal}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100">
                <td className="sticky left-0 z-10 bg-gray-100 border-t p-2 text-center font-semibold text-sm">日計</td>
                {periodData.map((day, dayIndex) => {
                  const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
                  const total = Object.values(staffing).reduce((s, v) => s + v, 0)
                  return (
                    <td key={dayIndex} className="border-t border-r p-2 text-center">
                      <div className="font-bold text-sm">{total}h</div>
                      <div className="text-[10px] text-gray-500">¥{(total * wage).toLocaleString()}</div>
                    </td>
                  )
                })}
                <td className="border-t p-2 text-center bg-gray-200">
                  <div className="font-bold text-sm">
                    {periodData.reduce((sum, day) => {
                      const staffing = position === "hall" ? day.hallStaffing : day.kitchenStaffing
                      return sum + Object.values(staffing).reduce((s, v) => s + v, 0)
                    }, 0)}h
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  // ========== レンダリング ==========
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* ========== ステッパーヘッダー（コンパクト） ========== */}
      <div className="bg-white border-b">
        <div className="px-4 py-2.5 sm:px-6 flex items-center gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-base font-semibold text-gray-800 leading-tight">シフト作成</h1>
            <p className="text-[11px] text-gray-500">{periodLabel}　{periodData.length}日間</p>
          </div>
          <div className="flex items-center flex-1 max-w-xl">
            {STEPS.map((item, i) => (
              <div key={item.step} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => (completedSteps.has(item.step) || item.step === currentStep) && goToStep(item.step)}
                  disabled={!completedSteps.has(item.step) && item.step !== currentStep}
                  className="flex items-center gap-1.5 group"
                >
                  <span className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all flex-shrink-0",
                    completedSteps.has(item.step) && item.step !== currentStep && "bg-indigo-600 text-white cursor-pointer group-hover:bg-indigo-700",
                    item.step === currentStep && "bg-indigo-600 text-white ring-2 ring-indigo-100",
                    !completedSteps.has(item.step) && item.step !== currentStep && "bg-gray-100 text-gray-400 border border-dashed border-gray-300",
                  )}>
                    {completedSteps.has(item.step) && item.step !== currentStep
                      ? <CheckCircle2 className="h-3.5 w-3.5" />
                      : item.step}
                  </span>
                  <span className={cn(
                    "text-xs hidden sm:block whitespace-nowrap",
                    item.step === currentStep ? "font-bold text-indigo-700" : "text-gray-400"
                  )}>
                    {item.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 flex-1 mx-1.5 transition-colors",
                    completedSteps.has(item.step) ? "bg-indigo-600" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ========== ステップ1: 需要予測確認 ========== */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">需要予測確認</h2>
              <p className="text-sm text-gray-500 mt-1">時間帯別の需要予測データを確認し、必要人員数の計画に進みます。</p>
            </div>

            {/* 期間セレクター */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevPeriod}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleThisPeriod}>
                {periodHalf === "first" ? "今月の前半" : "今月の後半"}
              </Button>
              <span className="text-sm font-medium px-3 py-1.5 bg-gray-100 rounded">{periodLabel}</span>
              <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                <button type="button" onClick={() => setPeriodHalf("first")}
                  className={cn("px-3 py-1.5 text-sm font-medium rounded-md", periodHalf === "first" ? "bg-white shadow text-gray-900" : "text-gray-600")}>
                  前半
                </button>
                <button type="button" onClick={() => setPeriodHalf("second")}
                  className={cn("px-3 py-1.5 text-sm font-medium rounded-md", periodHalf === "second" ? "bg-white shadow text-gray-900" : "text-gray-600")}>
                  後半
                </button>
              </div>
              <span className="text-sm text-gray-600">
                {format(periodStart, "M/d", { locale: ja })} 〜 {format(periodEnd, "M/d", { locale: ja })}（{periodData.length}日間）
              </span>
              <Button variant="outline" size="sm" onClick={handleNextPeriod}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* KPIサマリー */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">需要予測サマリー</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={TrendingUp} iconColor="text-indigo-600" label="期間予測売上" value={`¥${kpis.totalSales.toLocaleString()}`} bgColor="bg-indigo-50" borderColor="border-indigo-100" />
                <StatCard icon={Users} iconColor="text-cyan-600" label="期間予測客数" value={`${kpis.totalCustomers.toLocaleString()}人`} subtext={`平均 ${kpis.avgCustomersPerDay}人/日`} bgColor="bg-cyan-50" borderColor="border-cyan-100" />
                <StatCard icon={DollarSign} iconColor="text-gray-600" label="予測人件費（推奨値）" value={`¥${recommendedKpis.laborCost.toLocaleString()}`} subtext={`${recommendedKpis.totalHours}h（ホール${recommendedKpis.hallTotal}h/キッチン${recommendedKpis.kitchenTotal}h）`} />
                <StatCard icon={BarChart3} iconColor={recommendedKpis.laborCostRatio <= 25 ? "text-green-600" : "text-amber-600"} label="予測人件費率" value={`${recommendedKpis.laborCostRatio.toFixed(1)}%`} subtext="目標: 25.0%以下" bgColor={recommendedKpis.laborCostRatio <= 25 ? "bg-green-50" : "bg-amber-50"} borderColor={recommendedKpis.laborCostRatio <= 25 ? "border-green-200" : "border-amber-200"} />
              </div>
            </div>

            {/* 日別予測一覧 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">日別需要予測</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b text-xs text-gray-600">
                      <th className="p-2.5 text-left font-medium w-8"></th>
                      <th className="p-2.5 text-left font-medium">日付</th>
                      <th className="p-2.5 text-center font-medium w-16">天気</th>
                      <th className="p-2.5 text-right font-medium">予測客数</th>
                      <th className="p-2.5 text-right font-medium">予測売上</th>
                      <th className="p-2.5 text-center font-medium">推奨ホール</th>
                      <th className="p-2.5 text-center font-medium">推奨キッチン</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodData.map((day, dayIndex) => {
                      const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
                      const isSpecialDay = isWeekend || day.isHoliday
                      const isExpanded = expandedForecastDays.has(dayIndex)
                      const daySales = OPERATING_HOURS.reduce((sum, h) => sum + day.hourlyForecast[h].sales, 0)
                      const dayHallTotal = OPERATING_HOURS.reduce((sum, h) => sum + day.hourlyForecast[h].suggestedHall, 0)
                      const dayKitchenTotal = OPERATING_HOURS.reduce((sum, h) => sum + day.hourlyForecast[h].suggestedKitchen, 0)

                      return (
                        <React.Fragment key={dayIndex}>
                          {/* 日別サマリー行 */}
                          <tr
                            className={cn(
                              "border-b text-sm cursor-pointer transition-colors",
                              isSpecialDay ? "bg-red-50/40" : "hover:bg-gray-50",
                              isExpanded && "bg-indigo-50/30"
                            )}
                            onClick={() => setExpandedForecastDays(prev => {
                              const next = new Set(prev)
                              if (next.has(dayIndex)) next.delete(dayIndex); else next.add(dayIndex)
                              return next
                            })}
                          >
                            <td className="p-2 text-center">
                              {isExpanded
                                ? <ChevronUp className="h-4 w-4 text-gray-400 mx-auto" />
                                : <ChevronDown className="h-4 w-4 text-gray-400 mx-auto" />}
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-2">
                                <span className={cn("font-medium", isSpecialDay ? "text-red-600" : "text-gray-800")}>
                                  {format(day.date, "M/d (E)", { locale: ja })}
                                </span>
                                {day.isHoliday && <Badge variant="secondary" className="text-[9px] bg-red-50 text-red-700 px-1 py-0">{day.holidayName}</Badge>}
                                {day.event && <Badge variant="secondary" className="text-[9px] bg-amber-50 text-amber-700 px-1 py-0">{day.event}</Badge>}
                                {day.weather.icon === "rain" && <Badge variant="secondary" className="text-[9px] bg-blue-50 text-blue-700 px-1 py-0">雨天</Badge>}
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <WeatherIcon icon={day.weather.icon} className="h-3.5 w-3.5" />
                                <span className="text-xs text-gray-500">{day.weather.tempHigh}°</span>
                              </div>
                            </td>
                            <td className="p-2.5 text-right font-medium text-gray-800 tabular-nums">{day.forecastCustomers}人</td>
                            <td className="p-2.5 text-right font-medium text-gray-800 tabular-nums">¥{daySales.toLocaleString()}</td>
                            <td className="p-2.5 text-center">
                              <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-medium rounded px-2 py-0.5 text-xs">
                                {dayHallTotal}h
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 font-medium rounded px-2 py-0.5 text-xs">
                                {dayKitchenTotal}h
                              </span>
                            </td>
                          </tr>
                          {/* 時間帯詳細（展開時） */}
                          {isExpanded && OPERATING_HOURS.map((hour) => {
                            const hf = day.hourlyForecast[hour]
                            const peak = isPeakHour(hour)
                            return (
                              <tr key={`${dayIndex}-${hour}`} className={cn(
                                "border-b text-xs",
                                peak ? "bg-amber-50/40 border-l-4 border-l-amber-400" : "bg-gray-50/50"
                              )}>
                                <td className="p-1.5"></td>
                                <td className="p-1.5 pl-6 text-gray-600">
                                  <div className="flex items-center gap-1.5">
                                    {hour}:00
                                    {peak && <Badge variant="secondary" className="text-[8px] bg-amber-100 text-amber-700 px-1 py-0">ピーク</Badge>}
                                  </div>
                                </td>
                                <td className="p-1.5"></td>
                                <td className="p-1.5 text-right text-gray-600 tabular-nums">{hf.customers}人</td>
                                <td className="p-1.5 text-right text-gray-600 tabular-nums">¥{hf.sales.toLocaleString()}</td>
                                <td className="p-1.5 text-center">
                                  <span className="text-blue-600 font-medium">{hf.suggestedHall}名</span>
                                </td>
                                <td className="p-1.5 text-center">
                                  <span className="text-emerald-600 font-medium">{hf.suggestedKitchen}名</span>
                                </td>
                              </tr>
                            )
                          })}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-medium text-sm">
                      <td className="p-2.5"></td>
                      <td className="p-2.5 text-gray-700">合計</td>
                      <td className="p-2.5"></td>
                      <td className="p-2.5 text-right text-gray-800 tabular-nums">{kpis.totalCustomers.toLocaleString()}人</td>
                      <td className="p-2.5 text-right text-gray-800 tabular-nums">¥{kpis.totalSales.toLocaleString()}</td>
                      <td className="p-2.5 text-center text-blue-700">{periodData.reduce((s, d) => s + OPERATING_HOURS.reduce((sh, h) => sh + d.hourlyForecast[h].suggestedHall, 0), 0)}h</td>
                      <td className="p-2.5 text-center text-emerald-700">{periodData.reduce((s, d) => s + OPERATING_HOURS.reduce((sk, h) => sk + d.hourlyForecast[h].suggestedKitchen, 0), 0)}h</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ナビゲーション */}
            <div className="flex items-center justify-end pt-4">
              <Button onClick={handleConfirmForecast} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                予測を確認して人員計画へ
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========== ステップ2: 人員計画 ========== */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">人員計画</h2>
              <p className="text-sm text-gray-500 mt-1">需要予測に基づく推奨人員数を確認・調整し、スタッフに提出依頼を送信します。</p>
            </div>

            {/* 問題サマリーバナー */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div className="flex items-center gap-3 text-sm">
                    {problems.understaffed > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-red-700">人員不足</span>
                        <Badge variant="secondary" className="bg-red-100 text-red-700">{problems.understaffed}箇所</Badge>
                      </span>
                    )}
                    {problems.overstaffed > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-amber-700">人員過剰</span>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">{problems.overstaffed}箇所</Badge>
                      </span>
                    )}
                    {problems.understaffed > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-purple-700">ヘルプ必要</span>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <HandHelping className="h-3 w-3 mr-0.5" />
                          {Math.max(1, Math.floor(problems.understaffed / 3))}枠
                        </Badge>
                      </span>
                    )}
                    {problems.understaffed === 0 && problems.overstaffed === 0 && (
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">すべて推奨値と一致</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowProblemsOnly(!showProblemsOnly)} className={cn("gap-1.5", showProblemsOnly && "bg-amber-100")}>
                    {showProblemsOnly ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showProblemsOnly ? "すべて表示" : "差異のみ"}
                  </Button>
                  {!showAIProposal && (
                    <Button variant="outline" size="sm" onClick={() => setShowAIProposal(true)} className="gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      AI推奨を一括適用
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* ライブKPIストリップ */}
            <div className="border rounded-lg p-3 bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-500">総工数</p>
                  <p className="text-lg font-bold text-gray-900 tabular-nums">{kpis.totalHours}h</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">人件費</p>
                  <p className="text-lg font-bold text-gray-900 tabular-nums">¥{kpis.laborCost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">人件費率</p>
                  <p className={cn("text-lg font-bold tabular-nums", kpis.laborCostRatio <= 25 ? "text-green-700" : kpis.laborCostRatio <= 28 ? "text-amber-700" : "text-red-700")}>
                    {kpis.laborCostRatio.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-gray-400">目標 25%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">予測客数</p>
                  <p className="text-lg font-bold text-gray-900 tabular-nums">{kpis.totalCustomers.toLocaleString()}人</p>
                </div>
              </div>
            </div>

            {/* AI提案表示 */}
            {showAIProposal && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">AI提案シフト案</h3>
                    <Badge variant="secondary">推奨値ベース</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAIProposal(false)}>キャンセル</Button>
                    <Button size="sm" onClick={applyAIProposal} className="bg-blue-600 hover:bg-blue-700">提案を適用</Button>
                  </div>
                </div>
                <p className="text-sm text-blue-700">
                  売上予測から算出した推奨人員数に基づいた最適なシフト案です。適用すると現在のシフトが上書きされます。
                </p>
              </div>
            )}

            {/* 期間セレクター（コンパクト版） */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevPeriod}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium px-3 py-1.5 bg-gray-100 rounded">{periodLabel}</span>
              <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                <button type="button" onClick={() => { if (currentStep >= 2 && !window.confirm("期間を変更すると編集内容がリセットされます。よろしいですか？")) return; setPeriodHalf("first") }}
                  className={cn("px-3 py-1.5 text-sm font-medium rounded-md", periodHalf === "first" ? "bg-white shadow text-gray-900" : "text-gray-600")}>前半</button>
                <button type="button" onClick={() => { if (currentStep >= 2 && !window.confirm("期間を変更すると編集内容がリセットされます。よろしいですか？")) return; setPeriodHalf("second") }}
                  className={cn("px-3 py-1.5 text-sm font-medium rounded-md", periodHalf === "second" ? "bg-white shadow text-gray-900" : "text-gray-600")}>後半</button>
              </div>
              <Button variant="outline" size="sm" onClick={handleNextPeriod}><ChevronRight className="h-4 w-4" /></Button>
            </div>

            {/* シフトテーブル（ホール／キッチン縦並び） */}
            {([
              { key: "hall" as const, title: "ホール", hours: kpis.hallTotal, bg: "bg-slate-50" },
              { key: "kitchen" as const, title: "キッチン", hours: kpis.kitchenTotal, bg: "bg-blue-50/40" },
            ]).map((s) => renderShiftTable(s.key, s.title, s.hours, s.bg))}

            {/* 提出依頼CTA */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 rounded-full p-3">
                  <Send className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">スタッフにシフト提出依頼を送信</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    人員計画が確定したら、スタッフにシフト希望の提出を依頼します。正社員は休暇希望、パート・アルバイトは出勤可能日を回答します。
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <Button onClick={handleSendSubmissionRequest} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                      <Send className="h-4 w-4" />
                      提出依頼を送信
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* ナビゲーション */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={() => goToStep(1)} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" />
                需要予測に戻る
              </Button>
            </div>
          </div>
        )}

        {/* ========== ステップ3: 提出確認・AI最適化 ========== */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">提出確認・AI最適化</h2>
              <p className="text-sm text-gray-500 mt-1">スタッフのシフト希望提出状況を確認し、AIで最適なシフトを作成します。</p>
            </div>

            {/* 提出期限バナー */}
            <div className={cn(
              "border rounded-lg p-4 flex items-center justify-between",
              daysUntilDeadline <= 0 ? "bg-red-50 border-red-200" : daysUntilDeadline <= 3 ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
            )}>
              <div className="flex items-center gap-3">
                <Clock className={cn(
                  "h-5 w-5",
                  daysUntilDeadline <= 0 ? "text-red-600" : daysUntilDeadline <= 3 ? "text-amber-600" : "text-blue-600"
                )} />
                <div>
                  <p className={cn(
                    "text-sm font-medium",
                    daysUntilDeadline <= 0 ? "text-red-800" : daysUntilDeadline <= 3 ? "text-amber-800" : "text-blue-800"
                  )}>
                    提出期限: {format(submissionDeadline, "M月d日 (E)", { locale: ja })}
                  </p>
                  <p className={cn(
                    "text-xs",
                    daysUntilDeadline <= 0 ? "text-red-600" : daysUntilDeadline <= 3 ? "text-amber-600" : "text-blue-600"
                  )}>
                    {daysUntilDeadline <= 0 ? "期限を過ぎています" : `あと${daysUntilDeadline}日`}
                  </p>
                </div>
              </div>
              {/* 提出率サークル */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke={submissionStats.percentage === 100 ? "#22c55e" : "#6366f1"} strokeWidth="3"
                      strokeDasharray={`${submissionStats.percentage}, 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">{submissionStats.percentage}%</span>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-800">{submissionStats.submitted}/{submissionStats.total}</span>
                  <span className="text-gray-500 ml-1">提出済み</span>
                </div>
              </div>
            </div>

            {/* 正社員：休暇希望 */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-700">正社員</h3>
                  <span className="text-xs text-gray-500">— 休暇希望日を回答</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {STAFF_SUBMISSIONS.filter(s => s.employmentType === "正社員" && s.submitted).length}/{STAFF_SUBMISSIONS.filter(s => s.employmentType === "正社員").length} 提出済み
                </Badge>
              </div>
              <div className="divide-y">
                {STAFF_SUBMISSIONS.filter(s => s.employmentType === "正社員").map((staff) => (
                  <div key={staff.staffId} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-200 text-sm font-medium text-gray-700 flex-shrink-0">
                      {staff.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{staff.name}</span>
                        <Badge variant="outline" className={cn("text-[10px]", getPositionColor(staff.position))}>{staff.position}</Badge>
                        {staff.role !== "スタッフ" && <span className="text-[10px] text-gray-500">{staff.role}</span>}
                      </div>
                      {staff.submitted ? (
                        <p className="text-xs text-gray-500 mt-0.5">
                          休暇希望: {staff.requestedDaysOff?.map(d => `${d}日`).join(", ")}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 mt-0.5">未提出</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {staff.submitted ? (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs">{staff.submittedAt && format(new Date(staff.submittedAt), "M/d")}</span>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="gap-1 text-xs h-7"
                          onClick={() => showToast(`${staff.name}さんに催促を送信しました`, "info")}>
                          <Mail className="h-3 w-3" />
                          催促
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* パート・アルバイト：出勤可能日・希望時間帯 */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-700">パート・アルバイト</h3>
                  <span className="text-xs text-gray-500">— 出勤可能日・希望時間帯を回答</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {STAFF_SUBMISSIONS.filter(s => s.employmentType !== "正社員" && s.submitted).length}/{STAFF_SUBMISSIONS.filter(s => s.employmentType !== "正社員").length} 提出済み
                </Badge>
              </div>
              <div className="divide-y">
                {STAFF_SUBMISSIONS.filter(s => s.employmentType !== "正社員").map((staff) => (
                  <div key={staff.staffId} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-200 text-sm font-medium text-gray-700 flex-shrink-0">
                        {staff.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{staff.name}</span>
                          <Badge variant="outline" className={cn("text-[10px]", getPositionColor(staff.position))}>{staff.position}</Badge>
                          <Badge variant="outline" className={cn("text-[10px]", getEmploymentColor(staff.employmentType))}>{staff.employmentType}</Badge>
                        </div>
                        {staff.submitted ? (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {staff.availableSummary} · {staff.availableDays?.length}日登録
                          </p>
                        ) : (
                          <p className="text-xs text-amber-600 mt-0.5">未提出</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {staff.submitted ? (
                          <div className="flex items-center gap-1.5 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs">{staff.submittedAt && format(new Date(staff.submittedAt), "M/d")}</span>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="gap-1 text-xs h-7"
                            onClick={() => showToast(`${staff.name}さんに催促を送信しました`, "info")}>
                            <Mail className="h-3 w-3" />
                            催促
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* 出勤可能日の詳細 */}
                    {staff.submitted && staff.availableDays && (
                      <div className="mt-2 ml-13 pl-[52px]">
                        <div className="flex flex-wrap gap-1.5">
                          {staff.availableDays.map((d, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 rounded px-1.5 py-0.5 border border-blue-100">
                              <span className="font-medium">{d.day}日</span>
                              <span className="text-blue-500">{d.start}〜{d.end}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI最適化CTA */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 rounded-full p-3">
                  <Sparkles className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">AIでシフトを自動作成</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    需要予測データとスタッフの希望を分析し、最適なシフト案をAIが自動で作成します。
                  </p>
                  {submissionStats.submitted < submissionStats.total && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      未提出のスタッフがいます（{submissionStats.total - submissionStats.submitted}名）。提出後の実行を推奨します。
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-4">
                    <Button onClick={handleAIOptimize} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                      <Sparkles className="h-4 w-4" />
                      AIシフト最適化を実行
                    </Button>
                    <button onClick={handleSkipToReview} className="text-sm text-gray-500 hover:text-gray-700 underline">
                      手動で確認に進む
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ナビゲーション */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={() => goToStep(2)} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" />
                人員計画に戻る
              </Button>
            </div>
          </div>
        )}

        {/* ========== ステップ4: 確認・提出 ========== */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">確認・提出</h2>
              <p className="text-sm text-gray-500 mt-1">シフト編集結果を確認し、問題なければ提出してください。</p>
            </div>

            {/* 仮シフト表 */}
            {(() => {
              const hallStaff = previewShiftData.staffRows.filter(s => s.position === "ホール" || s.position === "両方")
              const kitchenStaff = previewShiftData.staffRows.filter(s => s.position === "キッチン" || s.position === "両方")
              const dates = previewShiftData.dates
              const dayInfos = dates.map(d => ({
                date: d,
                dayOfWeek: format(d, "E", { locale: ja }),
                isWeekend: d.getDay() === 0 || d.getDay() === 6,
              }))
              const weekdays = ["日", "月", "火", "水", "木", "金", "土"]

              const renderStaffShiftCell = (shift: string | null, date: Date, staffId: string) => {
                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                if (shift) {
                  const [s, e] = shift.split("-")
                  return (
                    <td key={`${staffId}-${format(date, "d")}`} className={`border p-2 ${isWeekend ? "bg-red-50" : ""}`}>
                      <div className="text-xs bg-blue-100 rounded px-2 py-1 text-center">
                        <div className="font-medium">{s.includes(":") ? s : `${s}:00`}</div>
                        <div className="text-gray-600">{e.includes(":") ? e : `${e}:00`}</div>
                      </div>
                    </td>
                  )
                }
                return (
                  <td key={`${staffId}-${format(date, "d")}`} className={`border p-2 ${isWeekend ? "bg-red-50" : ""}`} />
                )
              }

              const renderSectionTable = (
                sectionTitle: string,
                staffList: typeof hallStaff,
                helpRole: "ホール" | "キッチン",
              ) => (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-800">{sectionTitle}</h3>
                      <Badge variant="secondary">
                        {staffList.length}名
                      </Badge>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="sticky left-0 z-10 text-left p-3 font-medium text-gray-700 min-w-[120px] text-sm bg-gray-50" rowSpan={2}>
                            スタッフ
                          </th>
                          {dayInfos.map((day, i) => (
                            <th key={i} className={`border p-3 text-center font-medium min-w-[60px] text-sm ${day.isWeekend ? "text-red-600 bg-red-50" : "text-gray-700"}`}>
                              {format(day.date, "d")}日
                            </th>
                          ))}
                          <th className="text-center p-3 font-medium text-gray-700 text-sm" rowSpan={2}>合計</th>
                        </tr>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {dayInfos.map((day, i) => (
                            <th key={`dow-${i}`} className={`border p-3 text-center text-xs font-medium ${day.isWeekend ? "text-red-600 bg-red-50" : "text-gray-600"}`}>
                              {weekdays[day.date.getDay()]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {staffList.map((staff) => {
                          const workedDays = staff.shifts.filter(s => s !== null).length
                          return (
                            <tr key={staff.staffId} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="sticky left-0 z-10 p-3 font-medium text-gray-700 text-sm bg-white">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span>{staff.name}</span>
                                  <Badge variant="outline" className={cn("text-xs", staff.employmentType === "正社員" ? "text-blue-700 border-blue-300" : "text-purple-700 border-purple-300")}>
                                    {staff.employmentType}
                                  </Badge>
                                </div>
                              </td>
                              {staff.shifts.map((shift, colIdx) => renderStaffShiftCell(shift, dates[colIdx], staff.staffId))}
                              <td className="p-3 font-medium text-center bg-gray-50 text-sm">{workedDays}日</td>
                            </tr>
                          )
                        })}
                        {/* ヘルプ行 */}
                        <tr className="border-b border-gray-200 bg-amber-50/50">
                          <td className="sticky left-0 z-10 p-3 font-medium text-sm bg-amber-50/50">
                            <div className="flex items-center gap-1.5 text-amber-800">
                              <HandHelping className="h-4 w-4" />
                              <span>ヘルプ（{helpRole}）</span>
                            </div>
                            <div className="text-xs text-amber-600 mt-0.5">他店舗から補充</div>
                          </td>
                          {dates.map((_, colIdx) => {
                            const slots = (previewShiftData.helpRows[colIdx] || []).filter(s => s.role === helpRole)
                            const isWeekend = dates[colIdx]?.getDay() === 0 || dates[colIdx]?.getDay() === 6
                            return (
                              <td key={`help-${helpRole}-${colIdx}`} className={`border p-2 ${isWeekend ? "bg-red-50" : ""}`}>
                                {slots.length > 0 && (
                                  <div className="flex flex-col gap-1">
                                    {slots.map((slot, si) => (
                                      <div key={si} className="text-xs bg-amber-100 border border-amber-300 rounded px-2 py-1 text-center">
                                        <div className="font-bold text-amber-800">ヘルプ</div>
                                        <div className="text-amber-700">{slot.start}</div>
                                        <div className="text-amber-700">{slot.end}</div>
                                        {slot.shortage > 1 && <div className="text-amber-600 text-[10px]">×{slot.shortage}</div>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                          <td className="p-3 font-medium text-center bg-gray-50 text-sm">
                            {(previewShiftData.helpRows.reduce((sum, slots) => sum + slots.filter(s => s.role === helpRole).reduce((s2, sl) => s2 + sl.shortage, 0), 0))}枠
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )

              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">仮シフト表</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-blue-100 border border-blue-200" /> シフト</span>
                      <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-amber-100 border border-amber-300" /> ヘルプ必要枠</span>
                    </div>
                  </div>
                  {renderSectionTable("ホール", hallStaff, "ホール")}
                  {renderSectionTable("キッチン", kitchenStaff, "キッチン")}
                </div>
              )
            })()}

            {/* 比較カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-5 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-500 mb-3">推奨人員での計画</h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between"><span className="text-sm text-gray-600">総工数</span><span className="font-medium">{recommendedKpis.totalHours}h</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">人件費</span><span className="font-medium">¥{recommendedKpis.laborCost.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">人件費率</span><span className="font-medium">{recommendedKpis.laborCostRatio.toFixed(1)}%</span></div>
                </div>
              </div>
              <div className="rounded-lg border-2 border-indigo-200 p-5 bg-indigo-50/30">
                <h3 className="text-sm font-medium text-indigo-700 mb-3">現在のシフト計画</h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">総工数</span>
                    <span className="font-medium flex items-center gap-2">
                      {kpis.totalHours}h
                      {kpis.totalHours !== recommendedKpis.totalHours && (
                        <span className={cn("text-xs px-1.5 py-0.5 rounded", kpis.totalHours < recommendedKpis.totalHours ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                          {kpis.totalHours > recommendedKpis.totalHours ? "+" : ""}{kpis.totalHours - recommendedKpis.totalHours}h
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">人件費</span>
                    <span className="font-medium flex items-center gap-2">
                      ¥{kpis.laborCost.toLocaleString()}
                      {kpis.laborCost !== recommendedKpis.laborCost && (
                        <span className={cn("text-xs px-1.5 py-0.5 rounded", kpis.laborCost < recommendedKpis.laborCost ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                          {kpis.laborCost > recommendedKpis.laborCost ? "+" : ""}¥{(kpis.laborCost - recommendedKpis.laborCost).toLocaleString()}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">人件費率</span>
                    <span className={cn("font-medium", kpis.laborCostRatio <= 25 ? "text-green-700" : "text-amber-700")}>
                      {kpis.laborCostRatio.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ピーク時不足警告 */}
            {problems.peakUnderstaffed > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">ピーク時間帯に人員不足があります（{problems.peakUnderstaffed}箇所）</p>
                  <p className="text-xs text-red-600 mt-0.5">ランチ（12-13時）やディナー（18-20時）のピーク帯で推奨人員を下回っています。</p>
                </div>
              </div>
            )}

            {/* 差異リスト */}
            {deviations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">推奨値との差異（{deviations.length}箇所）</h3>
                <div className="border rounded-lg overflow-hidden">
                  {(showAllDeviations ? deviations : deviations.slice(0, 10)).map((dev, i) => (
                    <div key={i} className={cn(
                      "flex items-center gap-3 px-4 py-3 border-b last:border-b-0 text-sm",
                      dev.diff < 0 ? "border-l-4 border-l-red-400" : "border-l-4 border-l-amber-400"
                    )}>
                      <span className="text-gray-700 font-medium w-24">{format(dev.date, "M/d (E)", { locale: ja })}</span>
                      <span className="text-gray-600 w-16">{dev.hour}:00</span>
                      <Badge variant="outline" className={cn("text-xs", dev.position === "ホール" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                        {dev.position}
                      </Badge>
                      {dev.isPeak && <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">ピーク</Badge>}
                      <span className="text-gray-600 ml-auto">推奨{dev.suggested}人 → 現在{dev.current}人</span>
                      <span className={cn("font-medium px-2 py-0.5 rounded", dev.diff < 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                        {dev.diff > 0 ? `+${dev.diff}` : dev.diff}
                      </span>
                    </div>
                  ))}
                </div>
                {deviations.length > 10 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAllDeviations(!showAllDeviations)} className="mt-2 text-gray-500">
                    {showAllDeviations ? "折りたたむ" : `すべて表示（残り${deviations.length - 10}件）`}
                  </Button>
                )}
              </div>
            )}

            {deviations.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">すべての時間帯で推奨人員と一致しています。</p>
              </div>
            )}

            {/* ナビゲーション */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={() => goToStep(3)} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" />
                提出確認に戻る
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleSaveDraft} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  下書き保存
                </Button>
                <Button onClick={handleSubmit} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Send className="h-4 w-4" />
                  提出してヘルプ最適化へ
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========== ステップ5: ヘルプ最適化 ========== */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">ヘルプ最適化</h2>
              <p className="text-sm text-gray-500 mt-1">ベイクォーター店のヘルプ枠を最適化し、シフトを確定します。</p>
            </div>

            {/* 概要フェーズ */}
            {helpPhase === "overview" && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">シフト作成の結果、以下の枠でスタッフが不足しています</p>
                    <p className="text-xs text-amber-700 mt-0.5">店舗内スタッフだけでは人員が確保できない時間帯があります。近隣店舗からのヘルプで補充します。</p>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-5">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">ヘルプ必要枠</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded border p-3 text-center">
                      <p className="text-xs text-gray-500">ヘルプ必要枠</p>
                      <p className="text-xl font-bold text-gray-900">9枠</p>
                    </div>
                    <div className="bg-white rounded border p-3 text-center">
                      <p className="text-xs text-gray-500">ホール</p>
                      <p className="text-xl font-bold text-blue-700">6枠</p>
                    </div>
                    <div className="bg-white rounded border p-3 text-center">
                      <p className="text-xs text-gray-500">キッチン</p>
                      <p className="text-xl font-bold text-emerald-700">3枠</p>
                    </div>
                    <div className="bg-white rounded border p-3 text-center">
                      <p className="text-xs text-gray-500">対象日</p>
                      <p className="text-xl font-bold text-gray-900">月水金土日</p>
                    </div>
                  </div>
                </div>

                {/* ヘルプ必要枠の詳細 */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b px-4 py-3">
                    <h3 className="text-sm font-medium text-gray-700">ベイクォーター店 ヘルプ必要枠一覧</h3>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b text-sm text-gray-600">
                        <th className="p-3 text-left font-medium">曜日</th>
                        <th className="p-3 text-left font-medium">時間帯</th>
                        <th className="p-3 text-center font-medium">ポジション</th>
                        <th className="p-3 text-center font-medium">不足人数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { day: "月", start: "19:00", end: "21:00", role: "ホール", shortage: 1 },
                        { day: "月", start: "19:00", end: "22:00", role: "キッチン", shortage: 1 },
                        { day: "水", start: "19:00", end: "21:00", role: "ホール", shortage: 1 },
                        { day: "金", start: "19:00", end: "21:00", role: "ホール", shortage: 1 },
                        { day: "金", start: "19:00", end: "22:00", role: "キッチン", shortage: 1 },
                        { day: "土", start: "11:00", end: "14:00", role: "ホール", shortage: 2 },
                        { day: "土", start: "19:00", end: "22:00", role: "キッチン", shortage: 1 },
                        { day: "日", start: "11:00", end: "14:00", role: "ホール", shortage: 1 },
                        { day: "日", start: "18:00", end: "21:00", role: "キッチン", shortage: 1 },
                      ].map((slot, i) => (
                        <tr key={i} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="p-3 text-sm font-medium">{slot.day}</td>
                          <td className="p-3 text-sm">{slot.start}〜{slot.end}</td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className={cn("text-xs", slot.role === "ホール" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                              {slot.role}
                            </Badge>
                          </td>
                          <td className="p-3 text-center"><span className="text-red-600 font-medium">{slot.shortage}名</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 最適化ボタン */}
                <div className="bg-white rounded-lg border-2 border-indigo-200 p-6 text-center">
                  <Sparkles className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ヘルプ枠を一括作成</h3>
                  <p className="text-sm text-gray-600 mb-4 max-w-lg mx-auto">
                    近隣店舗の空きスタッフを照合し、移動コスト・スキル適合度を考慮した最適なヘルプ配置を自動で提案します。
                  </p>
                  <Button size="lg" onClick={handleOptimize} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Sparkles className="h-5 w-5" />
                    一括作成を実行
                  </Button>
                </div>
              </>
            )}

            {/* 最適化中 */}
            {helpPhase === "optimizing" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    <h3 className="text-xl font-semibold text-gray-900">ヘルプ一括作成中...</h3>
                  </div>
                  <Progress value={(optimizationStep / OPTIMIZATION_STEPS.length) * 100} className="h-3" />
                  <p className="text-sm text-gray-600">ステップ {optimizationStep} / {OPTIMIZATION_STEPS.length}</p>
                  <div className="space-y-3">
                    {OPTIMIZATION_STEPS.slice(0, optimizationStep).map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-gray-50 rounded-lg p-4 border">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{step.title}</p>
                          <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 結果 */}
            {helpPhase === "result" && (
              <>
                {/* サマリー */}
                <div className="bg-white rounded-lg border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">最適化完了</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">ヘルプ配置数</p>
                      <p className="text-2xl font-bold text-gray-900">{bayquarterHelp.length}件</p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">対象スタッフ</p>
                      <p className="text-2xl font-bold text-gray-900">{new Set(bayquarterHelp.map(a => a.helperId)).size}名</p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">交通費合計</p>
                      <p className="text-2xl font-bold text-gray-900">¥{totalTransportCost.toLocaleString()}</p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">充足率</p>
                      <p className="text-2xl font-bold text-green-700">{Math.round((bayquarterHelp.length / 9) * 100)}%</p>
                    </div>
                  </div>
                </div>

                {/* 配置一覧 */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b px-4 py-3">
                    <h3 className="text-sm font-medium text-gray-700">ベイクォーター店へのヘルプ配置</h3>
                  </div>
                  <div className="divide-y">
                    {bayquarterHelp.map((assignment, idx) => (
                      <div key={idx} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-medium text-gray-900">{assignment.helperName}</span>
                              <Badge variant="outline" className={cn("text-xs", assignment.role === "ホール" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                                {assignment.role}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <CalendarDays className="h-4 w-4" />
                                {DAY_LABELS[assignment.dayIndex]}曜日
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {assignment.start}〜{assignment.end}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-700">{assignment.fromStoreName}</span>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">ベイクォーター</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5 justify-end">
                              <div className="flex items-center gap-1">
                                <Train className="h-3 w-3" />
                                {assignment.travelMinutes}分
                              </div>
                              <span>¥{(assignment.transportCost || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 全店舗詳細リンク */}
                <div className="text-center">
                  <Link href="/shifts/help" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
                    全店舗のヘルプ詳細を見る →
                  </Link>
                </div>
              </>
            )}

            {/* ナビゲーション */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={() => goToStep(4)} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" />
                確認画面に戻る
              </Button>
              {helpPhase === "result" && (
                <Button onClick={handleFinalize} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <CheckCircle2 className="h-4 w-4" />
                  シフトを確定する
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI最適化オーバーレイ */}
      {isOptimizing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 space-y-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900">AIシフト最適化中</h3>
              <p className="text-sm text-gray-500 mt-1">
                {format(periodStart, "M月d日", { locale: ja })}〜{format(periodEnd, "M月d日", { locale: ja })}
              </p>
            </div>
            <Progress value={(aiOptPhase / AI_SHIFT_STEPS.length) * 100} className="h-2" />
            <div className="space-y-3">
              {AI_SHIFT_STEPS.map((step, idx) => {
                const isCompleted = idx < aiOptPhase
                const isActive = idx === aiOptPhase && aiOptPhase < AI_SHIFT_STEPS.length
                return (
                  <div key={idx} className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                    isCompleted ? "bg-green-50 border border-green-200" :
                    isActive ? "bg-indigo-50 border border-indigo-200" :
                    "bg-gray-50 border border-gray-100 opacity-50"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : isActive ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      isCompleted ? "text-green-800" : isActive ? "text-indigo-800" : "text-gray-400"
                    )}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
