"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, AlertTriangle, TrendingUp } from "lucide-react"

const actionItems = [
  {
    title: "牛肉の追加発注が必要",
    description: "明日の予測数量を元に15kg発注推奨",
    icon: AlertTriangle,
    time: "12:00-14:00",
  },
  {
    title: "明日のランチタイムにスタッフ1名追加",
    description: "予測客数増加に伴い人員補強が必要",
    icon: Clock,
    time: "12:00-14:00",
  },
  {
    title: "来月のプロモーション準備",
    description: "SNSキャンペーンの実施準備",
    icon: TrendingUp,
    time: "2025/3/1-3/31",
  },
]

export default function ActionItems() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>アクションアイテム</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actionItems.map((item, index) => (
            <div key={index} className="flex items-start gap-4">
              <item.icon className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
