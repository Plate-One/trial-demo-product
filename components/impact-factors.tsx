"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const factors = [
  { name: "天気（晴れ）", impact: "+15%" },
  { name: "週末（土曜日）", impact: "+25%" },
  { name: "近隣イベント（コンサート）", impact: "+18%" },
  { name: "季節要因（春）", impact: "+9%" },
  { name: "プロモーション（SNS広告）", impact: "+20%" },
]

export default function ImpactFactors() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>影響要因分析</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {factors.map((factor) => (
            <div key={factor.name} className="flex justify-between items-center">
              <span className="text-sm">{factor.name}</span>
              <span className="text-sm font-medium text-green-600">{factor.impact}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
