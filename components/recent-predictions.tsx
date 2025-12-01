"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const predictionData = [
  {
    date: "2025/03/01",
    predictedCustomers: 150,
    actualCustomers: 145,
    predictedRevenue: 450000,
    actualRevenue: 435000,
  },
  {
    date: "2025/03/02",
    predictedCustomers: 180,
    actualCustomers: 185,
    predictedRevenue: 540000,
    actualRevenue: 555000,
  },
  {
    date: "2025/03/03",
    predictedCustomers: 130,
    actualCustomers: 125,
    predictedRevenue: 390000,
    actualRevenue: 375000,
  },
  {
    date: "2025/03/04",
    predictedCustomers: 160,
    actualCustomers: 158,
    predictedRevenue: 480000,
    actualRevenue: 474000,
  },
  { date: "2025/03/05", predictedCustomers: 170, actualCustomers: null, predictedRevenue: 510000, actualRevenue: null },
]

export default function RecentPredictions() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>日付</TableHead>
          <TableHead className="text-right">予測客数</TableHead>
          <TableHead className="text-right">実績客数</TableHead>
          <TableHead className="text-right">予測売上</TableHead>
          <TableHead className="text-right">実績売上</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {predictionData.map((item) => (
          <TableRow key={item.date}>
            <TableCell>{item.date}</TableCell>
            <TableCell className="text-right">{item.predictedCustomers}</TableCell>
            <TableCell className="text-right">{item.actualCustomers || "-"}</TableCell>
            <TableCell className="text-right">{item.predictedRevenue.toLocaleString()}円</TableCell>
            <TableCell className="text-right">
              {item.actualRevenue ? `${item.actualRevenue.toLocaleString()}円` : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
