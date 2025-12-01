"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, UserPlus, Calendar, Clock } from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isToday,
} from "date-fns"
import { ja } from "date-fns/locale"
import Link from "next/link"

// スタッフデータの型定義
interface StaffMember {
  id: string
  name: string
  avatar?: string
  role: "店長" | "ホールスタッフ" | "キッチンスタッフ" | "ホールマネージャー" | "キッチンチーフ"
  employmentType: "正社員" | "パート" | "アルバイト"
}

interface ShiftData {
  staffId: string
  startTime: string
  endTime: string
  position: "ホール" | "キッチン"
}

interface DayData {
  date: Date
  shifts: ShiftData[]
}

// サンプルスタッフデータ
const staffMembers: StaffMember[] = [
  {
    id: "1",
    name: "佐藤 一郎",
    avatar: "/placeholder.svg?height=32&width=32",
    role: "店長",
    employmentType: "正社員",
  },
  {
    id: "2",
    name: "田中 花子",
    avatar: "/placeholder.svg?height=32&width=32",
    role: "ホールスタッフ",
    employmentType: "パート",
  },
  {
    id: "3",
    name: "鈴木 健太",
    avatar: "/placeholder.svg?height=32&width=32",
    role: "キッチンスタッフ",
    employmentType: "アルバイト",
  },
  {
    id: "4",
    name: "山田 太郎",
    avatar: "/placeholder.svg?height=32&width=32",
    role: "ホールマネージャー",
    employmentType: "正社員",
  },
  {
    id: "5",
    name: "伊藤 美咲",
    avatar: "/placeholder.svg?height=32&width=32",
    role: "ホールスタッフ",
    employmentType: "アルバイト",
  },
  {
    id: "6",
    name: "渡辺 直樹",
    avatar: "/placeholder.svg?height=32&width=32",
    role: "キッチンチーフ",
    employmentType: "正社員",
  },
]

// シフトデータを生成する関数
const generateShiftData = (month: Date): DayData[] => {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const days = eachDayOfInterval({ start, end })

  return days.map((date) => {
    const dayOfWeek = getDay(date)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // 週末は少し多めのシフト、平日は標準的なシフト
    const shiftCount = isWeekend ? Math.floor(Math.random() * 6) + 4 : Math.floor(Math.random() * 5) + 3

    const shifts: ShiftData[] = []
    const usedStaff = new Set<string>()

    for (let i = 0; i < shiftCount && usedStaff.size < staffMembers.length; i++) {
      const availableStaff = staffMembers.filter((staff) => !usedStaff.has(staff.id))
      if (availableStaff.length === 0) break

      const staff = availableStaff[Math.floor(Math.random() * availableStaff.length)]
      usedStaff.add(staff.id)

      // シフト時間をランダムに生成
      const shiftTypes = [
        { start: "09:00", end: "17:00" },
        { start: "10:00", end: "18:00" },
        { start: "11:00", end: "19:00" },
        { start: "13:00", end: "21:00" },
        { start: "17:00", end: "23:00" },
      ]

      const shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)]
      const position = staff.role.includes("キッチン") ? "キッチン" : "ホール"

      shifts.push({
        staffId: staff.id,
        startTime: shiftType.start,
        endTime: shiftType.end,
        position,
      })
    }

    return { date, shifts }
  })
}

