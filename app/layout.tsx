"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Bell, HelpCircle, Clock, CalendarDays, Users, AlertTriangle, Keyboard, Info, ExternalLink } from "lucide-react"
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
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

const inter = Inter({ subsets: ["latin"] })

function HeaderActions() {
  const { showToast } = useToast()

  return (
    <div className="flex items-center space-x-4">
      {/* 通知ベル */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="end">
          <DropdownMenuLabel>通知</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-start gap-3 py-3 cursor-pointer">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">シフト提出期限が近づいています</p>
              <p className="text-xs text-gray-500 mt-0.5">来週分のシフト提出期限は明日までです</p>
              <p className="text-xs text-gray-400 mt-1">30分前</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-start gap-3 py-3 cursor-pointer">
            <Users className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">新しいヘルプリクエスト</p>
              <p className="text-xs text-gray-500 mt-0.5">横浜モアーズ店から金曜ディナー帯のヘルプ依頼</p>
              <p className="text-xs text-gray-400 mt-1">2時間前</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-start gap-3 py-3 cursor-pointer">
            <CalendarDays className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
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
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end">
          <DropdownMenuLabel>ヘルプ</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <Keyboard className="h-4 w-4" />
            <span className="text-sm">キーボードショートカット</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <Info className="h-4 w-4" />
            <span className="text-sm">操作ガイド</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <ExternalLink className="h-4 w-4" />
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
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ToastProvider>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <header className="relative z-40 bg-white shadow-sm">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <Select defaultValue="bayquarter">
                      <SelectTrigger className="w-[280px]">
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
                  <HeaderActions />
                </div>
              </header>
              <main className="flex-1 overflow-y-auto bg-gray-100 p-4">{children}</main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}
