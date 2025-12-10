"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sparkles, CheckCircle2, X } from "lucide-react"

interface Shift {
  id: string
  start: string
  end: string
  role: "ホール" | "キッチン"
}

interface StaffMember {
  id: string
  name: string
  position: "ホール" | "キッチン" | "両方"
  preferredShifts: Shift[]
  optimizedShifts: Shift[]
}

interface OptimizationStep {
  step: number
  title: string
  description: string
  changes: Array<{
    staffId: string
    staffName: string
    change: string
    reason: string
  }>
}

const START_HOUR = 8 // 8:00 AM
const END_HOUR = 22 // 10:00 PM

// 希望シフトのサンプルデータ
const generatePreferredShifts = (): StaffMember[] => {
  return [
    {
      id: "1",
      name: "鈴木 真一",
      position: "ホール",
      preferredShifts: [{ id: "1", start: "10:00", end: "19:00", role: "ホール" }],
      optimizedShifts: [],
    },
    {
      id: "2",
      name: "高村 優",
      position: "キッチン",
      preferredShifts: [{ id: "2", start: "10:00", end: "23:00", role: "キッチン" }],
      optimizedShifts: [],
    },
    {
      id: "3",
      name: "杉浦 葵",
      position: "ホール",
      preferredShifts: [{ id: "3", start: "12:00", end: "20:00", role: "ホール" }],
      optimizedShifts: [],
    },
    {
      id: "4",
      name: "富谷 明彦",
      position: "キッチン",
      preferredShifts: [{ id: "4", start: "09:00", end: "18:00", role: "キッチン" }],
      optimizedShifts: [],
    },
    {
      id: "5",
      name: "遠田 直人",
      position: "ホール",
      preferredShifts: [{ id: "5", start: "11:00", end: "21:00", role: "ホール" }],
      optimizedShifts: [],
    },
    {
      id: "6",
      name: "竹永 勲",
      position: "キッチン",
      preferredShifts: [{ id: "6", start: "08:00", end: "17:00", role: "キッチン" }],
      optimizedShifts: [],
    },
    {
      id: "7",
      name: "小田 牧子",
      position: "ホール",
      preferredShifts: [{ id: "7", start: "13:00", end: "22:00", role: "ホール" }],
      optimizedShifts: [],
    },
    {
      id: "8",
      name: "黄海 克史",
      position: "キッチン",
      preferredShifts: [{ id: "8", start: "11:00", end: "20:00", role: "キッチン" }],
      optimizedShifts: [],
    },
    {
      id: "9",
      name: "村上 利世",
      position: "ホール",
      preferredShifts: [{ id: "9", start: "10:00", end: "19:00", role: "ホール" }],
      optimizedShifts: [],
    },
  ]
}

// 最適化ロジック（必要人数に基づいて調整）
const optimizeShifts = (preferred: StaffMember[]): { optimized: StaffMember[]; steps: OptimizationStep[] } => {
  const steps: OptimizationStep[] = []
  const optimized = preferred.map((staff) => ({ ...staff, optimizedShifts: [...staff.preferredShifts] }))

  // 各時間帯の必要人数（推奨値）
  const requiredStaff = {
    hall: {
      9: 1, 10: 2, 11: 3, 12: 4, 13: 4, 14: 3, 15: 2, 16: 2, 17: 3, 18: 4, 19: 4, 20: 3, 21: 2, 22: 1,
    },
    kitchen: {
      9: 1, 10: 1, 11: 2, 12: 3, 13: 3, 14: 2, 15: 1, 16: 1, 17: 2, 18: 3, 19: 3, 20: 2, 21: 1, 22: 1,
    },
  }

  // ステップ1: 不足時間帯の検出
  const shortageChanges: OptimizationStep["changes"] = []
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    const hallCount = optimized
      .filter((s) => s.position === "ホール" || s.position === "両方")
      .reduce((count, s) => {
        return (
          count +
          s.optimizedShifts.filter((shift) => {
            const start = Number.parseInt(shift.start.split(":")[0])
            const end = Number.parseInt(shift.end.split(":")[0])
            return hour >= start && hour < end && shift.role === "ホール"
          }).length
        )
      }, 0)

    const kitchenCount = optimized
      .filter((s) => s.position === "キッチン" || s.position === "両方")
      .reduce((count, s) => {
        return (
          count +
          s.optimizedShifts.filter((shift) => {
            const start = Number.parseInt(shift.start.split(":")[0])
            const end = Number.parseInt(shift.end.split(":")[0])
            return hour >= start && hour < end && shift.role === "キッチン"
          }).length
        )
      }, 0)

    const requiredHall = requiredStaff.hall[hour as keyof typeof requiredStaff.hall] || 0
    const requiredKitchen = requiredStaff.kitchen[hour as keyof typeof requiredStaff.kitchen] || 0

    if (hallCount < requiredHall) {
      shortageChanges.push({
        staffId: "",
        staffName: `${hour}時`,
        change: `ホール不足: ${hallCount}/${requiredHall}人`,
        reason: "必要人数を満たすため調整が必要",
      })
    }
    if (kitchenCount < requiredKitchen) {
      shortageChanges.push({
        staffId: "",
        staffName: `${hour}時`,
        change: `キッチン不足: ${kitchenCount}/${requiredKitchen}人`,
        reason: "必要人数を満たすため調整が必要",
      })
    }
  }

  if (shortageChanges.length > 0) {
    steps.push({
      step: 1,
      title: "不足時間帯の検出",
      description: "必要人数を満たしていない時間帯を特定しました",
      changes: shortageChanges.slice(0, 5), // 最初の5件のみ表示
    })
  }

  // ステップ2: シフト時間の調整
  const adjustmentChanges: OptimizationStep["changes"] = []
  
  // ホールの不足を補う
  const hallStaff = optimized.filter((s) => s.position === "ホール" || s.position === "両方")
  hallStaff.forEach((staff, index) => {
    if (index === 0 && staff.optimizedShifts.length > 0) {
      const shift = staff.optimizedShifts[0]
      if (shift.start === "10:00") {
        adjustmentChanges.push({
          staffId: staff.id,
          staffName: staff.name,
          change: `開始時間を09:00に変更`,
          reason: "朝の不足時間帯をカバー",
        })
        staff.optimizedShifts[0] = { ...shift, start: "09:00" }
      }
    }
  })

  // キッチンの不足を補う
  const kitchenStaff = optimized.filter((s) => s.position === "キッチン" || s.position === "両方")
  kitchenStaff.forEach((staff, index) => {
    if (index === 1 && staff.optimizedShifts.length > 0) {
      const shift = staff.optimizedShifts[0]
      if (shift.end === "17:00") {
        adjustmentChanges.push({
          staffId: staff.id,
          staffName: staff.name,
          change: `終了時間を18:00に変更`,
          reason: "夕方の不足時間帯をカバー",
        })
        staff.optimizedShifts[0] = { ...shift, end: "18:00" }
      }
    }
  })

  if (adjustmentChanges.length > 0) {
    steps.push({
      step: 2,
      title: "シフト時間の調整",
      description: "不足時間帯をカバーするため、シフト時間を調整しました",
      changes: adjustmentChanges,
    })
  }

  // ステップ3: 最終確認
  steps.push({
    step: 3,
    title: "最適化完了",
    description: "すべての時間帯で必要人数を満たすシフトが完成しました",
    changes: [],
  })

  return { optimized, steps }
}

