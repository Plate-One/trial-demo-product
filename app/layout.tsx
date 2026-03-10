"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, HelpCircle, Clock, CalendarDays, Users, AlertTriangle, Keyboard, Info, ExternalLink, Menu, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToastProvider, useToast } from "@/components/toast"
import { Breadcrumb } from "@/components/breadcrumb"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

function HeaderActions() {
  const { showToast } = useToast()

  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      {/* 通知ベル */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="通知を表示（3件の未読）">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center" aria-hidden="true">
              3
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="end">
          <DropdownMenuLabel>通知</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-start gap-3 py-3 cursor-pointer">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">シフト提出期限が近づいています</p>
              <p className="text-xs text-gray-500 mt-0.5">来週分のシフト提出期限は明日までです</p>
              <p className="text-xs text-gray-400 mt-1">30分前</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-start gap-3 py-3 cursor-pointer">
            <Users className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">新しいヘルプリクエスト</p>
              <p className="text-xs text-gray-500 mt-0.5">横浜モアーズ店から金曜ディナー帯のヘルプ依頼</p>
              <p className="text-xs text-gray-400 mt-1">2時間前</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-start gap-3 py-3 cursor-pointer">
            <CalendarDays className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">シフトが確定されました</p>
              <p className="text-xs text-gray-500 mt-0.5">今週のシフトが店長により確定されました</p>
              <p className="text-xs text-gray-400 mt-1">昨日</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-center text-sm text-blue-600 cursor-pointer justify-center">
            すべての通知を見る
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ヘルプアイコン */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="ヘルプメニュー" className="hidden sm:flex">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end">
          <DropdownMenuLabel>ヘルプ</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <Keyboard className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">キーボードショートカット</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <Info className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">操作ガイド</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">お問い合わせ</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <p className="text-xs text-gray-400">バージョン 1.0.0</p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ユーザーメニュー */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="ユーザーメニュー（佐藤 一郎）">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/01.png" alt="佐藤 一郎" />
              <AvatarFallback>佐</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">佐藤 一郎</p>
              <p className="text-xs leading-none text-muted-foreground">i.sato@kirincity.co.jp</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href="/staff/1">
              <DropdownMenuItem className="cursor-pointer">
                プロフィール
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer">
                設定
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => showToast("ログアウトしました", "info")}
          >
            ログアウト
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function MobileOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="ナビゲーションメニュー">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-xl animate-in slide-in-from-left duration-200">
        <div className="flex justify-end p-2">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="メニューを閉じる">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Sidebar />
      </div>
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <ToastProvider>
          <div className="flex h-screen">
            {/* デスクトップサイドバー */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>

            {/* モバイルオーバーレイ */}
            <MobileOverlay open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            <div className="flex flex-1 flex-col overflow-hidden">
              <header className="relative z-40 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800/50" role="banner">
                <div className="flex items-center justify-between p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    {/* モバイルハンバーガー */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => setMobileMenuOpen(true)}
                      aria-label="メニューを開く"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                    <Select defaultValue="bayquarter">
                      <SelectTrigger className="w-[180px] sm:w-[280px]" aria-label="店舗を選択">
                        <SelectValue placeholder="店舗を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bayquarter">キリンシティプラス横浜ベイクォーター店</SelectItem>
                        <SelectItem value="mores">キリンシティ 横浜モアーズ店</SelectItem>
                        <SelectItem value="fti">キリンシティ FOOD＆TIME ISETAN YOKOHAMA店</SelectItem>
                        <SelectItem value="cial">キリンシティ CIAL桜木町店</SelectItem>
                        <SelectItem value="machida">キリンシティ 町田店</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <HeaderActions />
                  </div>
                </div>
              </header>
              <Breadcrumb />
              <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950 p-3 sm:p-4" role="main">{children}</main>
            </div>
          </div>
        </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