// 役職に応じた色を取得
const getRoleColor = (role: string) => {
  switch (role) {
    case "店長":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "ホールマネージャー":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "キッチンチーフ":
      return "bg-green-100 text-green-800 border-green-200"
    case "ホールスタッフ":
      return "bg-sky-100 text-sky-800 border-sky-200"
    case "キッチンスタッフ":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

// ポジションに応じた色を取得
const getPositionColor = (position: "ホール" | "キッチン") => {
  return position === "ホール" ? "bg-blue-50 border-l-4 border-l-blue-400" : "bg-green-50 border-l-4 border-l-green-400"
}

export default function StaffCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarData, setCalendarData] = useState<DayData[]>(() => generateShiftData(new Date()))

  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1)
    setCurrentMonth(newMonth)
    setCalendarData(generateShiftData(newMonth))
  }

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1)
    setCurrentMonth(newMonth)
    setCalendarData(generateShiftData(newMonth))
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setCalendarData(generateShiftData(today))
  }

  // カレンダーのグリッドを作成（月曜始まり）
  const createCalendarGrid = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const startDate = new Date(start)

    // 月曜日から始まるように調整
    const startDay = getDay(start)
    const daysToSubtract = startDay === 0 ? 6 : startDay - 1
    startDate.setDate(start.getDate() - daysToSubtract)

    const days = []
    const current = new Date(startDate)

    // 6週間分のデータを生成
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        days.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }
    }

    return days
  }

  const calendarDays = createCalendarGrid()
  const weekdays = ["月", "火", "水", "木", "金", "土", "日"]

  // 月間統計を計算
  const monthlyStats = {
    totalShifts: calendarData.reduce((sum, day) => sum + day.shifts.length, 0),
    totalStaff: new Set(calendarData.flatMap((day) => day.shifts.map((shift) => shift.staffId))).size,
    avgShiftsPerDay: (calendarData.reduce((sum, day) => sum + day.shifts.length, 0) / calendarData.length).toFixed(1),
  }

  return (
    <div className="container py-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">スタッフカレンダー</h1>
          <p className="text-gray-600 mt-1">月間シフトスケジュール管理</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            シフト表出力
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            新規スタッフ登録
          </Button>
        </div>
      </div>

      {/* 月間統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">月間総シフト数</p>
                <p className="text-2xl font-bold text-gray-900">{monthlyStats.totalShifts}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">稼働スタッフ数</p>
                <p className="text-2xl font-bold text-gray-900">{monthlyStats.totalStaff}人</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">1日平均シフト数</p>
                <p className="text-2xl font-bold text-gray-900">{monthlyStats.avgShiftsPerDay}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* カレンダーナビゲーション */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{format(currentMonth, "yyyy年M月", { locale: ja })}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                今月
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-1">
            {/* 曜日ヘッダー */}
            {weekdays.map((day, index) => (
              <div
                key={day}
                className={`p-3 text-center text-sm font-semibold ${
                  index >= 5 ? "text-red-600 bg-red-50" : "text-gray-700 bg-gray-50"
                } rounded-t-lg`}
              >
                {day}
              </div>
            ))}

            {/* カレンダー日付 */}
            {calendarDays.map((day, index) => {
              const dayData = calendarData.find(
                (d) => d.date.getDate() === day.getDate() && d.date.getMonth() === day.getMonth(),
              )
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isWeekend = getDay(day) >= 5
              const todayClass = isToday(day) ? "ring-2 ring-blue-500 bg-blue-50" : ""

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border border-gray-200 transition-all hover:shadow-md ${
                    !isCurrentMonth ? "bg-gray-50 opacity-50" : "bg-white"
                  } ${isWeekend ? "bg-red-50" : ""} ${todayClass}`}
                >
                  {/* 日付 */}
                  <div
                    className={`text-sm font-semibold mb-2 ${
                      isToday(day) ? "text-blue-600" : isWeekend ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {format(day, "d")}
                  </div>

                  {/* シフト情報 */}
                  {isCurrentMonth && dayData && (
                    <div className="space-y-1">
                      {dayData.shifts.slice(0, 3).map((shift, shiftIndex) => {
                        const staff = staffMembers.find((s) => s.id === shift.staffId)
                        if (!staff) return null

                        return (
                          <Link
                            key={shiftIndex}
                            href={`/staff/${staff.id}`}
                            className={`block p-1.5 rounded-md text-xs transition-all hover:shadow-sm cursor-pointer ${getPositionColor(shift.position)}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={staff.avatar || "/placeholder.svg"} alt={staff.name} />
                                <AvatarFallback className="text-xs">{staff.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{staff.name}</div>
                                <div className="text-gray-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {shift.startTime}-{shift.endTime}
                                </div>
                              </div>
                            </div>
                            <div className="mt-1">
                              <Badge variant="outline" className={`text-xs ${getRoleColor(staff.role)}`}>
                                {shift.position}
                              </Badge>
                            </div>
                          </Link>
                        )
                      })}

                      {/* 追加のシフトがある場合 */}
                      {dayData.shifts.length > 3 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{dayData.shifts.length - 3}件のシフト
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* スタッフ一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>スタッフ一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffMembers.map((staff) => (
              <Link
                key={staff.id}
                href={`/staff/${staff.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all hover:border-gray-300"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={staff.avatar || "/placeholder.svg"} alt={staff.name} />
                    <AvatarFallback>{staff.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{staff.name}</h3>
                    <p className="text-sm text-gray-600">{staff.role}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {staff.employmentType}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
