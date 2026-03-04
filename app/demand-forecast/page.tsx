"use client"
import { useState, useMemo } from "react"
import { format, subDays, addDays } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sun, Cloud, CloudRain, ChevronLeft, ChevronRight, ArrowRight, Sparkles, RefreshCw, Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { ArrowUp, Users, Calendar, Phone, AlertCircle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { seededRandom } from "@/lib/utils"
import { useToast } from "@/components/toast"
import { StatCard } from "@/components/stat-card"

function generateDemandData(baseDate: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(baseDate, 6 - i)
    const dateStr = format(date, "M/d")
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isFriday = dayOfWeek === 5
    // 実績ベース: 平日~95人, 金曜~170人, 土日~255人
    const baseCustomers = isWeekend ? 255 : isFriday ? 170 : 95
    const baseAvgSpend = isWeekend ? 2900 : isFriday ? 3100 : 2700
    const variation = Math.round(seededRandom(`demand-${dateStr}`) * baseCustomers * 0.15 - baseCustomers * 0.075)
    const customers = baseCustomers + variation
    const revenue = Math.round(customers * (baseAvgSpend + (seededRandom(`rev-${dateStr}`) - 0.5) * 400))
    // 過去日（i < 6）は実績データを生成、当日（i === 6）は途中実績
    const isPast = i < 6
    const isToday = i === 6
    const actualCustomers = isPast
      ? Math.round(customers * (0.92 + seededRandom(`actual-c-${dateStr}`) * 0.16))
      : isToday ? Math.round(customers * 0.45 * (0.95 + seededRandom(`actual-today-c-${dateStr}`) * 0.1)) : null
    const actualRevenue = isPast
      ? Math.round(revenue * (0.93 + seededRandom(`actual-r-${dateStr}`) * 0.14))
      : isToday ? Math.round(revenue * 0.45 * (0.95 + seededRandom(`actual-today-r-${dateStr}`) * 0.1)) : null
    return { date: dateStr, customers, revenue, actualCustomers, actualRevenue, isPast, isToday }
  })
}

