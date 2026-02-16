"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { format, addDays, subDays, addMonths, subMonths } from "date-fns"
import { ja } from "date-fns/locale"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ShiftHeader({
  viewMode,
  setViewMode,
  currentDate,
  setCurrentDate,
}: {
  viewMode: "daily" | "monthly"
  setViewMode: (mode: "daily" | "monthly") => void
  currentDate: Date
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>
}) {
  const handlePreviousDay = () => {
    setCurrentDate((prevDate) => subDays(prevDate, 1))
  }

  const handleNextDay = () => {
    setCurrentDate((prevDate) => addDays(prevDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="flex flex-wrap items-center gap-3 min-w-0">
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "daily" | "monthly")}>
        <TabsList className="shrink-0">
          <TabsTrigger value="daily">日別</TabsTrigger>
          <TabsTrigger value="monthly">月別</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setCurrentDate((prevDate) =>
              viewMode === "daily"
                ? subDays(prevDate, 1)
                : subMonths(prevDate, 1),
            )
          }}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleToday}>
          今日
        </Button>
        <div className="w-[200px] sm:w-[240px] text-center font-medium text-sm sm:text-base min-w-0">
          {viewMode === "daily"
            ? format(currentDate, "yyyy年MM月dd日", { locale: ja })
            : format(currentDate, "yyyy年MM月", { locale: ja })}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setCurrentDate((prevDate) =>
              viewMode === "daily"
                ? addDays(prevDate, 1)
                : addMonths(prevDate, 1),
            )
          }}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" className="h-9 text-xs sm:text-sm">
          スタッフ管理
        </Button>
        <Button size="sm" variant="outline" className="h-9 text-xs sm:text-sm whitespace-nowrap">
          シフトを公開する
        </Button>
      </div>
    </div>
  )
}
