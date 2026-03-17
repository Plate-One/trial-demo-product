"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Sun, Cloud, CloudRain, Calendar, ChevronDown, ChevronRight, Download, RefreshCw, Loader2 } from "lucide-react"
import { format, addDays, subDays, startOfWeek, endOfWeek } from "date-fns"
import { ja } from "date-fns/locale"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"

import { useToast } from "@/components/toast"
import { StatCard } from "@/components/stat-card"
import { useStoreContext } from "@/lib/hooks/use-store-context"
import { useDemandForecasts, useForecastGeneration } from "@/lib/hooks/use-demand-forecast"
import { useActualSales } from "@/lib/hooks/use-actual-sales"

const WeatherIcon = ({ type, size = "h-6 w-6" }: { type: string; size?: string }) => {
  switch (type) {
    case "sunny":
      return <Sun className={`${size} text-yellow-500`} />
    case "cloudy":
      return <Cloud className={`${size} text-gray-500`} />
    case "rainy":
      return <CloudRain className={`${size} text-blue-500`} />
    default:
      return <Sun className={`${size} text-yellow-500`} />
  }
}

// 営業時間帯のラベル生成
const DEFAULT_HOURS = Array.from({ length: 12 }, (_, i) => i + 11)

function getHourlyBreakdown(
  totalCustomers: number,
  totalSales: number,
  actualCustomers: number | null,
  actualRevenue: number | null,
  hourlyData?: Record<string, any> | null
) {
  // DB hourly_dataがあれば実データから按分
  if (hourlyData) {
    const hours = Object.keys(hourlyData).map(Number).sort((a, b) => a - b)
    const totalFcCust = hours.reduce((s, h) => s + (hourlyData[h]?.forecast_customers ?? 0), 0)
    const maxCust = Math.max(...hours.map(h => hourlyData[h]?.forecast_customers ?? 0), 1)
    return hours.map(h => {
      const hd = hourlyData[h] ?? hourlyData[String(h)]
      const fcCust = hd?.forecast_customers ?? 0
      const fcSales = hd?.forecast_sales ?? 0
      const ratio = totalFcCust > 0 ? fcCust / totalFcCust : 0
      const barPercent = Math.round((fcCust / maxCust) * 100)
      const isPeak = ratio >= 0.12
      const isMidPeak = ratio >= 0.08 && ratio < 0.12
      const actCust = actualCustomers !== null ? Math.round(actualCustomers * ratio) : null
      const actSales = actualRevenue !== null ? Math.round(actualRevenue * ratio) : null
      return { hour: `${h}:00`, label: `${h}-${h + 1}時`, customers: fcCust, sales: fcSales, barPercent, isPeak, isMidPeak, actCust, actSales }
    })
  }

  // データがなければ均等按分
  const count = DEFAULT_HOURS.length
  return DEFAULT_HOURS.map(h => {
    const customers = count > 0 ? Math.round(totalCustomers / count) : 0
    const sales = count > 0 ? Math.round(totalSales / count) : 0
    const actCust = actualCustomers !== null && count > 0 ? Math.round(actualCustomers / count) : null
    const actSales = actualRevenue !== null && count > 0 ? Math.round(actualRevenue / count) : null
    return { hour: `${h}:00`, label: `${h}-${h + 1}時`, customers, sales, barPercent: count > 0 ? Math.round(100 / count) : 0, isPeak: false, isMidPeak: false, actCust, actSales }
  })
}

