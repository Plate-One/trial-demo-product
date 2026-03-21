"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/use-auth"
import { CalendarDays, Clock, Send, Bell, UserCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/employee", label: "ホーム", icon: CalendarDays },
  { href: "/employee/shifts", label: "シフト", icon: Clock },
  { href: "/employee/requests", label: "希望提出", icon: Send },
  { href: "/employee/notifications", label: "お知らせ", icon: Bell },
  { href: "/employee/profile", label: "マイページ", icon: UserCircle },
]

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    )
  }

  if (!user || !profile) return null

  return (
    <div className="max-w-[430px] mx-auto min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      {/* Body */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 z-10 safe-area-bottom">
        <div className="flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/employee" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors",
                  "active:scale-[0.97] active:opacity-70",
                  isActive ? "text-blue-600" : "text-gray-400"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className={cn("text-[11px]", isActive ? "font-bold" : "font-medium")}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
