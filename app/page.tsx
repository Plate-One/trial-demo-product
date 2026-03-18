"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useStoreContext } from "@/lib/hooks/use-store-context"
import { useStaff } from "@/lib/hooks/use-staff"
import { useActualSales } from "@/lib/hooks/use-actual-sales"
import { useDemandForecasts } from "@/lib/hooks/use-demand-forecast"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast"
import { format, subDays } from "date-fns"
import {
  TrendingUp,
  CalendarDays,
  CalendarPlus,
  Users,
  BarChart3,
  Settings,
  Rocket,
  CheckCircle2,
  Circle,
  ArrowRight,
  Loader2,
  Sparkles,
  Database,
  Smartphone,
} from "lucide-react"

const navItems = [
  {
    href: "/demand-forecast",
    title: "需要予測",
    description: "AIによる来客数・売上の需要予測を確認し、最適な人員配置の計画に活用します。",
    icon: TrendingUp,
  },
  {
    href: "/shifts",
    title: "シフト管理",
    description: "作成済みのシフトを一覧・確認し、日別・月別でスタッフの勤務状況を把握します。",
    icon: CalendarDays,
  },
  {
    href: "/shifts/create",
    title: "シフト作成",
    description: "需要予測とスタッフの希望をもとに、新しいシフトを作成します。",
    icon: CalendarPlus,
  },
  {
    href: "/staff",
    title: "スタッフ管理",
    description: "スタッフの情報・スキル・勤務可能時間の登録・編集を行います。",
    icon: Users,
  },
  {
    href: "/reports",
    title: "レポート",
    description: "人件費や稼働率などの実績データをレポート形式で確認します。",
    icon: BarChart3,
  },
  {
    href: "/settings",
    title: "設定",
    description: "店舗情報やシステムの各種設定を管理します。",
    icon: Settings,
  },
  {
    href: "/mypage",
    title: "スタッフ用マイページ",
    description: "スタッフ向けのモバイル画面。シフト確認・希望提出・欠勤連絡ができます。",
    icon: Smartphone,
  },
]

interface SetupStatus {
  hasStaff: boolean
  hasSales: boolean
  hasForecasts: boolean
  loading: boolean
}

function useSetupStatus(storeId: string): SetupStatus {
  const today = new Date()
  const startDate = format(subDays(today, 30), "yyyy-MM-dd")
  const endDate = format(today, "yyyy-MM-dd")
  const { staff, loading: staffLoading } = useStaff(storeId)
  const { sales, loading: salesLoading } = useActualSales(storeId, startDate, endDate)
  const { forecasts, loading: forecastsLoading } = useDemandForecasts(storeId, startDate, endDate)

  return {
    hasStaff: staff.length > 0,
    hasSales: sales.length > 0,
    hasForecasts: forecasts.length > 0,
    loading: staffLoading || salesLoading || forecastsLoading,
  }
}

function SetupGuide({ storeId, status, onDemoGenerated }: {
  storeId: string
  status: SetupStatus
  onDemoGenerated: () => void
}) {
  const [generating, setGenerating] = useState(false)
  const { showToast } = useToast()

  const steps = [
    {
      done: status.hasStaff,
      label: "スタッフを登録する",
      description: "シフトを作成するにはスタッフの登録が必要です",
      href: "/staff",
    },
    {
      done: status.hasSales,
      label: "売上実績データを取込む",
      description: "AI需要予測の精度向上のため、過去データを投入します",
      href: "/settings",
    },
    {
      done: status.hasForecasts,
      label: "需要予測を実行する",
      description: "AIが来客数・売上を予測し、最適な人員配置を提案します",
      href: "/demand-forecast",
    },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const allDone = completedCount === steps.length

  const handleGenerateDemo = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/demo-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`デモデータを生成しました（売上${data.generated.actual_sales}件、予測${data.generated.forecasts}件）`, "success")
      onDemoGenerated()
    } catch (e: any) {
      showToast(`デモデータの生成に失敗しました: ${e.message}`, "error")
    } finally {
      setGenerating(false)
    }
  }

  if (allDone) return null

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">はじめてのセットアップ</CardTitle>
              <CardDescription className="mt-0.5">
                {completedCount}/{steps.length} ステップ完了 — 以下の手順で全機能をお試しいただけます
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {steps.map((step, i) => (
            <Link key={i} href={step.href} className="block">
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                step.done
                  ? "bg-green-50 dark:bg-green-950/30"
                  : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}>
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${step.done ? "text-green-700 dark:text-green-400 line-through" : "text-gray-900 dark:text-gray-100"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                </div>
                {!step.done && <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
              </div>
            </Link>
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-blue-200 dark:border-blue-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 px-3 text-blue-600 dark:text-blue-400 font-medium">
              または
            </span>
          </div>
        </div>

        <Button
          onClick={handleGenerateDemo}
          disabled={generating}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              デモデータを生成中...（数秒かかります）
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              ワンクリックでデモデータを生成して体験する
            </>
          )}
        </Button>
        <p className="text-xs text-center text-blue-600/70 dark:text-blue-400/70">
          90日分の売上実績・AI需要予測・確定済みシフトが自動生成されます
        </p>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { selectedStore, loading: storeLoading } = useStoreContext()
  const storeId = selectedStore?.id ?? ""
  const status = useSetupStatus(storeId)
  const [refreshKey, setRefreshKey] = useState(0)

  const storeName = storeLoading
    ? "読み込み中..."
    : selectedStore?.name ?? "店舗未選択"

  const handleDemoGenerated = useCallback(() => {
    // ページをリロードしてデータを再取得
    window.location.reload()
  }, [])

  const showSetup = !status.loading && (!status.hasStaff || !status.hasSales || !status.hasForecasts)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {storeName}のシフト管理システムへようこそ
        </p>
      </div>

      {/* ナビカードを先に表示（ブロックしない） */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
                <CardDescription className="mt-2">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* セットアップガイドは後から表示 */}
      {showSetup && (
        <SetupGuide storeId={storeId} status={status} onDemoGenerated={handleDemoGenerated} />
      )}
    </div>
  )
}