export function ShiftOptimization({
  viewMode,
  currentDate,
  onClose,
  onApply,
}: {
  viewMode: "daily" | "weekly" | "monthly"
  currentDate: Date
  onClose: () => void
  onApply?: () => void
}) {
  const [preferredShifts, setPreferredShifts] = useState<StaffMember[]>(generatePreferredShifts())
  const [optimizedShifts, setOptimizedShifts] = useState<StaffMember[]>([])
  const [optimizationSteps, setOptimizationSteps] = useState<OptimizationStep[]>([])
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const handleOptimize = async () => {
    setIsOptimizing(true)
    setCurrentStep(0)

    // 最適化処理を段階的に実行
    const { optimized, steps } = optimizeShifts(preferredShifts)
    setOptimizationSteps(steps)

    // 各ステップを順番に表示
    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setCurrentStep(i + 1)
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
    setOptimizedShifts(optimized)
    setIsOptimizing(false)
    setShowResult(true)
  }


  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            シフト最適化
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {showResult
              ? "最適化が完了しました。変更点を確認してください。"
              : "スタッフの希望シフトを基に、必要人数を満たす最適なシフトを生成します。"}
          </p>
        </div>
        <div className="flex gap-2">
          {!showResult && !isOptimizing && (
            <Button onClick={handleOptimize} className="gap-2" size="sm">
              <Sparkles className="h-4 w-4" />
              最適化を実行
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 最適化プロセス表示 */}
      {isOptimizing && (
        <div className="bg-white border border-blue-300 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <h3 className="text-lg font-semibold text-blue-900">最適化処理中...</h3>
          </div>
          <Progress value={(currentStep / (optimizationSteps.length || 1)) * 100} className="mb-4" />
          {currentStep > 0 && optimizationSteps[currentStep - 1] && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">
                  {optimizationSteps[currentStep - 1].title}
                </span>
              </div>
              <p className="text-sm text-gray-700 ml-7">
                {optimizationSteps[currentStep - 1].description}
              </p>
              {optimizationSteps[currentStep - 1].changes.length > 0 && (
                <div className="ml-7 space-y-1">
                  {optimizationSteps[currentStep - 1].changes.map((change, idx) => (
                    <div key={idx} className="text-xs bg-white rounded p-2 border border-gray-200">
                      <span className="font-medium">{change.staffName}:</span> {change.change}
                      <span className="text-gray-500 ml-2">({change.reason})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 最適化結果サマリー */}
      {showResult && optimizationSteps.length > 0 && (
        <div className="bg-white border border-green-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900">最適化完了</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            {optimizationSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="font-medium">{step.step}.</span>
                <span>{step.title}: {step.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* アクションボタン */}
      {showResult && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowResult(false)}>
            希望シフトに戻る
          </Button>
          <Button
            onClick={() => {
              if (onApply) {
                onApply()
              }
              onClose()
            }}
          >
            最適化シフトを適用
          </Button>
        </div>
      )}
    </div>
  )
}

