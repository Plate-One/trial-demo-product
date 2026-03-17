"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, HelpCircle, Keyboard, Info, ExternalLink, Menu, X, LogOut } from "lucide-react"
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
import { ToastProvider } from "@/components/toast"
import { Breadcrumb } from "@/components/breadcrumb"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { useStores } from "@/lib/hooks/use-stores"
import { StoreContext } from "@/lib/hooks/use-store-context"

const inter = Inter({ subsets: ["latin"] })

function HeaderActions({ profile, signOut }: { profile: { id: string; name: string } | null; signOut: () => void }) {
  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      <Button variant="ghost" size="icon" className="relative" aria-label="通知（準備中）" disabled>
        <Bell className="h-5 w-5" />
      </Button>

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label={`ユーザーメニュー（${profile?.name ?? ""}）`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/01.png" alt={profile?.name ?? ""} />
              <AvatarFallback>{profile?.name?.charAt(0) ?? "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile?.name ?? "ユーザー"}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {profile && (
              <Link href={`/staff/${profile.id}`}>
                <DropdownMenuItem className="cursor-pointer">
                  プロフィール
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
              </Link>
            )}
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer">
                設定
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
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

function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, loading: authLoading, signOut } = useAuth()
  const { stores, loading: storesLoading } = useStores()
  const [selectedStoreId, setSelectedStoreId] = useState<string>("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      if (profile?.store_id) {
        setSelectedStoreId(profile.store_id)
      } else {
        setSelectedStoreId(stores[0].id)
      }
    }
  }, [stores, profile, selectedStoreId])

  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? null

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto" />
      </div>
    )
  }

  return (
    <StoreContext.Provider value={{ stores, selectedStore, setSelectedStoreId, loading: storesLoading }}>
      <div className="flex h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <MobileOverlay open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="relative z-40 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800/50" role="banner">
            <div className="flex items-center justify-between p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="メニューを開く"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger className="w-[180px] sm:w-[280px]" aria-label="店舗を選択">
                    <SelectValue placeholder="店舗を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <HeaderActions profile={profile} signOut={signOut} />
              </div>
            </div>
          </header>
          <Breadcrumb />
          <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950 p-3 sm:p-4" role="main">{children}</main>
        </div>
      </div>
    </StoreContext.Provider>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login" || pathname === "/signup"
  const isMobilePage = pathname?.startsWith("/mypage")

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ToastProvider>
            {isLoginPage || isMobilePage ? children : <AppShell>{children}</AppShell>}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
