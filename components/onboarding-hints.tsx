"use client"

import { useState, useEffect } from "react"
import { X, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HintProps {
  id: string
  message: string
  className?: string
}

const DISMISSED_KEY = "kirincity-dismissed-hints"

function getDismissed(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]")
  } catch {
    return []
  }
}

function dismissHint(id: string) {
  const dismissed = getDismissed()
  if (!dismissed.includes(id)) {
    dismissed.push(id)
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed))
  }
}

export function OnboardingHint({ id, message, className }: HintProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = getDismissed()
    if (!dismissed.includes(id)) {
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [id])

  if (!visible) return null

  const handleDismiss = () => {
    dismissHint(id)
    setVisible(false)
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800 animate-in slide-in-from-top-2 duration-300",
        className,
      )}
      role="status"
    >
      <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
      <span className="flex-1 leading-relaxed">{message}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 flex-shrink-0 text-blue-400 hover:text-blue-600 hover:bg-blue-100"
        onClick={handleDismiss}
        aria-label="ヒントを閉じる"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function resetAllHints() {
  localStorage.removeItem(DISMISSED_KEY)
}
