"use client"
import { useState } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sun, Cloud, CloudRain, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { ArrowUp, Users, Calendar, Phone, Settings, AlertCircle, TrendingUp, Clock, MapPin } from "lucide-react"
import Link from "next/link"

// 需要予測データ
const demandData = [
  { date: "2/27", customers: 180, revenue: 380000 },
  { date: "2/28", customers: 220, revenue: 420000 },
  { date: "2/29", customers: 245, revenue: 458200 },
  { date: "3/1", customers: 200, revenue: 400000 },
  { date: "3/2", customers: 210, revenue: 410000 },
  { date: "3/3", customers: 230, revenue: 440000 },
  { date: "3/4", customers: 190, revenue: 390000 },
]

const generateCalendarData = (date: Date) => {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  const days = eachDayOfInterval({ start, end })
  return days.map((day) => ({
    date: day,
    weather: ["sunny", "cloudy", "rainy"][Math.floor(Math.random() * 3)],
    revenue: Math.floor(Math.random() * 500000) + 500000,
    customers: Math.floor(Math.random() * 100) + 100,
    flRatio: (Math.random() * 10 + 20).toFixed(1),
    sales: `${((Math.floor(Math.random() * 500) + 500) * 10000).toLocaleString()}円`,
  }))
}

const WeatherIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "sunny":
      return <Sun className="h-5 w-5 text-yellow-500" />
    case "cloudy":
      return <Cloud className="h-5 w-5 text-gray-400" />
    case "rainy":
      return <CloudRain className="h-5 w-5 text-blue-400" />
    default:
      return null
  }
}

export default function DemandForecastDashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">需要予測ダッシュボード</h1>
              <p className="text-sm text-gray-600 mt-1">本日の売上・客数予測とスタッフ配置提案</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium min-w-[120px] text-center">
                  {format(new Date(), "yyyy年M月d日 (E)", { locale: ja })}
                </span>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button size="sm" variant="outline">
                予測を更新
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">

        {/* 本日の重要指標 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">本日の予測売上</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">¥458,200</p>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUp className="w-3 h-3 mr-1" />
              前日比 +12%
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">本日の予測客数</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">245人</p>
            <p className="text-xs text-gray-500 mt-1">ピーク: 12-14時 (85人)</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">現在の来店客数</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">32人</p>
            <p className="text-xs text-gray-600 mt-1">テーブル稼働率: 68%</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">残り予約枠</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">18組</p>
            <p className="text-xs text-gray-600 mt-1">ディナータイム: 3組のみ</p>
          </div>
        </div>

        {/* リアルタイム状況と追加情報 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">リアルタイム状況</h3>
            <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">現在の売上実績</span>
              <span className="font-bold text-green-600">¥156,800</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">予測との差異</span>
              <span className="font-bold text-green-600 flex items-center">
                <ArrowUp className="w-3 h-3 mr-1" />
                +8.2%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">平均客単価</span>
              <span className="font-bold">¥4,900</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">平均滞在時間</span>
              <span className="font-bold">78分</span>
            </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">人気メニュー予測</h3>
            <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">ステーキセット</span>
              <Badge variant="default">42注文</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">パスタランチ</span>
              <Badge variant="secondary">38注文</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">シーザーサラダ</span>
              <Badge variant="outline">35注文</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">デザートプレート</span>
              <Badge variant="outline">28注文</Badge>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">※ランチタイム終了までの予測</p>
            </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">天気・イベント情報</h3>
            <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Sun className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">晴れ 24°C</p>
                <p className="text-xs text-gray-600">降水確率: 10%</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">近隣イベント</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• 渋谷駅前コンサート (14:00-16:00)</p>
                <p>• 商店街セール開催中</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">交通情報</p>
              <p className="text-xs text-green-600">JR山手線: 正常運行</p>
            </div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">クイックアクション</h3>
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <Phone className="w-5 h-5" />
                <span className="text-xs">緊急スタッフ呼び出し</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <Settings className="w-5 h-5" />
                <span className="text-xs">メニュー変更</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <AlertCircle className="w-5 h-5" />
                <span className="text-xs">予約受付停止</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <Users className="w-5 h-5" />
                <span className="text-xs">スタッフ配置変更</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 時間別予測グラフ */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">本日の時間別予測</h3>
          <p className="text-sm text-gray-600 mb-4">売上と客数の時間別推移</p>
          <div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { time: "9:00", customers: 15, revenue: 45000 },
                    { time: "10:00", customers: 25, revenue: 75000 },
                    { time: "11:00", customers: 35, revenue: 105000 },
                    { time: "12:00", customers: 85, revenue: 255000 },
                    { time: "13:00", customers: 90, revenue: 270000 },
                    { time: "14:00", customers: 65, revenue: 195000 },
                    { time: "15:00", customers: 30, revenue: 90000 },
                    { time: "16:00", customers: 25, revenue: 75000 },
                    { time: "17:00", customers: 40, revenue: 120000 },
                    { time: "18:00", customers: 75, revenue: 225000 },
                    { time: "19:00", customers: 80, revenue: 240000 },
                    { time: "20:00", customers: 70, revenue: 210000 },
                    { time: "21:00", customers: 45, revenue: 135000 },
                    { time: "22:00", customers: 20, revenue: 60000 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="customers" stroke="#2563eb" strokeWidth={2} name="客数" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} name="売上" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 今日のスタッフ配置とアクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">推奨スタッフ配置</h3>
            <p className="text-sm text-gray-600 mb-4">時間帯別の最適な人員配置</p>
            <div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">ランチタイム (11:00-15:00)</p>
                    <p className="text-sm text-blue-700">ホール: 4人 / キッチン: 3人</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600">予測客数</p>
                    <p className="font-bold text-blue-900">275人</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900">ディナータイム (17:00-22:00)</p>
                    <p className="text-sm text-green-700">ホール: 5人 / キッチン: 4人</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">予測客数</p>
                    <p className="font-bold text-green-900">290人</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">アイドルタイム (15:00-17:00)</p>
                    <p className="text-sm text-gray-700">ホール: 2人 / キッチン: 2人</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">予測客数</p>
                    <p className="font-bold text-gray-900">65人</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">今日の注意事項</h3>
            <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <Sun className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">天候による影響</p>
                <p className="text-xs text-yellow-700">晴天のため、テラス席の利用増加が予想されます</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">ピークタイム対応</p>
                <p className="text-xs text-blue-700">12-14時は通常より30%多い客数が予想されます</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-800">週末準備</p>
                <p className="text-xs text-purple-700">明日は土曜日のため、予約状況を確認してください</p>
              </div>
            </div>

            <div className="mt-4">
              <Button className="w-full" variant="outline">
                <Link href="/demand-forecast/details" className="flex items-center">
                  詳細な予測データを表示
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
