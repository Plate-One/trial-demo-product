"use client"

import Link from "next/link"
import { useStoreContext } from "@/lib/hooks/use-store-context"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  TrendingUp,
  CalendarDays,
  CalendarPlus,
  Users,
  BarChart3,
  Settings,
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
]

export default function DashboardPage() {
  const { selectedStore, loading } = useStoreContext()

  const storeName = loading
    ? "読み込み中..."
    : selectedStore?.name ?? "店舗未選択"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-500">
          {storeName}のシフト管理システムへようこそ
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
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
    </div>
  )
}
