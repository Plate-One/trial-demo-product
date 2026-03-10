"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

const ROUTE_LABELS: Record<string, string> = {
  "demand-forecast": "需要予測",
  details: "詳細",
  shifts: "シフト",
  create: "シフト作成",
  help: "ヘルプ最適化",
  reports: "レポート",
  staff: "スタッフ管理",
  settings: "設定",
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) return null

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    // Skip numeric IDs (staff/[id]) — show as "詳細"
    const label = /^\d+$/.test(seg) ? "詳細" : ROUTE_LABELS[seg] || seg
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav aria-label="パンくずリスト" className="flex items-center gap-1 text-sm text-gray-500 px-4 pt-3 pb-1">
      <Link
        href="/demand-forecast"
        className="flex items-center gap-1 hover:text-gray-700 transition-colors"
        aria-label="ホーム"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-gray-400" />
          {crumb.isLast ? (
            <span className="text-gray-800 font-medium" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link href={crumb.href} className="hover:text-gray-700 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
