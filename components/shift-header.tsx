"use client"

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { format, addDays, subDays, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns"
import { ja } from "date-fns/locale"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const formatWeekRange = (date: Date) => {
  const monday = startOfWeek(date, { weekStartsOn: 1 })
  const sunday = endOfWeek(date, { weekStartsOn: 1 })

  if (monday.getMonth() === sunday.getMonth()) {
    return `${format(monday, "yyyy年MM月dd日", { locale: ja })} - ${format(sunday, "dd日", { locale: ja })}`
  }
  return `${format(monday, "yyyy年MM月dd日", { locale: ja })} - ${format(sunday, "MM月dd日", { locale: ja })}`
}

export function ShiftHeader({
  viewMode,
  setViewMode,
  currentDate,
  setCurrentDate,
}: {
  viewMode: "daily" | "weekly" | "monthly"
  setViewMode: (mode: "daily" | "weekly" | "monthly") => void
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
          <Select defaultValue="bayquarter">
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="キリンシティ 横浜ベイクォーター店" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bayquarter">キリンシティ 横浜ベイクォーター店</SelectItem>
              <SelectItem value="mores">キリンシティ 横浜モアーズ店</SelectItem>
              <SelectItem value="fti">キリンシティ FOOD＆TIME ISETAN YOKOHAMA店</SelectItem>
              <SelectItem value="cial">キリンシティ CIAL桜木町店</SelectItem>
              <SelectItem value="machida">キリンシティ 町田店</SelectItem>
            </SelectContent>
          </Select>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "daily" | "weekly" | "monthly")}>
            <TabsList>
              <TabsTrigger value="daily">日別</TabsTrigger>
              <TabsTrigger value="weekly">週別</TabsTrigger>
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
                    : viewMode === "weekly"
                      ? subDays(prevDate, 7)
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
                : viewMode === "weekly"
                  ? formatWeekRange(currentDate)
                  : format(currentDate, "yyyy年MM月", { locale: ja })}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setCurrentDate((prevDate) =>
                  viewMode === "daily"
                    ? addDays(prevDate, 1)
                    : viewMode === "weekly"
                      ? addDays(prevDate, 7)
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
