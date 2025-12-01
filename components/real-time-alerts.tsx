"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const alerts = [
  { title: "売上予測変更", description: "本日の売上予測が10%上方修正されました。" },
  { title: "在庫アラート", description: "「牛肉（ロース）」の在庫が危険水準に近づいています。" },
  { title: "スタッフ不足", description: "明日の夜間シフトでスタッフが1名不足しています。" },
]

export default function RealTimeAlerts() {
  return (
    <div className="space-y-4">
      {alerts.map((alert, index) => (
        <Alert key={index}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
