"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Sun, Cloud, CloudRain, Calendar } from "lucide-react"
import { format, addDays, subDays, startOfWeek, endOfWeek } from "date-fns"
import { ja } from "date-fns/locale"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"

// 店舗データ（実際のアプリケーションではAPIから取得）
const storeData = {
  name: "焼肉サキミル 渋谷店",
  period: "2025年2月21日〜27日",
  totals: {
    predictedCustomers: 574,
    predictedRevenue: 1722000,
    actualCustomers: 565,
    actualRevenue: 1695000,
  },
}

// 予測データ（実際のアプリケーションではAPIから取得）
const forecastData = [
  {
    date: "2/21",
    day: "金",
    weather: "sunny",
    tempHigh: 24,
    tempLow: 14,
    rainProb: 10,
    predictedCustomers: 78,
    actualCustomers: 75,
    predictedRevenue: 234000,
    actualRevenue: 225000,
    events: ["〇〇町花火大会 18:00-20:00"],
  },
  {
    date: "2/22",
    day: "土",
    weather: "sunny",
    tempHigh: 25,
    tempLow: 15,
    rainProb: 20,
    predictedCustomers: 100,
    actualCustomers: 98,
    predictedRevenue: 300000,
    actualRevenue: 294000,
    events: ["〇〇町花火大会 18:00-20:00"],
  },
  {
    date: "2/23",
    day: "日",
    weather: "cloudy",
    tempHigh: 23,
    tempLow: 14,
    rainProb: 30,
    predictedCustomers: 90,
    actualCustomers: 92,
    predictedRevenue: 270000,
    actualRevenue: 276000,
    events: [],
  },
  {
    date: "2/24",
    day: "月",
    weather: "rainy",
    tempHigh: 20,
    tempLow: 12,
    rainProb: 80,
    predictedCustomers: 60,
    actualCustomers: null,
    predictedRevenue: 180000,
    actualRevenue: null,
    events: [],
  },
  {
    date: "2/25",
    day: "火",
    weather: "cloudy",
    tempHigh: 22,
    tempLow: 13,
    rainProb: 40,
    predictedCustomers: 70,
    actualCustomers: null,
    predictedRevenue: 210000,
    actualRevenue: null,
    events: ["〇〇企業イベント"],
  },
  {
    date: "2/26",
    day: "水",
    weather: "sunny",
    tempHigh: 24,
    tempLow: 14,
    rainProb: 10,
    predictedCustomers: 80,
    actualCustomers: null,
    predictedRevenue: 240000,
    actualRevenue: null,
    events: [],
  },
  {
    date: "2/27",
    day: "木",
    weather: "sunny",
    tempHigh: 25,
    tempLow: 15,
    rainProb: 10,
    predictedCustomers: 85,
    actualCustomers: null,
    predictedRevenue: 255000,
    actualRevenue: null,
    events: [],
  },
]

const WeatherIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "sunny":
      return <Sun className="h-6 w-6 text-yellow-500" />
    case "cloudy":
      return <Cloud className="h-6 w-6 text-gray-500" />
    case "rainy":
      return <CloudRain className="h-6 w-6 text-blue-500" />
    default:
      return <Sun className="h-6 w-6 text-yellow-500" />
  }
}

