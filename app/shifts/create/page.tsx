"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Send, Save, Plus, Minus, Edit, TrendingUp, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface HourlyStaffing {
  [hour: number]: number // hour -> required staff count
}

interface HourlyForecast {
  [hour: number]: {
    sales: number
    customers: number
    suggestedHall: number
    suggestedKitchen: number
  }
}

interface DayStaffing {
  date: Date
  hallStaffing: HourlyStaffing
  kitchenStaffing: HourlyStaffing
  forecastSales: number
  forecastCustomers: number
  hourlyForecast: HourlyForecast
  notes?: string
  isHoliday?: boolean
  holidayName?: string
}

// 営業時間（11時から23時）
const OPERATING_HOURS = Array.from({ length: 12 }, (_, i) => i + 11) // [11, 12, 13, ..., 22]

// 祝日データ（簡易版）
const holidays: Record<string, string> = {
  "2025-01-01": "元日",
  "2025-01-13": "成人の日",
  "2025-02-11": "建国記念の日",
  "2025-02-23": "天皇誕生日",
  "2025-03-20": "春分の日",
  "2025-04-29": "昭和の日",
  "2025-05-03": "憲法記念日",
  "2025-05-04": "みどりの日",
  "2025-05-05": "こどもの日",
  "2025-07-21": "海の日",
  "2025-08-11": "山の日",
  "2025-09-15": "敬老の日",
  "2025-09-23": "秋分の日",
  "2025-10-13": "スポーツの日",
  "2025-11-03": "文化の日",
  "2025-11-23": "勤労感謝の日",
}

// 祝日チェック関数
const isHoliday = (date: Date): { isHoliday: boolean; holidayName?: string } => {
  const dateStr = format(date, "yyyy-MM-dd")
  const holidayName = holidays[dateStr]
  return {
    isHoliday: !!holidayName,
    holidayName,
  }
}

// 時間帯別予測データ生成
const generateHourlyForecast = (date: Date, totalSales: number, totalCustomers: number): HourlyForecast => {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6
  const holidayInfo = isHoliday(date)
  const isSpecialDay = isWeekend || holidayInfo.isHoliday

  const hourlyForecast: HourlyForecast = {}

  OPERATING_HOURS.forEach((hour) => {
    let salesRatio = 0.05 // 基本5%
    let customerRatio = 0.05 // 基本5%

    // 時間帯による調整
    if (hour >= 11 && hour <= 13) {
      // ランチタイム
      salesRatio = isSpecialDay ? 0.12 : 0.1
      customerRatio = isSpecialDay ? 0.12 : 0.1
    } else if (hour >= 18 && hour <= 20) {
      // ディナータイム
      salesRatio = isSpecialDay ? 0.15 : 0.12
      customerRatio = isSpecialDay ? 0.15 : 0.12
    } else if (hour >= 14 && hour <= 17) {
      // アイドルタイム
      salesRatio = 0.03
      customerRatio = 0.03
    } else if (hour >= 21) {
      // 夜遅い時間
      salesRatio = isSpecialDay ? 0.08 : 0.06
      customerRatio = isSpecialDay ? 0.08 : 0.06
    }

    const hourlySales = Math.floor(totalSales * salesRatio)
    const hourlyCustomers = Math.floor(totalCustomers * customerRatio)

    // より現実的な範囲に調整
    const adjustedSales = Math.max(10000, Math.min(120000, hourlySales))
    const adjustedCustomers = Math.max(5, Math.min(50, hourlyCustomers))

    // 推奨人員数の計算（売上と客数から算出）
    const suggestedHall = Math.max(1, Math.ceil(adjustedCustomers / 25)) // 25人に1人
    const suggestedKitchen = Math.max(1, Math.ceil(adjustedCustomers / 35)) // 35人に1人

    hourlyForecast[hour] = {
      sales: adjustedSales,
      customers: adjustedCustomers,
      suggestedHall,
      suggestedKitchen,
    }
  })

  return hourlyForecast
}

