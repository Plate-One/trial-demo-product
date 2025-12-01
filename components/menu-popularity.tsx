"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const menuItems = [
  { name: "シーフードパエリア", orders: "42注文" },
  { name: "ステーキセット", orders: "38注文" },
  { name: "シーザーサラダ", orders: "35注文" },
  { name: "マルゲリータピザ", orders: "30注文" },
  { name: "チョコレートケーキ", orders: "25注文" },
]

export default function MenuPopularity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>メニュー人気予測</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {menuItems.map((item) => (
            <div key={item.name} className="flex justify-between items-center">
              <span className="text-sm">{item.name}</span>
              <span className="text-sm font-medium">{item.orders}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
