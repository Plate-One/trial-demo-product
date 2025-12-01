"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const inventoryData = [
  { item: "牛肉（ロース）", currentStock: 25, suggestedOrder: 15, status: "normal" },
  { item: "豚肉（バラ）", currentStock: 10, suggestedOrder: 20, status: "low" },
  { item: "鶏肉（もも）", currentStock: 30, suggestedOrder: 10, status: "normal" },
  { item: "サラダ野菜", currentStock: 5, suggestedOrder: 25, status: "critical" },
  { item: "ご飯", currentStock: 40, suggestedOrder: 0, status: "high" },
]

export default function InventorySuggestions() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>商品名</TableHead>
          <TableHead className="text-right">現在庫</TableHead>
          <TableHead className="text-right">発注提案</TableHead>
          <TableHead className="text-right">ステータス</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventoryData.map((item) => (
          <TableRow key={item.item}>
            <TableCell>{item.item}</TableCell>
            <TableCell className="text-right">{item.currentStock}</TableCell>
            <TableCell className="text-right">{item.suggestedOrder}</TableCell>
            <TableCell className="text-right">
              <Badge
                variant={
                  item.status === "critical"
                    ? "destructive"
                    : item.status === "low"
                      ? "warning"
                      : item.status === "high"
                        ? "default"
                        : "secondary"
                }
              >
                {item.status === "critical"
                  ? "緊急"
                  : item.status === "low"
                    ? "要注意"
                    : item.status === "high"
                      ? "過剰"
                      : "適正"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