export default function DemandForecastPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily")
  const [expandedDayIndex, setExpandedDayIndex] = useState<Set<number>>(new Set())
  const [isUpdating, setIsUpdating] = useState(false)
  const { showToast } = useToast()
  const { selectedStore } = useStoreContext()
  const storeId = selectedStore?.id || ""

  // DB data: 30日分の予測 + 実績
  const startDate = format(new Date(), "yyyy-MM-dd")
  const endDate = format(addDays(new Date(), 29), "yyyy-MM-dd")
  const { forecasts, refetch: refetchForecasts } = useDemandForecasts(storeId, startDate, endDate)
  const { sales: actualSalesData } = useActualSales(storeId, format(subDays(new Date(), 7), "yyyy-MM-dd"), endDate)
  const { generateForecast, generating } = useForecastGeneration()

  const toggleDayTimeSlots = (i: number) => {
    setExpandedDayIndex((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const handlePrevPeriod = () => {
    setCurrentDate((prevDate) => subDays(prevDate, viewMode === "daily" ? 1 : 7))
  }

  const handleNextPeriod = () => {
    setCurrentDate((prevDate) => addDays(prevDate, viewMode === "daily" ? 1 : 7))
  }

  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const currentWeekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  // 実績データをdate別に集計
  const actualByDate = useMemo(() => {
    const map: Record<string, { customers: number; sales: number }> = {}
    for (const row of actualSalesData) {
      const key = row.date
      if (!map[key]) map[key] = { customers: 0, sales: 0 }
      map[key].customers += row.customers
      map[key].sales += row.sales
    }
    return map
  }, [actualSalesData])

  // Generate 30 days of forecast data — DBデータのみ使用
  const forecastDays = useMemo(() => {
    const forecastMap = new Map(forecasts.map(f => [f.date, f]))
    return Array.from({ length: 30 }, (_, i) => {
      const date = addDays(new Date(), i)
      const dateStr = format(date, "yyyy-MM-dd")
      const fc = forecastMap.get(dateStr)
      const actual = actualByDate[dateStr]

      const dayCustomers = fc?.forecast_customers ?? 0
      const daySales = fc?.forecast_sales ?? 0
      const hourlyData = (fc?.hourly_data as Record<string, any> | null) ?? null

      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      // 天気情報: DB予測に含まれていればそれを使用、なければ空
      const fcWeather = fc?.weather as { icon?: string; label?: string; tempHigh?: number; tempLow?: number } | null
      const weather = fcWeather?.icon === "sun" ? "sunny" : fcWeather?.icon === "rain" ? "rainy" : fcWeather?.icon ? "cloudy" : ""
      const tempHigh = fcWeather?.tempHigh ?? null
      const tempLow = fcWeather?.tempLow ?? null
      const rainProb = weather === "rainy" ? 80 : weather === "cloudy" ? 40 : weather ? 10 : null

      return {
        date,
        dateStr: format(date, "M/d"),
        dayLabel: format(date, "E", { locale: ja }),
        isWeekend,
        weather,
        tempHigh,
        tempLow,
        rainProb,
        dayCustomers,
        daySales,
        hourlyData,
        actualCustomers: actual ? actual.customers : null,
        actualRevenue: actual ? actual.sales : null,
        events: fc?.event ? [fc.event] : [],
      }
    })
  }, [forecasts, actualByDate])

  // Summary stats
  const totalPredictedRevenue = forecastDays.reduce((s, d) => s + d.daySales, 0)
  const totalPredictedCustomers = forecastDays.reduce((s, d) => s + d.dayCustomers, 0)
  const avgUnitPrice = totalPredictedCustomers > 0 ? Math.round(totalPredictedRevenue / totalPredictedCustomers) : 0
  const pastDays = forecastDays.filter((d) => d.actualCustomers !== null)
  const accuracy = pastDays.length > 0
    ? (100 - pastDays.reduce((s, d) => s + (d.dayCustomers > 0 ? Math.abs(d.dayCustomers - (d.actualCustomers || 0)) / d.dayCustomers * 100 : 0), 0) / pastDays.length).toFixed(1)
    : "-"

  // 実績サマリー
  const totalActualRevenue = pastDays.reduce((s, d) => s + (d.actualRevenue || 0), 0)
  const totalActualCustomers = pastDays.reduce((s, d) => s + (d.actualCustomers || 0), 0)

  // Chart data for 30 days
  const chartData = useMemo(() => {
    return forecastDays.map((d) => ({
      date: d.dateStr,
      予測客数: d.dayCustomers,
      予測売上: Math.round(d.daySales / 1000),
      実績客数: d.actualCustomers ?? undefined,
      実績売上: d.actualRevenue ? Math.round(d.actualRevenue / 1000) : undefined,
    }))
  }, [forecastDays])

  // Events for event management section（将来的にDBから取得）
  const [events, setEvents] = useState<{ date: string; name: string; impact: string; type: string }[]>([])

  const handleUpdateForecast = async () => {
    if (!storeId) {
      showToast("店舗が選択されていません", "error")
      return
    }
    setIsUpdating(true)
    try {
      await generateForecast(storeId, startDate, endDate)
      await refetchForecasts()
      showToast("予測データを更新しました")
    } catch {
      showToast("予測更新に失敗しました", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCsvExport = () => {
    const header = "日付,曜日,天気,予測客数,予測売上,実績客数,実績売上\n"
    const rows = forecastDays.map((d) =>
      `${d.dateStr},${d.dayLabel},${d.weather},${d.dayCustomers},${d.daySales},${d.actualCustomers || ""},${d.actualRevenue || ""}`
    ).join("\n")
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `forecast_${format(new Date(), "yyyyMMdd")}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast("CSVファイルをダウンロードしました")
  }

  const handleDeleteEvent = (idx: number) => {
    setEvents((prev) => prev.filter((_, i) => i !== idx))
    showToast("イベントを削除しました")
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{selectedStore?.name || "店舗未選択"}</h1>
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
        {totalPredictedCustomers === 0 && (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Calendar className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-lg font-medium text-gray-600 mb-1">予測データがありません</p>
            <p className="text-sm text-gray-400 mb-1">売上実績データからAIが来客数・売上を自動予測します</p>
            <p className="text-xs text-gray-400 mb-4">売上データがない場合は、先にダッシュボードからデモデータを生成してください</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdateForecast} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                予測を生成
              </Button>
              <a href="/">
                <Button size="sm" variant="outline">ダッシュボードへ</Button>
              </a>
            </div>
          </div>
        )}
        {totalPredictedCustomers > 0 && (<>
        {/* 月間サマリー */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100">
            <p className="text-sm font-medium text-gray-600">月間予測売上</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalPredictedRevenue.toLocaleString()}円</p>
            {pastDays.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">実績（{pastDays.length}日分）</p>
                <p className="text-sm font-bold text-green-600">{totalActualRevenue.toLocaleString()}円</p>
              </div>
            )}
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100">
            <p className="text-sm font-medium text-gray-600">月間予測客数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalPredictedCustomers.toLocaleString()}人</p>
            {pastDays.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">実績（{pastDays.length}日分）</p>
                <p className="text-sm font-bold text-blue-600">{totalActualCustomers.toLocaleString()}人</p>
              </div>
            )}
          </div>
          <StatCard
            label="平均客単価"
            value={`¥${avgUnitPrice.toLocaleString()}`}
            subtext={pastDays.length > 0 && totalActualCustomers > 0
              ? `実績: ¥${Math.round(totalActualRevenue / totalActualCustomers).toLocaleString()}`
              : "前月比 +2.3%"}
            subtextColor={pastDays.length > 0 ? "text-blue-600" : undefined}
          />
          <StatCard
            label="予測精度"
            value={`${accuracy}%`}
            subtext={`過去${pastDays.length}日間の実績比較`}
          />
        </div>

        {/* 1ヶ月予測チャート */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">1ヶ月間の需要推移</h3>
          <p className="text-sm text-gray-600 mb-4">予測と実績の比較（実線: 予測 / 点線: 実績）</p>
          <div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="予測客数" stroke="#8884d8" strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="実績客数" stroke="#8884d8" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: "#8884d8" }} connectNulls={false} />
                <Line yAxisId="right" type="monotone" dataKey="予測売上" stroke="#82ca9d" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="実績売上" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: "#82ca9d" }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          </div>
        </div>

        {/* 詳細予測データ */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">詳細予測データ（1ヶ月間）</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCsvExport}>
                <Download className="h-4 w-4 mr-1" />
                CSVエクスポート
              </Button>
              <Button variant="outline" size="sm" onClick={handleUpdateForecast} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                予測を更新
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse bg-white text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">日付</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">天気</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">予測客数</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">予測売上</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">実績客数</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">実績売上</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">イベント</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {forecastDays.map((day, i) => {
                  const hourlyBreakdown = getHourlyBreakdown(day.dayCustomers, day.daySales, day.actualCustomers, day.actualRevenue, day.hourlyData)
                  const isPast = day.actualCustomers !== null

                  return (
                    <React.Fragment key={i}>
                      <tr className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${day.isWeekend ? "bg-red-50/30" : ""} ${isPast ? "text-gray-500" : ""}`}>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${day.isWeekend ? "text-red-600" : isPast ? "text-gray-500" : "text-gray-900"}`}>
                              {day.dateStr}
                            </span>
                            <span className={`text-xs ${day.isWeekend ? "text-red-500" : "text-gray-400"}`}>
                              {day.dayLabel}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {day.weather ? (
                            <div className="flex items-center justify-center gap-1">
                              <WeatherIcon type={day.weather} size="h-4 w-4" />
                              {day.tempHigh !== null && <span className="text-xs text-gray-500">{day.tempHigh}°</span>}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-medium tabular-nums ${isPast ? "text-gray-400" : "text-gray-900"}`}>
                          {day.dayCustomers}人
                        </td>
                        <td className={`px-4 py-2.5 text-right font-medium tabular-nums ${isPast ? "text-gray-400" : "text-gray-900"}`}>
                          ¥{day.daySales.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {isPast ? (
                            <span className={`font-medium ${
                              day.actualCustomers! >= day.dayCustomers ? "text-green-600" : "text-amber-600"
                            }`}>
                              {day.actualCustomers}人
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {isPast ? (
                            <span className={`font-medium ${
                              day.actualRevenue! >= day.daySales ? "text-green-600" : "text-amber-600"
                            }`}>
                              ¥{day.actualRevenue!.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {day.events.length > 0 ? (
                            <div className="flex flex-wrap justify-center gap-1">
                              {day.events.map((event, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0">
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleDayTimeSlots(i)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
                          >
                            {expandedDayIndex.has(i) ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            時間帯
                          </button>
                        </td>
                      </tr>
                      {expandedDayIndex.has(i) && (
                        <tr>
                          <td colSpan={8} className="p-0 border-b border-gray-200">
                            <div className="bg-gradient-to-b from-slate-50 to-white px-4 py-3">
                              {/* ヘッダー */}
                              <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-700">{day.dateStr} ({day.dayLabel}) 時間帯別内訳</span>
                                  <div className="flex items-center gap-3 text-[10px] text-gray-400 ml-2">
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> ピーク</span>
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-300 inline-block" /> やや多い</span>
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-300 inline-block" /> 通常</span>
                                  </div>
                                </div>
                                {isPast && (
                                  <span className="text-[10px] text-gray-400">※ 実績は日次按分による推計値</span>
                                )}
                              </div>
                              {/* テーブル */}
                              <div className="grid grid-cols-1 gap-0">
                                {hourlyBreakdown.map((row, idx) => (
                                  <div key={idx} className={`flex items-center gap-2 py-1.5 ${idx !== hourlyBreakdown.length - 1 ? "border-b border-gray-100" : ""} ${row.isPeak ? "bg-indigo-50/50 -mx-2 px-2 rounded" : ""}`}>
                                    {/* 時間ラベル */}
                                    <span className={`text-xs w-14 flex-shrink-0 tabular-nums ${row.isPeak ? "font-bold text-indigo-700" : "text-gray-500"}`}>
                                      {row.label}
                                    </span>
                                    {/* バー */}
                                    <div className="flex-1 min-w-0 max-w-[200px]">
                                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                                        <div
                                          className={`h-full rounded-full transition-all ${row.isPeak ? "bg-indigo-500" : row.isMidPeak ? "bg-indigo-300" : "bg-gray-300"}`}
                                          style={{ width: `${row.barPercent}%` }}
                                        />
                                      </div>
                                    </div>
                                    {/* 予測客数 */}
                                    <span className={`text-xs w-12 text-right tabular-nums flex-shrink-0 ${row.isPeak ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                                      {row.customers}人
                                    </span>
                                    {/* 予測売上 */}
                                    <span className={`text-xs w-20 text-right tabular-nums flex-shrink-0 ${row.isPeak ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                                      ¥{row.sales.toLocaleString()}
                                    </span>
                                    {/* 実績（過去日のみ） */}
                                    {isPast && (
                                      <>
                                        <span className="text-gray-200 flex-shrink-0">│</span>
                                        <span className={`text-xs w-12 text-right tabular-nums flex-shrink-0 font-medium ${
                                          row.actCust !== null && row.actCust >= row.customers ? "text-green-600" : "text-amber-600"
                                        }`}>
                                          {row.actCust}人
                                        </span>
                                        <span className={`text-xs w-20 text-right tabular-nums flex-shrink-0 font-medium ${
                                          row.actSales !== null && row.actSales >= row.sales ? "text-green-600" : "text-amber-600"
                                        }`}>
                                          ¥{row.actSales?.toLocaleString()}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {/* フッター集計 */}
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                                <span className="text-xs font-semibold text-gray-600 w-14 flex-shrink-0">合計</span>
                                <div className="flex-1 min-w-0 max-w-[200px]" />
                                <span className="text-xs font-bold text-gray-900 w-12 text-right tabular-nums flex-shrink-0">{day.dayCustomers}人</span>
                                <span className="text-xs font-bold text-gray-900 w-20 text-right tabular-nums flex-shrink-0">¥{day.daySales.toLocaleString()}</span>
                                {isPast && (
                                  <>
                                    <span className="text-gray-200 flex-shrink-0">│</span>
                                    <span className={`text-xs font-bold w-12 text-right tabular-nums flex-shrink-0 ${
                                      day.actualCustomers! >= day.dayCustomers ? "text-green-600" : "text-amber-600"
                                    }`}>{day.actualCustomers}人</span>
                                    <span className={`text-xs font-bold w-20 text-right tabular-nums flex-shrink-0 ${
                                      day.actualRevenue! >= day.daySales ? "text-green-600" : "text-amber-600"
                                    }`}>¥{day.actualRevenue!.toLocaleString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
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
              <Button size="sm" onClick={() => showToast("イベント追加ダイアログを開きます", "info")}>新規イベント追加</Button>
            </div>

            <div className="space-y-3">
              {events.map((event, idx) => (
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
                    <Button variant="ghost" size="sm" onClick={() => showToast(`${event.name}を編集モードにしました`, "info")}>
                      編集
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteEvent(idx)}>
                      削除
                    </Button>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">登録済みイベントはありません</p>
              )}
            </div>
          </div>
        </div>
        </>)}
      </div>
    </div>
  )
}
