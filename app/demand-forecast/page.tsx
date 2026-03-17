"use client"
import { useState, useMemo } from "react"
import { format, subDays, addDays } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Cloud, ChevronLeft, ChevronRight, ArrowRight, Sparkles, RefreshCw, Loader2, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { ArrowUp } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/toast"
import { StatCard } from "@/components/stat-card"
import { OnboardingHint } from "@/components/onboarding-hints"
import { useStoreContext } from "@/lib/hooks/use-store-context"
import { useDemandForecasts, useForecastGeneration } from "@/lib/hooks/use-demand-forecast"
import { useActualSales } from "@/lib/hooks/use-actual-sales"
import { OPERATING_HOURS, applyStoreSettings } from "@/lib/shift-create-data"

export default function DemandForecastDashboard() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { showToast } = useToast()
  const { selectedStore } = useStoreContext()
  const storeId = selectedStore?.id || ""

  // 店舗設定を反映（営業時間等）
  if (selectedStore) {
    applyStoreSettings(selectedStore)
  }

  const dateStr = format(currentDate, "yyyy-MM-dd")
  const weekStart = format(subDays(currentDate, 6), "yyyy-MM-dd")

  // DB予測データ取得
  const { forecasts, loading: forecastLoading, refetch: refetchForecasts } = useDemandForecasts(storeId, weekStart, dateStr)
  const { generateForecast, generating } = useForecastGeneration()

  // 過去実績データ取得
  const { sales: actualSalesData } = useActualSales(storeId, weekStart, dateStr)

  // 予測データを7日分に変換
  const demandData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(currentDate, 6 - i)
      const ds = format(date, "yyyy-MM-dd")
      const label = format(date, "M/d")
      const forecast = forecasts.find((f) => f.date === ds)
      const daySales = actualSalesData.filter((s) => s.date === ds)
      const actualCustomers = daySales.reduce((sum, s) => sum + s.customers, 0) || null
      const actualRevenue = daySales.reduce((sum, s) => sum + s.sales, 0) || null
      return {
        date: label,
        customers: forecast?.forecast_customers || 0,
        revenue: forecast?.forecast_sales || 0,
        actualCustomers,
        actualRevenue,
        isPast: i < 6,
        isToday: i === 6,
      }
    })
  }, [forecasts, actualSalesData, dateStr])

  // 時間帯別データ
  const hourlyData = useMemo(() => {
    const todayForecast = forecasts.find((f) => f.date === dateStr)
    const hourly = todayForecast?.hourly_data as Record<string, any> | null
    const todayActuals = actualSalesData.filter((s) => s.date === dateStr)

    return OPERATING_HOURS.map((hour) => {
      const hd = hourly?.[hour] || hourly?.[String(hour)]
      const actual = todayActuals.find((s) => s.hour === hour)
      return {
        time: `${String(hour).padStart(2, "0")}:00`,
        customers: hd?.customers || 0,
        revenue: hd?.sales || 0,
        実績客数: actual ? actual.customers : undefined,
        実績売上: actual ? actual.sales : undefined,
      }
    })
  }, [forecasts, actualSalesData, dateStr])

  const todayData = demandData[demandData.length - 1]
  const yesterdayData = demandData[demandData.length - 2]

  const totalCustomers = hourlyData.reduce((s, h) => s + h.customers, 0)
  const peakHour = hourlyData.length > 0
    ? hourlyData.reduce((max, h) => (h.customers > max.customers ? h : max), hourlyData[0])
    : { time: "-", customers: 0 }

  // 実績集計
  const actualTotalCustomers = hourlyData.reduce((s, h) => s + (h.実績客数 || 0), 0)
  const actualTotalRevenue = hourlyData.reduce((s, h) => s + (h.実績売上 || 0), 0)
  const hoursWithActual = hourlyData.filter((h) => h.実績客数 !== undefined).length
  const revenueAccuracy = todayData?.actualRevenue && todayData?.revenue && hoursWithActual > 0
    ? Math.round((todayData.actualRevenue / (todayData.revenue * (hoursWithActual / hourlyData.length)) - 1) * 100)
    : 0

  const isUpdating = generating

  const handleUpdateForecast = async () => {
    if (!storeId) return
    try {
      const endDate = format(addDays(currentDate, 14), "yyyy-MM-dd")
      await generateForecast(storeId, weekStart, endDate)
      await refetchForecasts()
      showToast("予測データを更新しました")
    } catch (e: any) {
      showToast(`予測更新に失敗: ${e.message}`, "error")
    }
  }

  const dayOfWeek = currentDate.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // AI insights based on actual data
  const insights = useMemo(() => {
    const items: { text: string; type: "up" | "info" | "warning" }[] = []

    // Compare today vs yesterday
    if (todayData && yesterdayData && yesterdayData.customers > 0) {
      const diff = Math.round(((todayData.customers - yesterdayData.customers) / yesterdayData.customers) * 100)
      if (diff > 0) items.push({ text: `昨日と比較して客数が${diff}%増加予測です`, type: "up" })
      else if (diff < 0) items.push({ text: `昨日と比較して客数が${Math.abs(diff)}%減少予測です`, type: "info" })
    }

    // Weekend/weekday info
    if (isWeekend) items.push({ text: "週末のため通常より多い来客が予想されます", type: "info" })
    else items.push({ text: "平日パターンに基づく標準的な需要予測です", type: "info" })

    // Peak hour info from actual data
    if (peakHour && peakHour.customers > 0) {
      items.push({ text: `ピークタイムは${peakHour.time}頃（予測${peakHour.customers}人）です`, type: "warning" })
    }

    // Show message when no forecast data
    if (totalCustomers === 0) {
      items.push({ text: "予測データがありません。「予測を更新」ボタンを押してください", type: "warning" })
    }

    return items
  }, [todayData, yesterdayData, isWeekend, peakHour, totalCustomers])

  return (
    <div className="space-y-3">
      <OnboardingHint
        id="demand-forecast-intro"
        message="左右の矢印で日付を切り替えて予測を確認できます。グラフ上にカーソルを合わせると詳細な数値が表示されます。"
      />
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
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

        {forecastLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">データを読み込み中...</span>
          </div>
        )}

        {totalCustomers === 0 && !forecastLoading && (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <TrendingUp className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-1">予測データがありません</p>
            <p className="text-sm text-gray-400 mb-1">売上実績データから AIが来客数・売上を自動予測します</p>
            <p className="text-xs text-gray-400 mb-4">売上データがない場合は、先にダッシュボードからデモデータを生成してください</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdateForecast} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                予測を生成
              </Button>
              <Link href="/">
                <Button size="sm" variant="outline">ダッシュボードへ</Button>
              </Link>
            </div>
          </div>
        )}

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
              <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                <Cloud className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">天気情報は現在準備中です</p>
                  <p className="text-xs text-gray-400">今後のアップデートで天気データとの連携を予定しています</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">近隣イベント</p>
                <p className="text-xs text-gray-400">イベント情報機能は今後追加予定です</p>
              </div>
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
              {(() => {
                const todayForecast = forecasts.find((f) => f.date === dateStr)
                const hd = todayForecast?.hourly_data as Record<string, any> | null
                const getMaxStaff = (hours: number[], role: "recommended_hall" | "recommended_kitchen") =>
                  hd ? Math.max(...hours.map(h => hd[h]?.[role] ?? hd[String(h)]?.[role] ?? 0), 0) : 0
                const lunchHall = getMaxStaff([11,12,13,14], "recommended_hall")
                const lunchKitchen = getMaxStaff([11,12,13,14], "recommended_kitchen")
                const dinnerHall = getMaxStaff([17,18,19,20,21,22], "recommended_hall")
                const dinnerKitchen = getMaxStaff([17,18,19,20,21,22], "recommended_kitchen")
                const idleHall = getMaxStaff([15,16], "recommended_hall")
                const idleKitchen = getMaxStaff([15,16], "recommended_kitchen")
                return (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">ランチタイム (11:00-15:00)</p>
                    <p className="text-sm text-blue-700">ホール: {lunchHall || "-"}人 / キッチン: {lunchKitchen || "-"}人</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600">予測客数</p>
                    <p className="font-bold text-blue-900">{hourlyData.filter(h => [11,12,13,14].includes(parseInt(h.time))).reduce((s, h) => s + h.customers, 0)}人</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900">ディナータイム (17:00-22:00)</p>
                    <p className="text-sm text-green-700">ホール: {dinnerHall || "-"}人 / キッチン: {dinnerKitchen || "-"}人</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">予測客数</p>
                    <p className="font-bold text-green-900">{hourlyData.filter(h => [17,18,19,20,21,22].includes(parseInt(h.time))).reduce((s, h) => s + h.customers, 0)}人</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">アイドルタイム (15:00-17:00)</p>
                    <p className="text-sm text-gray-700">ホール: {idleHall || "-"}人 / キッチン: {idleKitchen || "-"}人</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">予測客数</p>
                    <p className="font-bold text-gray-900">{hourlyData.filter(h => [15,16].includes(parseInt(h.time))).reduce((s, h) => s + h.customers, 0)}人</p>
                  </div>
                </div>
              </div>
                )
              })()}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">アクション</h3>
            <div className="space-y-3">
              <Button className="w-full" variant="outline" asChild>
                <Link href="/demand-forecast/details" className="flex items-center justify-center">
                  詳細な予測データを表示
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/shifts/create" className="flex items-center justify-center">
                  シフトを作成する
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
