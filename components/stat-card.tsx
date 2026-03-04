import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  subtext?: string
  icon?: LucideIcon
  iconColor?: string
  labelColor?: string
  valueColor?: string
  bgColor?: string
  borderColor?: string
  subtextColor?: string
  subtextIcon?: LucideIcon
  className?: string
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor = "text-gray-600",
  labelColor = "text-gray-600",
  valueColor = "text-gray-900",
  bgColor = "bg-gray-50",
  borderColor = "border-gray-200",
  subtextColor = "text-gray-500",
  subtextIcon: SubtextIcon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors hover:bg-gray-100",
        bgColor,
        borderColor,
        className,
      )}
    >
      {Icon ? (
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn("h-4 w-4", iconColor)} />
          <p className={cn("text-sm font-medium", labelColor)}>{label}</p>
        </div>
      ) : (
        <p className={cn("text-sm font-medium", labelColor)}>{label}</p>
      )}
      <div className={cn("text-2xl font-bold", valueColor, Icon ? "" : "mt-1")}>
        {value}
      </div>
      {subtext && (
        <p className={cn("text-xs mt-1 flex items-center", subtextColor)}>
          {SubtextIcon && <SubtextIcon className="w-3 h-3 mr-1" />}
          {subtext}
        </p>
      )}
    </div>
  )
}
