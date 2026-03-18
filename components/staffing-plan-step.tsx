"use client"

import React, { useState, useMemo, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import {
  Minus, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Sparkles, X, Cloud, Sun, CloudRain, CloudSun,
  Users, AlertTriangle, ArrowRight, CheckCircle2,
  Eye, EyeOff, Send, HandHelping, DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type DayStaffing, type HourlyStaffing, type KpiSummary, type ProblemSummary,
  OPERATING_HOURS, HOURLY_WAGE_HALL, HOURLY_WAGE_KITCHEN,
  isPeakHour, calculateKpis, analyzeProblemCells,
} from "@/lib/shift-create-data"

// ========== Weather Icon ==========
const WeatherIcon = ({ icon, className = "h-4 w-4" }: { icon: string; className?: string }) => {
  switch (icon) {
    case "sun": return <Sun className={`${className} text-orange-500`} />
    case "cloud": return <Cloud className={`${className} text-gray-500`} />
    case "cloud-sun": return <CloudSun className={`${className} text-amber-500`} />
    case "rain": return <CloudRain className={`${className} text-blue-500`} />
    default: return <Sun className={`${className} text-orange-500`} />
  }
}

// ========== Types ==========
type Position = "hall" | "kitchen"

interface StaffingPlanStepProps {
  periodData: DayStaffing[]
  setPeriodData: React.Dispatch<React.SetStateAction<DayStaffing[]>>
  aiProposalData: DayStaffing[]
  periodLabel: string
  periodHalf: "first" | "second"
  onPrevPeriod: () => void
  onNextPeriod: () => void
  onSetPeriodHalf: (half: "first" | "second") => void
  onSendSubmissionRequest: () => void
  onGoBack: () => void
}

// ========== Problem analysis per position ==========
function analyzePositionProblems(periodData: DayStaffing[], position: Position) {
  let understaffed = 0
  let overstaffed = 0
  for (const day of periodData) {
    for (const hour of OPERATING_HOURS) {
      const forecast = day.hourlyForecast[hour]
      const current = position === "hall" ? day.hallStaffing[hour] : day.kitchenStaffing[hour]
      const suggested = position === "hall" ? forecast.suggestedHall : forecast.suggestedKitchen
      const diff = current - suggested
      if (diff < 0) understaffed++
      if (diff > 0) overstaffed++
    }
  }
  return { understaffed, overstaffed, total: understaffed + overstaffed }
}

// ========== Cell component (memoized) ==========
const StaffingCell = memo(function StaffingCell({
  dayIndex,
  hour,
  position,
  currentCount,
  suggested,
  customers,
  isSpecialDay,
  isEditing,
  onEdit,
  onChange,
}: {
  dayIndex: number
  hour: number
  position: Position
  currentCount: number
  suggested: number
  customers: number
  isSpecialDay: boolean
  isEditing: boolean
  onEdit: (dayIndex: number, hour: number) => void
  onChange: (dayIndex: number, hour: number, position: Position, change: number) => void
}) {
  const diff = currentCount - suggested

  return (
    <td
      className={cn(
        "border-b border-r p-0 text-center transition-colors cursor-pointer group/cell relative",
        isSpecialDay && "bg-red-50/20",
        diff < 0 && "bg-red-50 border-l-2 border-l-red-400",
        diff > 0 && "bg-amber-50 border-l-2 border-l-amber-400",
        diff === 0 && "",
      )}
      onClick={() => onEdit(dayIndex, hour)}
    >
      {isEditing ? (
        // Inline edit mode
        <div className="flex flex-col items-center py-1 px-0.5">
          <div className="text-[9px] text-gray-400 tabular-nums">{customers}人</div>
          <div className="flex items-center gap-0.5">
            <button
              className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
              onClick={(e) => { e.stopPropagation(); onChange(dayIndex, hour, position, -1) }}
              disabled={currentCount <= 0}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-base font-bold w-6 text-center tabular-nums">{currentCount}</span>
            <button
              className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
              onClick={(e) => { e.stopPropagation(); onChange(dayIndex, hour, position, 1) }}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <StatusBadge diff={diff} compact />
        </div>
      ) : (
        // Read-only mode
        <div className="flex flex-col items-center py-1 px-1">
          <div className="text-[9px] text-gray-400 tabular-nums">{customers}人</div>
          <span className={cn(
            "text-base font-bold tabular-nums leading-tight",
            diff < 0 && "text-red-700",
            diff > 0 && "text-amber-700",
            diff === 0 && "text-gray-800",
          )}>
            {currentCount}
          </span>
          <StatusBadge diff={diff} compact />
        </div>
      )}
    </td>
  )
})

// ========== Status badge ==========
function StatusBadge({ diff, compact = false }: { diff: number; compact?: boolean }) {
  if (diff === 0) {
    return <span className="text-[9px] text-green-600 font-medium">OK</span>
  }
  if (diff < 0) {
    return (
      <span className={cn(
        "text-[9px] font-bold text-red-700 bg-red-100 rounded px-1",
        !compact && "py-0.5",
      )}>
        {diff}
      </span>
    )
  }
  return (
    <span className={cn(
      "text-[9px] font-bold text-amber-700 bg-amber-100 rounded px-1",
      !compact && "py-0.5",
    )}>
      +{diff}
    </span>
  )
}

// ========== Main Component ==========
export default function StaffingPlanStep({
  periodData,
  setPeriodData,
  aiProposalData,
  periodLabel,
  periodHalf,
  onPrevPeriod,
  onNextPeriod,
  onSetPeriodHalf,
  onSendSubmissionRequest,
  onGoBack,
}: StaffingPlanStepProps) {
  // State
  const [activeTab, setActiveTab] = useState<Position>("hall")
  const [showProblemsOnly, setShowProblemsOnly] = useState(false)
  const [showCost, setShowCost] = useState(false)
  const [editingCell, setEditingCell] = useState<{ day: number; hour: number } | null>(null)
  const [showAIProposal, setShowAIProposal] = useState(false)

  // Computed
  const kpis = useMemo(() => calculateKpis(periodData), [periodData])
  const problems = useMemo(() => analyzeProblemCells(periodData), [periodData])
  const hallProblems = useMemo(() => analyzePositionProblems(periodData, "hall"), [periodData])
  const kitchenProblems = useMemo(() => analyzePositionProblems(periodData, "kitchen"), [periodData])

  const activeProblems = activeTab === "hall" ? hallProblems : kitchenProblems
  const wage = activeTab === "hall" ? HOURLY_WAGE_HALL : HOURLY_WAGE_KITCHEN

  // AI proposal diff count
  const aiDiffCount = useMemo(() => {
    if (aiProposalData.length === 0) return 0
    let count = 0
    for (let d = 0; d < periodData.length; d++) {
      for (const hour of OPERATING_HOURS) {
        if (periodData[d].hallStaffing[hour] !== aiProposalData[d]?.hourlyForecast[hour]?.suggestedHall) count++
        if (periodData[d].kitchenStaffing[hour] !== aiProposalData[d]?.hourlyForecast[hour]?.suggestedKitchen) count++
      }
    }
    return count
  }, [periodData, aiProposalData])

  // Handlers
  const handleStaffCountChange = useCallback((dayIndex: number, hour: number, position: Position, change: number) => {
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
  }, [setPeriodData])

  const handleCellEdit = useCallback((dayIndex: number, hour: number) => {
    setEditingCell(prev =>
      prev?.day === dayIndex && prev?.hour === hour ? null : { day: dayIndex, hour }
    )
  }, [])

  const applyAIProposal = () => {
    setPeriodData(aiProposalData)
    setShowAIProposal(false)
  }

  const hasProblemInHour = (hour: number) => {
    return periodData.some((day) => {
      const staffing = activeTab === "hall" ? day.hallStaffing : day.kitchenStaffing
      const forecast = day.hourlyForecast[hour]
      const suggested = activeTab === "hall" ? forecast.suggestedHall : forecast.suggestedKitchen
      return (staffing[hour] || 0) !== suggested
    })
  }

  const dataToShow = showAIProposal ? aiProposalData : periodData

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-gray-800">Step 2: 人員計画</h2>
        </div>
        <p className="text-sm text-gray-500">
          <span className="text-cyan-600 font-medium">AIが来客予測から「何時に何人必要か」を自動算出</span>しました。タブでポジションを切替え、セルをクリックして人数を調整できます。
        </p>
      </div>

      {/* ===== Problem Summary Dashboard ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={cn(
          "rounded-lg border p-3 text-center transition-colors",
          problems.understaffed > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200",
        )}>
          <p className="text-2xl font-bold tabular-nums text-red-700">{problems.understaffed}</p>
          <p className="text-xs text-gray-600">人員不足</p>
        </div>
        <div className={cn(
          "rounded-lg border p-3 text-center transition-colors",
          problems.overstaffed > 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200",
        )}>
          <p className="text-2xl font-bold tabular-nums text-amber-700">{problems.overstaffed}</p>
          <p className="text-xs text-gray-600">人員過剰</p>
        </div>
        <div className="rounded-lg border p-3 text-center bg-gray-50 border-gray-200">
          <p className="text-2xl font-bold tabular-nums text-gray-800">{kpis.totalHours}h</p>
          <p className="text-xs text-gray-600">総工数</p>
        </div>
        <div className={cn(
          "rounded-lg border p-3 text-center",
          kpis.laborCostRatio <= 25 ? "bg-green-50 border-green-200" : kpis.laborCostRatio <= 28 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200",
        )}>
          <p className={cn(
            "text-2xl font-bold tabular-nums",
            kpis.laborCostRatio <= 25 ? "text-green-700" : kpis.laborCostRatio <= 28 ? "text-amber-700" : "text-red-700",
          )}>{kpis.laborCostRatio.toFixed(1)}%</p>
          <p className="text-xs text-gray-600">人件費率</p>
        </div>
      </div>

      {/* ===== Position Tabs ===== */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            onClick={() => setActiveTab("hall")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all",
              activeTab === "hall" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700",
            )}
          >
            ホール
            <Badge variant="secondary" className="text-[10px]">{kpis.hallTotal}h</Badge>
            {hallProblems.total > 0 && (
              <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700">
                {hallProblems.total}件
              </Badge>
            )}
            {hallProblems.total === 0 && (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("kitchen")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all",
              activeTab === "kitchen" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700",
            )}
          >
            キッチン
            <Badge variant="secondary" className="text-[10px]">{kpis.kitchenTotal}h</Badge>
            {kitchenProblems.total > 0 && (
              <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700">
                {kitchenProblems.total}件
              </Badge>
            )}
            {kitchenProblems.total === 0 && (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            )}
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowProblemsOnly(!showProblemsOnly)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
              showProblemsOnly ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
            )}
          >
            {showProblemsOnly ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showProblemsOnly ? "差異のみ" : "すべて表示"}
          </button>

          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">コスト</span>
            <Switch checked={showCost} onCheckedChange={setShowCost} className="scale-75" />
          </div>

          {!showAIProposal && (
            <Button variant="outline" size="sm" onClick={() => setShowAIProposal(true)} className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              AI推奨{aiDiffCount > 0 && `（${aiDiffCount}箇所変更）`}
            </Button>
          )}
        </div>
      </div>

      {/* AI Proposal Banner */}
      {showAIProposal && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">AI推奨値を表示中</span>
            <span className="text-xs text-blue-600">（{aiDiffCount}箇所の変更提案）</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAIProposal(false)} className="text-xs h-7">キャンセル</Button>
            <Button size="sm" onClick={applyAIProposal} className="bg-blue-600 hover:bg-blue-700 text-xs h-7">適用</Button>
          </div>
        </div>
      )}

      {/* ===== Shift Table ===== */}
      <div className="rounded-lg border overflow-hidden bg-white">
        {/* Table scroll wrapper */}
        <div className="relative">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              {/* Sticky Header */}
              <thead className="sticky top-0 z-20">
                <tr className="bg-gray-50">
                  <th className="sticky left-0 z-30 bg-gray-50 border-b border-r p-2 text-center font-medium text-gray-600 w-20">
                    <span className="text-xs">時間</span>
                  </th>
                  {periodData.map((day, dayIndex) => {
                    const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
                    const isFriday = day.date.getDay() === 5
                    const isSpecialDay = isWeekend || day.isHoliday
                    return (
                      <th
                        key={dayIndex}
                        className={cn(
                          "border-b border-r p-1.5 text-center min-w-[90px]",
                          isSpecialDay && "bg-red-50/60",
                          isFriday && !isSpecialDay && "bg-orange-50/40",
                        )}
                      >
                        {/* Row 1: Day + Date */}
                        <div className="flex items-baseline justify-center gap-1">
                          <span className={cn(
                            "text-lg font-bold",
                            isSpecialDay ? "text-red-600" : "text-gray-800",
                          )}>
                            {format(day.date, "d")}
                          </span>
                          <span className={cn(
                            "text-xs",
                            isSpecialDay ? "text-red-500" : "text-gray-400",
                          )}>
                            {format(day.date, "E", { locale: ja })}
                          </span>
                        </div>
                        {/* Row 2: Weather + customers + sales */}
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <WeatherIcon icon={day.weather.icon} className="h-3 w-3" />
                          <span className="text-[10px] text-gray-500">{day.forecastCustomers}人</span>
                        </div>
                        <div className="text-[9px] text-gray-400 tabular-nums">
                          ¥{Math.round(day.forecastSales / 1000)}k
                        </div>
                        {/* Row 3: Event badge (if any) */}
                        {(day.isHoliday || day.event) && (
                          <div className="mt-0.5">
                            {day.isHoliday && (
                              <span className="text-[8px] bg-red-100 text-red-600 rounded px-1 py-0.5">{day.holidayName}</span>
                            )}
                            {day.event && !day.isHoliday && (
                              <span className="text-[8px] bg-amber-100 text-amber-600 rounded px-1 py-0.5">{day.event}</span>
                            )}
                          </div>
                        )}
                      </th>
                    )
                  })}
                  <th className="border-b p-2 text-center font-medium text-gray-600 w-14 bg-gray-100 text-xs">合計</th>
                </tr>
              </thead>

              <tbody>
                {OPERATING_HOURS.map((hour) => {
                  const hourTotal = dataToShow.reduce((sum, day) => {
                    const staffing = activeTab === "hall" ? day.hallStaffing : day.kitchenStaffing
                    return sum + (staffing[hour] || 0)
                  }, 0)
                  const hasProblems = hasProblemInHour(hour)
                  const peak = isPeakHour(hour)

                  if (showProblemsOnly && !hasProblems) return null

                  return (
                    <tr
                      key={hour}
                      className={cn(
                        "transition-colors",
                        peak && "border-l-4 border-l-amber-400",
                        hasProblems && "bg-amber-50/20",
                      )}
                    >
                      {/* Time cell - sticky */}
                      <td className={cn(
                        "sticky left-0 z-10 border-b border-r p-1.5 text-center",
                        peak ? "bg-amber-50" : "bg-white",
                      )}>
                        <span className="text-sm font-medium text-gray-700">{hour}:00</span>
                        {peak && <div className="text-[8px] text-amber-600 font-medium">ピーク</div>}
                        <div className="text-[9px] text-gray-400 mt-0.5">
                          avg {Math.round(dataToShow.reduce((s, d) => s + d.hourlyForecast[hour].customers, 0) / dataToShow.length)}人
                        </div>
                      </td>

                      {/* Data cells */}
                      {dataToShow.map((day, dayIndex) => {
                        const staffing = activeTab === "hall" ? day.hallStaffing : day.kitchenStaffing
                        const currentCount = staffing[hour] || 0
                        const forecast = day.hourlyForecast[hour]
                        const suggested = activeTab === "hall" ? forecast.suggestedHall : forecast.suggestedKitchen
                        const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
                        const isSpecialDay = isWeekend || day.isHoliday
                        const isEditing = editingCell?.day === dayIndex && editingCell?.hour === hour

                        return (
                          <StaffingCell
                            key={dayIndex}
                            dayIndex={dayIndex}
                            hour={hour}
                            position={activeTab}
                            currentCount={currentCount}
                            suggested={suggested}
                            customers={forecast.customers}
                            isSpecialDay={isSpecialDay}
                            isEditing={isEditing}
                            onEdit={handleCellEdit}
                            onChange={handleStaffCountChange}
                          />
                        )
                      })}

                      {/* Hour total */}
                      <td className="border-b p-1.5 text-center font-medium bg-gray-50 text-sm tabular-nums">
                        {hourTotal}
                        {showCost && (
                          <div className="text-[9px] text-gray-400">¥{(hourTotal * wage).toLocaleString()}</div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Footer */}
              <tfoot>
                <tr className="bg-gray-100">
                  <td className="sticky left-0 z-10 bg-gray-100 border-t p-2 text-center font-semibold text-xs">日計</td>
                  {dataToShow.map((day, dayIndex) => {
                    const staffing = activeTab === "hall" ? day.hallStaffing : day.kitchenStaffing
                    const total = Object.values(staffing).reduce((s, v) => s + v, 0)
                    return (
                      <td key={dayIndex} className="border-t border-r p-1.5 text-center">
                        <div className="font-bold text-sm tabular-nums">{total}h</div>
                        {showCost && (
                          <div className="text-[9px] text-gray-500">¥{(total * wage).toLocaleString()}</div>
                        )}
                      </td>
                    )
                  })}
                  <td className="border-t p-2 text-center bg-gray-200">
                    <div className="font-bold text-sm tabular-nums">
                      {dataToShow.reduce((sum, day) => {
                        const staffing = activeTab === "hall" ? day.hallStaffing : day.kitchenStaffing
                        return sum + Object.values(staffing).reduce((s, v) => s + v, 0)
                      }, 0)}h
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ===== Floating Action Bar ===== */}
      <div className="sticky bottom-0 z-40 -mx-6 px-6 py-3 bg-white/95 backdrop-blur border-t shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={onGoBack} className="gap-1.5 text-sm">
            <ChevronLeft className="h-4 w-4" />
            需要予測
          </Button>

          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
            <span>ホール: <strong className="text-gray-800">{kpis.hallTotal}h</strong></span>
            <span>キッチン: <strong className="text-gray-800">{kpis.kitchenTotal}h</strong></span>
            <span>人件費: <strong className="text-gray-800">¥{kpis.laborCost.toLocaleString()}</strong></span>
          </div>

          <Button onClick={onSendSubmissionRequest} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Send className="h-4 w-4" />
            提出依頼を送信
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
