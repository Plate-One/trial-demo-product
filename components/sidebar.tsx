"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { BarChart2, CalendarDays, FileText, Users, Settings, ChevronLeft, ChevronRight, HandHelping } from "lucide-react"
import Image from "next/image"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const sidebarItems = [
    {
      title: "需要予測",
      icon: BarChart2,
      href: "/demand-forecast",
      subItems: [
        { title: "概要", href: "/demand-forecast" },
        { title: "詳細", href: "/demand-forecast/details" },
      ],
    },
    {
      title: "シフト",
      icon: CalendarDays,
      href: "/shifts",
      subItems: [
        { title: "シフト一覧", href: "/shifts" },
        { title: "シフト作成", href: "/shifts/create" },
      ],
    },
    {
      title: "レポート",
      icon: FileText,
      href: "/reports",
    },
    {
      title: "スタッフ管理",
      icon: Users,
      href: "/staff",
    },
    {
      title: "設定",
      icon: Settings,
      href: "/settings",
    },
  ]

  return (
    <div
      className={cn(
        "flex h-screen bg-white border-r transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <ScrollArea className="flex flex-col flex-grow">
        <div className="p-4 flex justify-between items-center h-16">
          {!collapsed && (
            <Image
              src="https://storage.googleapis.com/studio-design-asset-files/projects/p6aonk4vqR/s-1198x200_v-fs_webp_e53ed8d2-99c2-4886-964e-6c87dd01508c_small.webp"
              alt="キリンシティ Logo"
              width={120}
              height={20}
              className="object-contain"
            />
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="flex-1">
          {sidebarItems.map((item, index) => (
            <div key={index}>
              <Link href={item.href} passHref>
                <Button
                  variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
                  className={cn("w-full justify-start rounded-none h-12 overflow-hidden", collapsed ? "px-0" : "px-2")}
                >
                  <div
                    className={cn("flex items-center", collapsed ? "justify-center w-full" : "justify-start w-full")}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span className="ml-2 text-sm truncate">{item.title}</span>}
                  </div>
                </Button>
              </Link>
              {!collapsed && item.subItems && (
                <div className="ml-6 border-l border-gray-200">
                  {item.subItems.map((subItem, subIndex) => (
                    <Link key={subIndex} href={subItem.href} passHref>
                      <Button
                        variant={pathname === subItem.href ? "secondary" : "ghost"}
                        className="w-full justify-start rounded-none h-10 px-4"
                      >
                        <span>{subItem.title}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}