// モックデータ生成
const generatePeriodData = (month: Date, type: "first-half" | "second-half"): DayStaffing[] => {
  const { start, end } = calculatePeriodDates(month, type)
  const days = []

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }

  return days.map((date) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const holidayInfo = isHoliday(date)
    const isSpecialDay = isWeekend || holidayInfo.isHoliday
    const multiplier = isSpecialDay ? 1.3 : 1.0

    const forecastSales = Math.floor((150000 + Math.random() * 100000) * multiplier)
    const forecastCustomers = Math.floor((80 + Math.random() * 60) * multiplier)

    // 時間帯別予測データを生成
    const hourlyForecast = generateHourlyForecast(date, forecastSales, forecastCustomers)

    // 基本的な人員配置パターン（推奨値をベースに）
    const baseHallStaffing: HourlyStaffing = {}
    const baseKitchenStaffing: HourlyStaffing = {}

    OPERATING_HOURS.forEach((hour) => {
      const forecast = hourlyForecast[hour]
      baseHallStaffing[hour] = forecast.suggestedHall
      baseKitchenStaffing[hour] = forecast.suggestedKitchen
    })

    return {
      date,
      hallStaffing: baseHallStaffing,
      kitchenStaffing: baseKitchenStaffing,
      forecastSales,
      forecastCustomers,
      hourlyForecast,
      notes: isWeekend ? "週末" : "",
      isHoliday: holidayInfo.isHoliday,
      holidayName: holidayInfo.holidayName,
    }
  })
}

const calculatePeriodDates = (month: Date, type: "first-half" | "second-half") => {
  const year = month.getFullYear()
  const monthNum = month.getMonth()

  if (type === "first-half") {
    return {
      start: new Date(year, monthNum, 1),
      end: new Date(year, monthNum, 15),
    }
  } else {
    const lastDay = new Date(year, monthNum + 1, 0).getDate()
    return {
      start: new Date(year, monthNum, 16),
      end: new Date(year, monthNum, lastDay),
    }
  }
}