export default function DemandForecastPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily")

  const handlePrevPeriod = () => {
    setCurrentDate((prevDate) => subDays(prevDate, viewMode === "daily" ? 1 : 7))
  }

  const handleNextPeriod = () => {
    setCurrentDate((prevDate) => addDays(prevDate, viewMode === "daily" ? 1 : 7))
  }

  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const currentWeekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  const displayedData =
    viewMode === "daily"
      ? forecastData.filter((d) => d.date === format(currentDate, "M/d"))
      : forecastData.filter((d) => {
          const date = new Date(d.date)
          return date >= currentWeekStart && date <= currentWeekEnd
        })

  // If no data is found for the current date, use an empty array
  if (displayedData.length === 0) {
    displayedData.push({
      date: format(currentDate, "M/d"),
      day: format(currentDate, "E", { locale: ja }),
      weather: "sunny",
      tempHigh: 0,
      tempLow: 0,
      rainProb: 0,
      predictedCustomers: 0,
      actualCustomers: null,
      predictedRevenue: 0,
      actualRevenue: null,
      events: [],
    })
  }

  const chartData = displayedData.map((d) => ({
    date: d.date,
    予測客数: d.predictedCustomers,
    実績客数: d.actualCustomers || null,
    予測売上: d.predictedRevenue / 10000,
    実績売上: d.actualRevenue ? d.actualRevenue / 10000 : null,
  }))

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{storeData.name}</h1>
              <p className="text-sm text-gray-600 mt-1">1ヶ月先までの詳細需要予測</p>
            </div>
            <div className="flex items-center gap-4">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "daily" | "weekly" | "monthly")}>
            <TabsList>
              <TabsTrigger value="daily">日別</TabsTrigger>
              <TabsTrigger value="weekly">週別</TabsTrigger>
              <TabsTrigger value="monthly">月別</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevPeriod}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">
                {viewMode === "daily"
                  ? format(currentDate, "yyyy年M月d日", { locale: ja })
                  : viewMode === "weekly"
                    ? `${format(currentWeekStart, "yyyy年M月d日", { locale: ja })} - ${format(currentWeekEnd, "M月d日", { locale: ja })}`
                    : format(currentDate, "yyyy年M月", { locale: ja })}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={handleNextPeriod}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* 月間サマリー */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">月間予測売上</p>
            <div className="text-2xl font-bold text-gray-900 mt-2">¥{((storeData.totals.predictedRevenue * 30) / 10000).toFixed(1)}万</div>
            <p className="text-xs text-gray-600 mt-1">
              前月比 +{((storeData.totals.predictedRevenue / storeData.totals.actualRevenue - 1) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">月間予測客数</p>
            <div className="text-2xl font-bold text-gray-900 mt-2">{storeData.totals.predictedCustomers * 30}人</div>
            <p className="text-xs text-gray-600 mt-1">
              前月比 +{((storeData.totals.predictedCustomers / storeData.totals.actualCustomers - 1) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">平均客単価</p>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              ¥{Math.round(storeData.totals.predictedRevenue / storeData.totals.predictedCustomers).toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 mt-1">前月比 +2.3%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">予測精度</p>
            <div className="text-2xl font-bold text-gray-900 mt-2">94.2%</div>
            <p className="text-xs text-gray-600 mt-1">過去30日平均</p>
          </div>
        </div>

        {/* 1ヶ月予測チャート */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">1ヶ月間の需要予測</h3>
          <p className="text-sm text-gray-600 mb-4">売上と客数の推移予測</p>
          <div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={Array.from({ length: 30 }, (_, i) => {
                  const date = addDays(new Date(), i)
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6
                  const multiplier = isWeekend ? 1.3 : 1.0
                  const baseCustomers = 150 + Math.sin(i / 7) * 30
                  const baseSales = baseCustomers * (3000 + Math.random() * 1000)

                  return {
                    date: format(date, "M/d"),
                    予測客数: Math.round(baseCustomers * multiplier),
                    予測売上: Math.round((baseSales * multiplier) / 1000), // 千円単位
                    天気影響: isWeekend ? "週末" : "平日",
                  }
                })}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="予測客数" stroke="#8884d8" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="予測売上" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          </div>
        </div>

        {/* 詳細予測データ */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">詳細予測データ（1ヶ月間）</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                CSVエクスポート
              </Button>
              <Button variant="outline" size="sm">
                予測を更新
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
          {Array.from({ length: 30 }, (_, i) => {
            const date = addDays(new Date(), i)
            const isWeekend = date.getDay() === 0 || date.getDay() === 6
            const multiplier = isWeekend ? 1.3 : 1.0
            const baseCustomers = 150 + Math.sin(i / 7) * 30
            const baseSales = baseCustomers * (3000 + Math.random() * 1000)
            const weatherTypes = ["sunny", "cloudy", "rainy"]
            const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)]
            const tempHigh = 20 + Math.random() * 10
            const tempLow = tempHigh - 8
            const rainProb = weather === "rainy" ? 80 : weather === "cloudy" ? 40 : 10

            // イベント情報（ランダムに生成）
            const events = i % 7 === 0 ? ["地域祭り", "コンサート"] : i % 5 === 0 ? ["商店街セール"] : []

            return (
              <div key={i} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-1">
                      <div className="font-medium text-lg">
                        {format(date, "M/d", { locale: ja })} ({format(date, "E", { locale: ja })})
                      </div>
                      {isWeekend && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          週末
                        </Badge>
                      )}
                    </div>

                    <div className="md:col-span-1 flex items-center gap-2">
                      <WeatherIcon type={weather} />
                      <div className="text-sm">
                        <div className="font-medium">
                          {Math.round(tempHigh)}°/{Math.round(tempLow)}°
                        </div>
                        <div className="text-gray-500">降水{rainProb}%</div>
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <div className="text-sm text-gray-600">予測客数</div>
                      <div className="font-bold text-lg">{Math.round(baseCustomers * multiplier)}人</div>
                    </div>

                    <div className="md:col-span-1">
                      <div className="text-sm text-gray-600">予測売上</div>
                      <div className="font-bold text-lg">
                        ¥{Math.round((baseSales * multiplier) / 10000).toFixed(1)}万
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <div className="text-sm text-gray-600">イベント</div>
                      <div className="space-y-1">
                        {events.length > 0 ? (
                          events.map((event, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">なし</span>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        編集
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        </div>

        {/* イベント管理セクション */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            イベント管理
          </h3>
          <p className="text-sm text-gray-600 mb-4">売上に影響するイベント情報を管理</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">登録済みイベント</h3>
              <Button size="sm">新規イベント追加</Button>
            </div>

            <div className="space-y-3">
              {[
                { date: "3/15", name: "春祭り", impact: "+25%", type: "地域イベント" },
                { date: "3/22", name: "商店街セール", impact: "+15%", type: "商業イベント" },
                { date: "3/29", name: "桜まつり", impact: "+30%", type: "季節イベント" },
              ].map((event, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="font-medium">{event.date}</div>
                    <div>
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-gray-500">{event.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-green-600">
                      売上影響 {event.impact}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      編集
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
