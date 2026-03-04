"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Clock, DollarSign, BarChart2, PieChart, Download, Calendar } from "lucide-react"
import { format, subDays } from "date-fns"
import { ja } from "date-fns/locale"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { StatCard } from "@/components/stat-card"

const salesChartData = [
  { d: "1", v: 380 }, { d: "5", v: 420 }, { d: "10", v: 450 },
  { d: "15", v: 410 }, { d: "20", v: 460 }, { d: "25", v: 440 }, { d: "30", v: 480 },
]

const laborChartData = [
  { d: "正社員", v: 1800 }, { d: "アルバイト", v: 900 }, { d: "ヘルプ", v: 305 },
]

const accuracyChartData = [
  { d: "W1", v: 91 }, { d: "W2", v: 93 }, { d: "W3", v: 94 }, { d: "W4", v: 95 },
]

const shiftChartData = [
  { d: "月", v: 95 }, { d: "火", v: 97 }, { d: "水", v: 94 },
  { d: "木", v: 98 }, { d: "金", v: 96 }, { d: "土", v: 97 }, { d: "日", v: 96 },
]

export default function ReportsPage() {
  const today = new Date()
  const periodStart = format(subDays(today, 30), "M月d日", { locale: ja })
  const periodEnd = format(today, "M月d日", { locale: ja })

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">レポート</h1>
              <p className="text-sm text-gray-600 mt-1">
                {periodStart} 〜 {periodEnd} のパフォーマンスレポート
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                期間変更
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                PDFエクスポート
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI サマリー */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            iconColor="text-green-600"
            label="月間売上"
            value="¥12,840,000"
            subtext="前月比 +8.3%"
            subtextColor="text-green-600"
          />
          <StatCard
            icon={Users}
            iconColor="text-blue-600"
            label="月間来客数"
            value="6,420人"
            subtext="前月比 +5.1%"
            subtextColor="text-green-600"
          />
          <StatCard
            icon={Clock}
            iconColor="text-purple-600"
            label="人件費率"
            value="23.4%"
            subtext="目標25%以内 達成"
            subtextColor="text-green-600"
          />
          <StatCard
            icon={TrendingUp}
            iconColor="text-amber-600"
            label="予測精度"
            value="94.2%"
            subtext="前月比 +1.8pt"
            subtextColor="text-green-600"
          />
        </div>

        {/* レポートカード一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-blue-600" />
                  売上分析レポート
                </CardTitle>
                <Badge variant="secondary">月次</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">日別売上推移</span>
                  <span className="font-medium">平均 ¥428,000/日</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ピーク曜日</span>
                  <span className="font-medium">金曜日・土曜日</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">客単価</span>
                  <span className="font-medium">¥2,000</span>
                </div>
                <div className="h-24 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesChartData}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip formatter={(v: number) => [`¥${v}K`, "売上"]} />
                      <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="url(#salesGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  人件費分析レポート
                </CardTitle>
                <Badge variant="secondary">月次</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">総人件費</span>
                  <span className="font-medium">¥3,004,560</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">総労働時間</span>
                  <span className="font-medium">2,560時間</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">時間帯別効率</span>
                  <span className="font-medium text-green-600">最適化済み</span>
                </div>
                <div className="h-24 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={laborChartData}>
                      <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip formatter={(v: number) => [`¥${v}K`, "人件費"]} />
                      <Bar dataKey="v" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  需要予測精度レポート
                </CardTitle>
                <Badge variant="secondary">週次</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">売上予測精度</span>
                  <span className="font-medium">94.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">客数予測精度</span>
                  <span className="font-medium">91.8%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">天候影響補正</span>
                  <span className="font-medium text-green-600">+2.1pt改善</span>
                </div>
                <div className="h-24 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={accuracyChartData}>
                      <defs>
                        <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[88, 96]} />
                      <Tooltip formatter={(v: number) => [`${v}%`, "精度"]} />
                      <Area type="monotone" dataKey="v" stroke="#a855f7" fill="url(#accuracyGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  シフト最適化レポート
                </CardTitle>
                <Badge variant="secondary">週次</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">シフト充足率</span>
                  <span className="font-medium">96.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ヘルプ利用回数</span>
                  <span className="font-medium">12回/月</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">残業時間削減</span>
                  <span className="font-medium text-green-600">-15.3%</span>
                </div>
                <div className="h-24 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={shiftChartData}>
                      <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[90, 100]} />
                      <Tooltip formatter={(v: number) => [`${v}%`, "充足率"]} />
                      <Bar dataKey="v" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
