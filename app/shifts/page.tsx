"use client"

import { useState } from "react"
import { ShiftHeader } from "@/components/shift-header"
import { ShiftTimeline } from "@/components/shift-timeline"
import { ShiftEdit } from "@/components/shift-edit"
import { ShiftOptimization } from "@/components/shift-optimization"
import { StoreSelector, STORES } from "@/components/store-selector"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PencilIcon, SaveIcon, Sparkles, CheckCircle2, Clock, FileText } from "lucide-react"

export type ShiftStatus = "preferred" | "optimized" | "confirmed"

export default function ShiftManagement() {
  const [isEditing, setIsEditing] = useState(false)
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showOptimization, setShowOptimization] = useState(false)
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus>("preferred")
  const [selectedStores, setSelectedStores] = useState<string[]>(["mores"]) // デフォルトで1店舗選択

  const handleToggleEdit = () => {
    setIsEditing((prev) => !prev)
    setShowOptimization(false)
  }

  const handleShowOptimization = () => {
    setShowOptimization(true)
    setIsEditing(false)
  }

  const handleApplyOptimization = () => {
    setShiftStatus("optimized")
    setShowOptimization(false)
  }

  const handleConfirmShift = () => {
    setShiftStatus("confirmed")
    setIsEditing(false)
  }

  const getStatusBadge = () => {
    switch (shiftStatus) {
      case "preferred":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            希望シフト
          </Badge>
        )
      case "optimized":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            最適化済み
          </Badge>
        )
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            確定済み
          </Badge>
        )
    }
  }

  const getStatusDescription = () => {
    switch (shiftStatus) {
      case "preferred":
        return "スタッフから提出された希望シフトを表示しています"
      case "optimized":
        return "最適化処理を適用したシフトを表示しています"
      case "confirmed":
        return "確定済みのシフトを表示しています"
    }
  }

  // 選択された店舗がない場合はデフォルトで1店舗を選択
  const displayStores = selectedStores.length > 0 ? selectedStores : ["mores"]

  return (
    <div className="space-y-4">
      {/* 店舗選択とヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <StoreSelector selectedStores={selectedStores} onStoresChange={setSelectedStores} />
          <ShiftHeader
            viewMode={viewMode}
            setViewMode={setViewMode}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
          />
        </div>
      </div>

      {/* 選択された店舗ごとにシフト表を表示 */}
      {displayStores.map((storeId) => {
        const store = STORES.find((s) => s.id === storeId)
        if (!store) return null

        return (
          <div key={storeId} className="bg-white rounded-lg shadow-sm">
            <div className="border-b p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-800">{store.name}</h2>
                  {getStatusBadge()}
                </div>
                <div className="flex gap-2">
                  {!isEditing && !showOptimization && shiftStatus !== "confirmed" && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleShowOptimization}>
                      <Sparkles className="h-4 w-4" />
                      シフト最適化
                    </Button>
                  )}
                  {shiftStatus === "optimized" && !isEditing && (
                    <Button variant="default" size="sm" className="gap-2" onClick={handleConfirmShift}>
                      <CheckCircle2 className="h-4 w-4" />
                      シフトを確定
                    </Button>
                  )}
                  <Button variant={isEditing ? "default" : "outline"} size="sm" className="gap-2" onClick={handleToggleEdit}>
                    {isEditing ? (
                      <>
                        <SaveIcon className="h-4 w-4" />
                        保存する
                      </>
                    ) : (
                      <>
                        <PencilIcon className="h-4 w-4" />
                        編集する
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <FileText className="h-4 w-4" />
                <span>{getStatusDescription()}</span>
              </div>
            </div>
            <div className="p-6">
              {/* Integrated single table view */}
              <div className="integrated-shift-view">
                {/* 最適化UI（既存のシフト表示の上に表示） */}
                {showOptimization && (
                  <div className="mb-6">
                    <ShiftOptimization
                      viewMode={viewMode}
                      currentDate={currentDate}
                      onClose={() => setShowOptimization(false)}
                      onApply={handleApplyOptimization}
                    />
                  </div>
                )}
                
                {/* 既存のシフト表示（最適化UIがあっても表示し続ける） */}
                {isEditing ? (
                  <ShiftEdit viewMode={viewMode} currentDate={currentDate} shiftStatus={shiftStatus} />
                ) : (
                  <ShiftTimeline viewMode={viewMode} currentDate={currentDate} shiftStatus={shiftStatus} />
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
