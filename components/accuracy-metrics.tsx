"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// 精度データ（実際のアプリケーションではAPIから取得）
const accuracyData = [
  { date: "2/20", customerAccuracy: 94.5, revenueAccuracy: 93.8 },
  { date: "2/21", customerAccuracy: 96.2, revenueAccuracy: 95.5 },
  { date: "2/22", customerAccuracy: 97.7, revenueAccuracy: 97.2 },
  { date: "2/23", customerAccuracy: 95.5, revenueAccuracy: 94.8 },
  { date: "2/24", customerAccuracy: 95.7, revenueAccuracy: 95.2 },
  { date: "2/25", customerAccuracy: 97.6, revenueAccuracy: 97.0 },
  { date: "2/26", customerAccuracy: 97.2, revenueAccuracy: 96.8 },
]

export default function AccuracyMetrics() {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={accuracyData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[90, 100]} tickCount={5} />
          <Tooltip formatter={(value) => [`${value}%`, ""]} />
          <Legend />
          <Line
            type="monotone"
            dataKey="customerAccuracy"
            stroke="#2563eb"
            strokeWidth={2}
            name="客数予測精度"
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="revenueAccuracy"
            stroke="#10b981"
            strokeWidth={2}
            name="売上予測精度"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