export default function ShiftCreation() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [periodType, setPeriodType] = useState<"first-half" | "second-half">("first-half")
  const [weeklyData, setWeeklyData] = useState<DayStaffing[]>([])
  const [selectedPosition, setSelectedPosition] = useState<"hall" | "kitchen">("hall")
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    setWeeklyData(generatePeriodData(currentMonth, periodType))
  }, [currentMonth, periodType])

  const handleStaffCountChange = (dayIndex: number, hour: number, position: "hall" | "kitchen", change: number) => {
    setWeeklyData((prev) => {
      const newData = [...prev]
      const staffingKey = position === "hall" ? "hallStaffing" : "kitchenStaffing"
      const currentCount = newData[dayIndex][staffingKey][hour] || 0
      const newCount = Math.max(0, currentCount + change)

      newData[dayIndex] = {
        ...newData[dayIndex],
        [staffingKey]: {
          ...newData[dayIndex][staffingKey],
          [hour]: newCount,
        },
      }
      return newData
    })
  }

  const handleDirectInput = (dayIndex: number, hour: number, position: "hall" | "kitchen", value: string) => {
    const count = Number.parseInt(value) || 0
    setWeeklyData((prev) => {
      const newData = [...prev]
      const staffingKey = position === "hall" ? "hallStaffing" : "kitchenStaffing"

      newData[dayIndex] = {
        ...newData[dayIndex],
        [staffingKey]: {
          ...newData[dayIndex][staffingKey],
          [hour]: Math.max(0, count),
        },
      }
      return newData
    })
  }

  const handleDateClick = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex)
    setIsDetailModalOpen(true)
  }

  const calculateDayTotals = (day: DayStaffing) => {
    const hallTotal = Object.values(day.hallStaffing).reduce((sum, count) => sum + count, 0)
    const kitchenTotal = Object.values(day.kitchenStaffing).reduce((sum, count) => sum + count, 0)
    const totalHours = hallTotal + kitchenTotal
    const estimatedCost = totalHours * 1200 // 時給1200円として計算

    return {
      hallTotal,
      kitchenTotal,
      totalHours,
      estimatedCost,
    }
  }

  const calculateWeeklyTotals = () => {
    return weeklyData.reduce(
      (totals, day) => {
        const dayTotals = calculateDayTotals(day)
        return {
          totalSales: totals.totalSales + day.forecastSales,
          totalCustomers: totals.totalCustomers + day.forecastCustomers,
          totalHours: totals.totalHours + dayTotals.totalHours,
          totalCost: totals.totalCost + dayTotals.estimatedCost,
        }
      },
      { totalSales: 0, totalCustomers: 0, totalHours: 0, totalCost: 0 },
    )
  }

  const weeklyTotals = calculateWeeklyTotals()
  const laborCostRatio = ((weeklyTotals.totalCost / weeklyTotals.totalSales) * 100).toFixed(1)

  const handleNotifyEmployees = () => {
    alert("従業員にLINEで通知しました。")
  }

  const handleSave = () => {
    alert("シフトを保存しました。")
  }

  // 選択された日のデータ
  const selectedDay = selectedDayIndex !== null ? weeklyData[selectedDayIndex] : null

  // チャート用データの準備
  const chartData = selectedDay
    ? OPERATING_HOURS.map((hour) => {
        const forecast = selectedDay.hourlyForecast[hour]
        return {
          hour: `${hour}時`,
          売上予測: forecast.sales, // 千円単位ではなく実際の金額
          客数予測: forecast.customers,
          ホール現在: selectedDay.hallStaffing[hour] || 0,
          ホール推奨: forecast.suggestedHall,
          キッチン現在: selectedDay.kitchenStaffing[hour] || 0,
          キッチン推奨: forecast.suggestedKitchen,
        }
      })
    : []

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">シフト作成</h1>
          <p className="text-sm text-gray-500">時間帯別人員配置の設定（日付をクリックで詳細表示）</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
          <Button onClick={handleNotifyEmployees}>
            <Send className="mr-2 h-4 w-4" />
            従業員に通知
          </Button>
        </div>
      </div>

      {/* 週間サマリー */}
      

      {/* 期間選択 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {format(currentMonth, "yyyy年MM月", { locale: ja })}
              {periodType === "first-half" ? "前半" : "後半"}（
              {format(calculatePeriodDates(currentMonth, periodType).start, "MM月dd日", { locale: ja })} -
              {format(calculatePeriodDates(currentMonth, periodType).end, "MM月dd日", { locale: ja })}）
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={`${format(currentMonth, "yyyy-MM")}-${periodType}`}
                onValueChange={(value) => {
                  const [yearMonth, type] = value.split("-")
                  const [year, month] = yearMonth.split("-").map(Number)
                  setCurrentMonth(new Date(year, month - 1))
                  setPeriodType(type as "first-half" | "second-half")
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }, (_, i) => {
                    const date = new Date()
                    date.setMonth(date.getMonth() + i - 2)
                    const monthStr = format(date, "yyyy年MM月", { locale: ja })
                    const valuePrefix = format(date, "yyyy-MM")

                    return [
                      <SelectItem key={`${valuePrefix}-first-half`} value={`${valuePrefix}-first-half`}>
                        {monthStr}前半
                      </SelectItem>,
                      <SelectItem key={`${valuePrefix}-second-half`} value={`${valuePrefix}-second-half`}>
                        {monthStr}後半
                      </SelectItem>,
                    ]
                  }).flat()}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ポジション選択 */}
      <div className="flex gap-2">
        <Button
          variant={selectedPosition === "hall" ? "default" : "outline"}
          onClick={() => setSelectedPosition("hall")}
        >
          ホール
        </Button>
        <Button
          variant={selectedPosition === "kitchen" ? "default" : "outline"}
          onClick={() => setSelectedPosition("kitchen")}
        >
          キッチン
        </Button>
      </div>

      {/* シフト編集テーブル */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedPosition === "hall" ? "ホール" : "キッチン"}スタッフ配置
            <Badge variant="outline">時間帯別必要人数</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 z-10 bg-gray-50 border p-3 text-center font-medium text-gray-700 min-w-[60px]">
                    日付
                  </th>
                  <th className="sticky left-[60px] z-10 bg-gray-50 border p-3 text-center font-medium text-gray-700 min-w-[50px]">
                    曜日
                  </th>
                  <th className="sticky left-[110px] z-10 bg-gray-50 border p-3 text-center font-medium text-gray-700 min-w-[80px]">
                    売上予測
                  </th>
                  <th className="sticky left-[190px] z-10 bg-gray-50 border p-3 text-center font-medium text-gray-700 min-w-[80px]">
                    客数予測
                  </th>
                  {OPERATING_HOURS.map((hour) => (
                    <th key={hour} className="border p-2 text-center font-medium text-gray-700 min-w-[60px]">
                      {hour}時
                    </th>
                  ))}
                  <th className="border p-3 text-center font-medium text-gray-700 min-w-[80px]">合計時間</th>
                  <th className="border p-3 text-center font-medium text-gray-700 min-w-[100px]">人件費</th>
                </tr>
              </thead>
              <tbody>
                {weeklyData.map((day, dayIndex) => {
                  const dayTotals = calculateDayTotals(day)
                  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
                  const isSpecialDay = isWeekend || day.isHoliday
                  const staffingData = selectedPosition === "hall" ? day.hallStaffing : day.kitchenStaffing
                  const positionTotal = selectedPosition === "hall" ? dayTotals.hallTotal : dayTotals.kitchenTotal

                  return (
                    <tr key={dayIndex} className={`hover:bg-gray-50 ${isSpecialDay ? "bg-red-50" : ""}`}>
                      <td className="sticky left-0 z-10 bg-white border p-3 text-center font-medium">
                        <div className="flex flex-col items-center">
                          <Button
                            variant="ghost"
                            className="p-1 h-auto font-bold hover:bg-blue-100"
                            onClick={() => handleDateClick(dayIndex)}
                          >
                            <div className="flex flex-col items-center">
                              <span>{format(day.date, "d", { locale: ja })}</span>
                              <Edit className="h-3 w-3 mt-1 text-blue-500" />
                            </div>
                          </Button>
                          {day.isHoliday && day.holidayName && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              {day.holidayName}
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="sticky left-[60px] z-10 bg-white border p-3 text-center">
                        <span className={`text-sm font-medium ${isSpecialDay ? "text-red-600" : "text-gray-700"}`}>
                          {format(day.date, "E", { locale: ja })}
                        </span>
                      </td>

                      <td className="sticky left-[110px] z-10 bg-white border p-3 text-center text-sm">
                        ¥{day.forecastSales.toLocaleString()}
                      </td>

                      <td className="sticky left-[190px] z-10 bg-white border p-3 text-center text-sm">
                        {day.forecastCustomers}人
                      </td>

                      {OPERATING_HOURS.map((hour) => {
                        const currentCount = staffingData[hour] || 0
                        const suggested =
                          selectedPosition === "hall"
                            ? day.hourlyForecast[hour].suggestedHall
                            : day.hourlyForecast[hour].suggestedKitchen
                        const isDifferent = currentCount !== suggested

                        return (
                          <td key={hour} className="border p-1">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0 bg-transparent"
                                  onClick={() => handleStaffCountChange(dayIndex, hour, selectedPosition, -1)}
                                  disabled={currentCount <= 0}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  value={currentCount}
                                  onChange={(e) => handleDirectInput(dayIndex, hour, selectedPosition, e.target.value)}
                                  className={`w-12 h-6 text-center text-sm p-0 ${isDifferent ? "border-orange-300 bg-orange-50" : ""}`}
                                  min="0"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0 bg-transparent"
                                  onClick={() => handleStaffCountChange(dayIndex, hour, selectedPosition, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              {isDifferent && <span className="text-xs text-orange-600">推奨:{suggested}</span>}
                            </div>
                          </td>
                        )
                      })}

                      <td className="border p-3 text-center font-medium">{positionTotal}時間</td>
                      <td className="border p-3 text-center">¥{((positionTotal * 1200) / 1000).toFixed(1)}千</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-medium">
                  <td className="sticky left-0 z-10 bg-gray-100 border p-3 text-center">合計</td>
                  <td className="sticky left-[60px] z-10 bg-gray-100 border p-3 text-center">-</td>
                  <td className="sticky left-[110px] z-10 bg-gray-100 border p-3 text-center">
                    ¥{(weeklyTotals.totalSales / 10000).toFixed(1)}万
                  </td>
                  <td className="sticky left-[190px] z-10 bg-gray-100 border p-3 text-center">
                    {weeklyTotals.totalCustomers}人
                  </td>
                  {OPERATING_HOURS.map((hour) => {
                    const hourTotal = weeklyData.reduce((sum, day) => {
                      const staffingData = selectedPosition === "hall" ? day.hallStaffing : day.kitchenStaffing
                      return sum + (staffingData[hour] || 0)
                    }, 0)
                    return (
                      <td key={hour} className="border p-3 text-center font-medium">
                        {hourTotal}
                      </td>
                    )
                  })}
                  <td className="border p-3 text-center font-medium">
                    {selectedPosition === "hall"
                      ? weeklyData.reduce((sum, day) => sum + calculateDayTotals(day).hallTotal, 0)
                      : weeklyData.reduce((sum, day) => sum + calculateDayTotals(day).kitchenTotal, 0)}
                    時間
                  </td>
                  <td className="border p-3 text-center font-medium">
                    ¥
                    {(
                      ((selectedPosition === "hall"
                        ? weeklyData.reduce((sum, day) => sum + calculateDayTotals(day).hallTotal, 0)
                        : weeklyData.reduce((sum, day) => sum + calculateDayTotals(day).kitchenTotal, 0)) *
                        1200) /
                      1000
                    ).toFixed(1)}
                    千
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 日別詳細モーダル */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {selectedDay && format(selectedDay.date, "yyyy年M月d日 (E)", { locale: ja })} - 時間帯別詳細
            </DialogTitle>
          </DialogHeader>

          {selectedDay && (
            <div className="space-y-6">
              {/* 日別サマリー */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600">日別売上予測</div>
                    <div className="text-xl font-bold">¥{selectedDay.forecastSales.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600">日別客数予測</div>
                    <div className="text-xl font-bold">{selectedDay.forecastCustomers}人</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600">日別人件費</div>
                    <div className="text-xl font-bold">
                      ¥{calculateDayTotals(selectedDay).estimatedCost.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 時間帯別グラフ */}
              <Card>
                <CardHeader>
                  <CardTitle>時間帯別売上・客数予測</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="売上予測"
                          stroke="#2563eb"
                          strokeWidth={2}
                          name="売上予測(円)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="客数予測"
                          stroke="#16a34a"
                          strokeWidth={2}
                          name="客数予測(人)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 時間帯別人員配置調整 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ホール */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      ホールスタッフ配置
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {OPERATING_HOURS.map((hour) => {
                        const forecast = selectedDay.hourlyForecast[hour]
                        const currentCount = selectedDay.hallStaffing[hour] || 0
                        const suggested = forecast.suggestedHall

                        return (
                          <div key={hour} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">
                                {hour}:00 - {hour + 1}:00
                              </div>
                              <div className="text-sm text-gray-600">
                                売上: ¥{forecast.sales.toLocaleString()} | 客数: {forecast.customers}人
                              </div>
                              <div className="text-sm text-blue-600">推奨人数: {suggested}人</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  selectedDayIndex !== null &&
                                  handleStaffCountChange(selectedDayIndex, hour, "hall", -1)
                                }
                                disabled={currentCount <= 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{currentCount}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  selectedDayIndex !== null && handleStaffCountChange(selectedDayIndex, hour, "hall", 1)
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              {currentCount !== suggested && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600"
                                  onClick={() =>
                                    selectedDayIndex !== null &&
                                    handleDirectInput(selectedDayIndex, hour, "hall", suggested.toString())
                                  }
                                >
                                  推奨適用
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* キッチン */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      キッチンスタッフ配置
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {OPERATING_HOURS.map((hour) => {
                        const forecast = selectedDay.hourlyForecast[hour]
                        const currentCount = selectedDay.kitchenStaffing[hour] || 0
                        const suggested = forecast.suggestedKitchen

                        return (
                          <div key={hour} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">
                                {hour}:00 - {hour + 1}:00
                              </div>
                              <div className="text-sm text-gray-600">
                                売上: ¥{forecast.sales.toLocaleString()} | 客数: {forecast.customers}人
                              </div>
                              <div className="text-sm text-green-600">推奨人数: {suggested}人</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  selectedDayIndex !== null &&
                                  handleStaffCountChange(selectedDayIndex, hour, "kitchen", -1)
                                }
                                disabled={currentCount <= 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{currentCount}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  selectedDayIndex !== null &&
                                  handleStaffCountChange(selectedDayIndex, hour, "kitchen", 1)
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              {currentCount !== suggested && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() =>
                                    selectedDayIndex !== null &&
                                    handleDirectInput(selectedDayIndex, hour, "kitchen", suggested.toString())
                                  }
                                >
                                  推奨適用
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 時間帯別分析 */}
      
    </div>
  )
}