function generateHourlyData(seed: string, dayOfWeek: number) {
  const currentHour = new Date().getHours()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isFriday = dayOfWeek === 5

  // 実績ベースの時間帯別パターン（営業時間 11:00-22:00）
  const weekdayBase = [
    { time: "11:00", hour: 11, customers: 8,  revenue: 17600 },
    { time: "12:00", hour: 12, customers: 18, revenue: 34200 },
    { time: "13:00", hour: 13, customers: 12, revenue: 25200 },
    { time: "14:00", hour: 14, customers: 6,  revenue: 12000 },
    { time: "15:00", hour: 15, customers: 3,  revenue: 5400 },
    { time: "16:00", hour: 16, customers: 3,  revenue: 6600 },
    { time: "17:00", hour: 17, customers: 6,  revenue: 19200 },
    { time: "18:00", hour: 18, customers: 12, revenue: 45600 },
    { time: "19:00", hour: 19, customers: 12, revenue: 50400 },
    { time: "20:00", hour: 20, customers: 8,  revenue: 35200 },
    { time: "21:00", hour: 21, customers: 5,  revenue: 18000 },
    { time: "22:00", hour: 22, customers: 2,  revenue: 6000 },
  ]
  const fridayBase = [
    { time: "11:00", hour: 11, customers: 12, revenue: 26400 },
    { time: "12:00", hour: 12, customers: 25, revenue: 47500 },
    { time: "13:00", hour: 13, customers: 15, revenue: 31500 },
    { time: "14:00", hour: 14, customers: 8,  revenue: 16000 },
    { time: "15:00", hour: 15, customers: 5,  revenue: 9000 },
    { time: "16:00", hour: 16, customers: 5,  revenue: 11000 },
    { time: "17:00", hour: 17, customers: 15, revenue: 48000 },
    { time: "18:00", hour: 18, customers: 28, revenue: 106400 },
    { time: "19:00", hour: 19, customers: 28, revenue: 117600 },
    { time: "20:00", hour: 20, customers: 16, revenue: 70400 },
    { time: "21:00", hour: 21, customers: 8,  revenue: 28800 },
    { time: "22:00", hour: 22, customers: 5,  revenue: 15000 },
  ]
  const weekendBase = [
    { time: "11:00", hour: 11, customers: 18, revenue: 39600 },
    { time: "12:00", hour: 12, customers: 35, revenue: 66500 },
    { time: "13:00", hour: 13, customers: 32, revenue: 67200 },
    { time: "14:00", hour: 14, customers: 22, revenue: 44000 },
    { time: "15:00", hour: 15, customers: 15, revenue: 27000 },
    { time: "16:00", hour: 16, customers: 12, revenue: 26400 },
    { time: "17:00", hour: 17, customers: 20, revenue: 64000 },
    { time: "18:00", hour: 18, customers: 30, revenue: 114000 },
    { time: "19:00", hour: 19, customers: 30, revenue: 126000 },
    { time: "20:00", hour: 20, customers: 22, revenue: 96800 },
    { time: "21:00", hour: 21, customers: 12, revenue: 43200 },
    { time: "22:00", hour: 22, customers: 7,  revenue: 21000 },
  ]

  const base = isWeekend ? weekendBase : isFriday ? fridayBase : weekdayBase

  return base.map((item) => {
    const variation = 1 + (seededRandom(`${seed}-${item.time}`) - 0.5) * 0.2
    const predicted = Math.round(item.customers * variation)
    const predictedRev = Math.round(item.revenue * variation)
    // 現在時刻より前の時間帯は実績データを生成
    const hasPassed = item.hour < currentHour
    const actualVariation = 0.9 + seededRandom(`${seed}-actual-${item.time}`) * 0.2
    return {
      time: item.time,
      customers: predicted,
      revenue: predictedRev,
      実績客数: hasPassed ? Math.round(predicted * actualVariation) : undefined,
      実績売上: hasPassed ? Math.round(predictedRev * actualVariation) : undefined,
    }
  })
}

