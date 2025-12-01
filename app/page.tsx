"use client"

import { useState } from "react"
import { ShiftHeader } from "@/components/shift-header"
import { ShiftMetrics } from "@/components/shift-metrics"
import { ShiftTimeline } from "@/components/shift-timeline"
import { ShiftEdit } from "@/components/shift-edit"
import { Button } from "@/components/ui/button"
import { PencilIcon, SaveIcon } from "lucide-react"
import { redirect } from "next/navigation"

export default function ShiftManagement() {
  redirect("/demand-forecast")
  const [isEditing, setIsEditing] = useState(false)
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily")
  const [currentDate, setCurrentDate] = useState(new Date())

  const handleToggleEdit = () => {
    setIsEditing((prev) => !prev)
  }

  return (
    <div className="space-y-8">
      <ShiftHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
      />
      <ShiftMetrics viewMode={viewMode} currentDate={currentDate} />
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">シフトタイムライン</h2>
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
        {isEditing ? (
          <ShiftEdit viewMode={viewMode} currentDate={currentDate} />
        ) : (
          <ShiftTimeline viewMode={viewMode} currentDate={currentDate} />
        )}
      </div>
    </div>
  )
}
