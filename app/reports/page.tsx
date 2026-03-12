"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Clock, DollarSign, BarChart2, PieChart, Download, Calendar, Loader2 } from "lucide-react"
import { format, subDays } from "date-fns"
import { ja } from "date-fns/locale"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { StatCard } from "@/components/stat-card"
import { useStoreContext } from "@/lib/hooks/use-store-context"
import { useActualSales } from "@/lib/hooks/use-actual-sales"
import { useDemandForecasts } from "@/lib/hooks/use-demand-forecast"
import { useToast } from "@/components/toast"

export default function ReportsPage() {
  const { selectedStore } = useStoreContext()
  const { showToast } = useToast()
  const today = new Date()
  const startDate = format(subDays(today, 30), "yyyy-MM-dd")
  const endDate = format(today, "yyyy-MM-dd")
  const periodStart = format(subDays(today, 30), "M月d日", { locale: ja })
  const periodEnd = format(today, "M月d日", { locale: ja })

  const storeId = selectedStore?.id ?? ""

  const { sales, loading: salesLoading } = useActualSales(storeId, startDate, endDate)
  const { forecasts, loading: forecastsLoading } = useDemandForecasts(storeId, startDate, endDate)

  const loading = salesLoading || forecastsLoading
  const hasData = sales.length > 0

  // --- KPI calculations ---
  const kpis = useMemo(() => {
    if (!hasData) {
      return { totalSales: 0, totalCustomers: 0, avgSpend: 0, forecastAccuracy: 0 }
    }

    const totalSales = sales.reduce((sum, s) => sum + (s.sales ?? 0), 0)
    const totalCustomers = sales.reduce((sum, s) => sum + (s.customers ?? 0), 0)
    const avgSpend = totalCustomers > 0 ? Math.round(totalSales / totalCustomers) : 0

    // Forecast accuracy: compare forecast_customers vs actual customers by date
    let forecastAccuracy = 0
    if (forecasts.length > 0) {
      const actualByDate: Record<string, number> = {}
      for (const s of sales) {
        if (s.date) {
          actualByDate[s.date] = (actualByDate[s.date] ?? 0) + (s.customers ?? 0)
        }
      }

      let matchedDays = 0
      let totalError = 0
      for (const f of forecasts) {
        const actual = actualByDate[f.date]
        if (actual != null && actual > 0 && f.forecast_customers != null && f.forecast_customers > 0) {
          const error = Math.abs(f.forecast_customers - actual) / actual
          totalError += error
          matchedDays++
        }
      }
      if (matchedDays > 0) {
        forecastAccuracy = Math.round((1 - totalError / matchedDays) * 1000) / 10
      }
    }

    return { totalSales, totalCustomers, avgSpend, forecastAccuracy }
  }, [sales, forecasts, hasData])

  // --- Chart data: daily sales ---
  const salesChartData = useMemo(() => {
    if (!hasData) return []
    const dailyMap: Record<string, number> = {}
    for (const s of sales) {
      if (s.date) {
        dailyMap[s.date] = (dailyMap[s.date] ?? 0) + (s.sales ?? 0)
      }
    }
    return Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        d: format(new Date(date), "M/d"),
        v: Math.round(value / 1000),
      }))
  }, [sales, hasData])

  // --- Chart data: forecast accuracy comparison ---
  const accuracyChartData = useMemo(() => {
    if (forecasts.length === 0 || sales.length === 0) return []
    const actualByDate: Record<string, number> = {}
    for (const s of sales) {
      if (s.date) {
        actualByDate[s.date] = (actualByDate[s.date] ?? 0) + (s.customers ?? 0)
      }
    }
    return forecasts
      .filter((f) => actualByDate[f.date] != null && actualByDate[f.date] > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((f) => ({
        d: format(new Date(f.date), "M/d"),
        forecast: f.forecast_customers ?? 0,
        actual: actualByDate[f.date],
      }))
  }, [sales, forecasts])

  // --- Sales summary stats ---
  const salesSummary = useMemo(() => {
    if (!hasData) return { avgDaily: 0, peakDay: "-", avgSpend: 0 }
    const dailyMap: Record<string, number> = {}
    for (const s of sales) {
      if (s.date) {
        dailyMap[s.date] = (dailyMap[s.date] ?? 0) + (s.sales ?? 0)
      }
    }
    const dailyValues = Object.entries(dailyMap)
    const avgDaily = dailyValues.length > 0
      ? Math.round(dailyValues.reduce((sum, [, v]) => sum + v, 0) / dailyValues.length)
      : 0

    // Find peak day of week
    const dowTotals: Record<string, { sum: number; count: number }> = {}
    for (const [date, val] of dailyValues) {
      const dow = format(new Date(date), "EEEE", { locale: ja })
      if (!dowTotals[dow]) dowTotals[dow] = { sum: 0, count: 0 }
      dowTotals[dow].sum += val
      dowTotals[dow].count++
    }
    let peakDay = "-"
    let peakAvg = 0
    for (const [dow, { sum, count }] of Object.entries(dowTotals)) {
      const avg = sum / count
      if (avg > peakAvg) {
        peakAvg = avg
        peakDay = dow
      }
    }

    return { avgDaily, peakDay, avgSpend: kpis.avgSpend }
  }, [sales, hasData, kpis.avgSpend])

  const formatYen = (n: number) => {
    if (n >= 10000) {
      return `¥${(n / 10000).toFixed(n >= 100000000 ? 0 : 1)}万`
    }
    return `¥${n.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b">
          <div className="p-6">
            <h1 className="text-xl font-semibold text-gray-800">レポート</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <BarChart2 className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium text-gray-600">レポートを表示するには、売上実績データの登録が必要です</p>
          <p className="text-xs mt-2 text-gray-400">「売上実績」ページからCSVインポートまたは手動入力で登録できます</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">レポート</h1>
              <p className="text-sm text-gray-600 mt-1">
                {periodStart} 〜 {periodEnd} のパフォーマンスレポート
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => showToast("準備中です", "info")}>
                <Calendar className="h-4 w-4 mr-1" />
                期間変更
              </Button>
              <Button variant="outline" size="sm" onClick={() => showToast("準備中です", "info")}>
                <Download className="h-4 w-4 mr-1" />
                PDFエクスポート
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI サマリー */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            iconColor="text-green-600"
            label="月間売上"
            value={formatYen(kpis.totalSales)}
          />
          <StatCard
            icon={Users}
            iconColor="text-blue-600"
            label="月間来客数"
            value={`${kpis.totalCustomers.toLocaleString()}人`}
          />
          <StatCard
            icon={TrendingUp}
            iconColor="text-purple-600"
            label="予測精度"
            value={kpis.forecastAccuracy > 0 ? `${kpis.forecastAccuracy}%` : "-"}
            subtext={kpis.forecastAccuracy > 0 ? undefined : "予測データなし"}
            subtextColor="text-gray-400"
          />
          <StatCard
            icon={Clock}
            iconColor="text-amber-600"
            label="平均客単価"
            value={kpis.avgSpend > 0 ? formatYen(kpis.avgSpend) : "-"}
          />
        </div>

        {/* レポートカード一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 売上分析 */}
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-blue-600" />
                  売上分析レポート
                </CardTitle>
                <Badge variant="secondary">月次</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">日別売上推移</span>
                  <span className="font-medium">平均 {formatYen(salesSummary.avgDaily)}/日</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ピーク曜日</span>
                  <span className="font-medium">{salesSummary.peakDay}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">客単価</span>
                  <span className="font-medium">{formatYen(salesSummary.avgSpend)}</span>
                </div>
                <div className="h-24 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesChartData}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip formatter={(v: number) => [`¥${v}K`, "売上"]} />
                      <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="url(#salesGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 人件費分析 - 準備中 */}
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  人件費分析レポート
                </CardTitle>
                <Badge variant="secondary">月次</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Clock className="h-8 w-8 mb-2" />
                <p className="text-sm">データ準備中</p>
                <p className="text-xs mt-1">今後のアップデートで対応予定です</p>
              </div>
            </CardContent>
          </Card>

          {/* 予測精度 */}
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  需要予測精度レポート
                </CardTitle>
                <Badge variant="secondary">期間内</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {accuracyChartData.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">客数予測精度</span>
                    <span className="font-medium">
                      {kpis.forecastAccuracy > 0 ? `${kpis.forecastAccuracy}%` : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">比較日数</span>
                    <span className="font-medium">{accuracyChartData.length}日</span>
                  </div>
                  <div className="h-24 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={accuracyChartData}>
                        <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                          formatter={(v: number, name: string) => [
                            `${v}人`,
                            name === "forecast" ? "予測" : "実績",
                          ]}
                        />
                        <Bar dataKey="actual" fill="#3b82f6" radius={[2, 2, 0, 0]} name="actual" />
                        <Bar dataKey="forecast" fill="#a855f7" radius={[2, 2, 0, 0]} name="forecast" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Clock className="h-8 w-8 mb-2" />
                  <p className="text-sm">データ準備中</p>
                  <p className="text-xs mt-1">予測データが登録されると表示されます</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* シフト最適化 - 準備中 */}
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  シフト最適化レポート
                </CardTitle>
                <Badge variant="secondary">週次</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Clock className="h-8 w-8 mb-2" />
                <p className="text-sm">データ準備中</p>
                <p className="text-xs mt-1">今後のアップデートで対応予定です</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