export default function DemandForecastDashboard() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isUpdating, setIsUpdating] = useState(false)
  const { showToast } = useToast()

  const dateStr = format(currentDate, "yyyy-MM-dd")
  const demandData = useMemo(() => generateDemandData(currentDate), [dateStr])
  const hourlyData = useMemo(() => generateHourlyData(dateStr, currentDate.getDay()), [dateStr])

  const todayData = demandData[demandData.length - 1]
  const yesterdayData = demandData[demandData.length - 2]
  const dayChange = yesterdayData ? Math.round((todayData.revenue / yesterdayData.revenue - 1) * 100) : 0

  const totalCustomers = hourlyData.reduce((s, h) => s + h.customers, 0)
  const peakHour = hourlyData.reduce((max, h) => (h.customers > max.customers ? h : max), hourlyData[0])

  // 実績集計
  const actualTotalCustomers = hourlyData.reduce((s, h) => s + (h.実績客数 || 0), 0)
  const actualTotalRevenue = hourlyData.reduce((s, h) => s + (h.実績売上 || 0), 0)
  const hoursWithActual = hourlyData.filter((h) => h.実績客数 !== undefined).length
  const revenueAccuracy = todayData.actualRevenue && todayData.revenue
    ? Math.round((todayData.actualRevenue / (todayData.revenue * (hoursWithActual / hourlyData.length)) - 1) * 100)
    : 0

  const handleUpdateForecast = () => {
    setIsUpdating(true)
    setTimeout(() => {
      setIsUpdating(false)
      showToast("予測データを更新しました")
    }, 1500)
  }

  const dayOfWeek = currentDate.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // AI insights based on current date
  const insights = useMemo(() => {
    const base = [
      { text: "先週と比較して客数が12%増加傾向にあります", type: "up" as const },
      { text: isWeekend ? "週末のため通常より30%多い来客が予想されます" : "平日パターンに基づく標準的な需要予測です", type: "info" as const },
      { text: "ディナータイム(18-20時)が特に混雑が予想されます", type: "warning" as const },
    ]
    return base
  }, [dateStr])

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">需要予測ダッシュボード</h1>
              <p className="text-sm text-gray-600 mt-1">本日の売上・客数予測とスタッフ配置提案</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => subDays(d, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium min-w-[120px] text-center">
                  {format(currentDate, "yyyy年M月d日 (E)", { locale: ja })}
                </span>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => addDays(d, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button size="sm" variant="outline" onClick={handleUpdateForecast} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                予測を更新
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">

        {/* 本日の重要指標 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100">
            <p className="text-sm font-medium text-gray-600">予測売上</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">¥{todayData.revenue.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">実績（現時点）</p>
                <p className="text-sm font-bold text-green-600">¥{actualTotalRevenue.toLocaleString()}</p>
              </div>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${revenueAccuracy >= 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {revenueAccuracy >= 0 ? "+" : ""}{revenueAccuracy}%
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100">
            <p className="text-sm font-medium text-gray-600">予測客数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCustomers}人</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">実績（現時点）</p>
                <p className="text-sm font-bold text-blue-600">{actualTotalCustomers}人</p>
              </div>
              <span className="text-xs text-gray-500">ピーク: {peakHour.time}</span>
            </div>
          </div>
          <StatCard
            label="昨日の実績売上"
            value={yesterdayData?.actualRevenue ? `¥${yesterdayData.actualRevenue.toLocaleString()}` : "-"}
            subtext={yesterdayData ? `予測比 ${yesterdayData.actualRevenue && yesterdayData.revenue ? (Math.round((yesterdayData.actualRevenue / yesterdayData.revenue - 1) * 100) >= 0 ? "+" : "") + Math.round((yesterdayData.actualRevenue / yesterdayData.revenue - 1) * 100) + "%" : ""}` : undefined}
            subtextColor={yesterdayData?.actualRevenue && yesterdayData?.revenue && yesterdayData.actualRevenue >= yesterdayData.revenue ? "text-green-600" : "text-amber-600"}
          />
          <StatCard
            label="昨日の実績客数"
            value={yesterdayData?.actualCustomers ? `${yesterdayData.actualCustomers}人` : "-"}
            subtext={yesterdayData ? `予測比 ${yesterdayData.actualCustomers && yesterdayData.customers ? (Math.round((yesterdayData.actualCustomers / yesterdayData.customers - 1) * 100) >= 0 ? "+" : "") + Math.round((yesterdayData.actualCustomers / yesterdayData.customers - 1) * 100) + "%" : ""}` : undefined}
            subtextColor={yesterdayData?.actualCustomers && yesterdayData?.customers && yesterdayData.actualCustomers >= yesterdayData.customers ? "text-green-600" : "text-amber-600"}
          />
        </div>

        {/* AIインサイト */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AIインサイト
          </h3>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">&#8226;</span>
                <p className="text-sm text-blue-900">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* リアルタイム状況と追加情報 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">リアルタイム状況</h3>
            <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">売上実績（現時点）</span>
              <span className="font-bold text-green-600">¥{actualTotalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">客数実績（現時点）</span>
              <span className="font-bold text-blue-600">{actualTotalCustomers}人</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">予測との差異</span>
              <span className={`font-bold flex items-center ${revenueAccuracy >= 0 ? "text-green-600" : "text-amber-600"}`}>
                {revenueAccuracy >= 0 && <ArrowUp className="w-3 h-3 mr-1" />}
                {revenueAccuracy >= 0 ? "+" : ""}{revenueAccuracy}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">平均客単価</span>
              <span className="font-bold">¥{actualTotalCustomers > 0 ? Math.round(actualTotalRevenue / actualTotalCustomers).toLocaleString() : "-"}</span>
            </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">天気・イベント情報</h3>
            <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Sun className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">晴れ 24°C</p>
                <p className="text-xs text-gray-600">降水確率: 10%</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">近隣イベント</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>&#8226; 横浜ベイクォーター フリーマーケット (10:00-16:00)</p>
                <p>&#8226; 商店街セール開催中</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">交通情報</p>
              <p className="text-xs text-green-600">JR横浜線: 正常運行</p>
            </div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">クイックアクション</h3>
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-16 flex flex-col gap-1" onClick={() => showToast("緊急スタッフ呼び出しを送信しました")}>
                <Phone className="w-5 h-5" />
                <span className="text-xs">緊急スタッフ呼び出し</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1" onClick={() => showToast("予約受付を一時停止しました", "info")}>
                <AlertCircle className="w-5 h-5" />
                <span className="text-xs">予約受付停止</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1" onClick={() => showToast("スタッフ配置変更画面に移動します", "info")}>
                <Users className="w-5 h-5" />
                <span className="text-xs">スタッフ配置変更</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 時間別予測グラフ */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">本日の時間別推移</h3>
          <p className="text-sm text-gray-600 mb-4">予測と実績の比較（実線: 予測 / 点線: 実績）</p>
          <div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="customers" stroke="#2563eb" strokeWidth={2} name="予測客数" />
                  <Line yAxisId="left" type="monotone" dataKey="実績客数" stroke="#2563eb" strokeWidth={2} strokeDasharray="5 5" name="実績客数" dot={{ fill: "#2563eb" }} connectNulls={false} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} name="予測売上" />
                  <Line yAxisId="right" type="monotone" dataKey="実績売上" stroke="#16a34a" strokeWidth={2} strokeDasharray="5 5" name="実績売上" dot={{ fill: "#16a34a" }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 今日のスタッフ配置とアクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">推奨スタッフ配置</h3>
            <p className="text-sm text-gray-600 mb-4">時間帯別の最適な人員配置</p>
            <div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">ランチタイム (11:00-15:00)</p>
                    <p className="text-sm text-blue-700">ホール: {isWeekend ? "4人" : "3人"} / キッチン: {isWeekend ? "3人" : "2人"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600">予測客数</p>
                    <p className="font-bold text-blue-900">{hourlyData.filter(h => [11,12,13,14].includes(parseInt(h.time))).reduce((s, h) => s + h.customers, 0)}人</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900">ディナータイム (17:00-22:00)</p>
                    <p className="text-sm text-green-700">ホール: {isWeekend ? "4人" : "3人"} / キッチン: {isWeekend ? "3人" : "2人"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">予測客数</p>
                    <p className="font-bold text-green-900">{hourlyData.filter(h => [17,18,19,20,21,22].includes(parseInt(h.time))).reduce((s, h) => s + h.customers, 0)}人</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">アイドルタイム (15:00-17:00)</p>
                    <p className="text-sm text-gray-700">ホール: 2人 / キッチン: 2人</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">予測客数</p>
                    <p className="font-bold text-gray-900">{hourlyData.filter(h => [15,16].includes(parseInt(h.time))).reduce((s, h) => s + h.customers, 0)}人</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">今日の注意事項</h3>
            <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <Sun className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">天候による影響</p>
                <p className="text-xs text-yellow-700">晴天のため、テラス席の利用増加が予想されます</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">ピークタイム対応</p>
                <p className="text-xs text-blue-700">12-14時は通常より30%多い客数が予想されます</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-800">週末準備</p>
                <p className="text-xs text-purple-700">週末に向けて予約状況を確認してください</p>
              </div>
            </div>

            <div className="mt-4">
              <Button className="w-full" variant="outline">
                <Link href="/demand-forecast/details" className="flex items-center">
                  詳細な予測データを表示
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
