"use client"

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Plate One東京店" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plateone-tokyo">Plate One東京店</SelectItem>
            </SelectContent>
          </Select>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "daily" | "monthly")}>
            <TabsList>
              <TabsTrigger value="daily">日別</TabsTrigger>
              <TabsTrigger value="monthly">月別</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
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
            <div className="w-[240px] text-center font-medium">
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
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10">
            スタッフ管理
          </Button>
          <Button className="h-10" variant="outline">
            シフトを公開する
          </Button>
        </div>
      </div>
    </div>
  )
}
