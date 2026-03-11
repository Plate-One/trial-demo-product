import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

/**
 * CSV取込API
 * CSVフォーマット: date,hour,customers,sales
 * 例: 2026-01-15,12,25,47500
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { store_id, csv_data } = body

    if (!store_id || !csv_data) {
      return NextResponse.json(
        { error: "store_id と csv_data は必須です" },
        { status: 400 }
      )
    }

    // CSVパース
    const lines = (csv_data as string).trim().split("\n")
    const rows: {
      store_id: string
      date: string
      hour: number
      customers: number
      sales: number
      day_type: string
    }[] = []

    const errors: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith("date") || line.startsWith("#")) continue // ヘッダーやコメントをスキップ

      const parts = line.split(",").map((s) => s.trim())
      if (parts.length < 4) {
        errors.push(`行${i + 1}: カラム数が不足しています`)
        continue
      }

      const [dateStr, hourStr, customersStr, salesStr] = parts
      const hour = parseInt(hourStr, 10)
      const customers = parseInt(customersStr, 10)
      const sales = parseInt(salesStr, 10)

      // バリデーション
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        errors.push(`行${i + 1}: 日付フォーマットが不正です (${dateStr})`)
        continue
      }
      if (isNaN(hour) || hour < 0 || hour > 23) {
        errors.push(`行${i + 1}: 時間が不正です (${hourStr})`)
        continue
      }
      if (isNaN(customers) || customers < 0) {
        errors.push(`行${i + 1}: 来客数が不正です (${customersStr})`)
        continue
      }
      if (isNaN(sales) || sales < 0) {
        errors.push(`行${i + 1}: 売上が不正です (${salesStr})`)
        continue
      }

      // day_type を算出
      const d = new Date(dateStr)
      const dow = d.getDay()
      let day_type = "weekday"
      if (dow === 0) day_type = "sunday"
      else if (dow === 6) day_type = "saturday"
      else if (dow === 5) day_type = "friday"

      rows.push({ store_id, date: dateStr, hour, customers, sales, day_type })
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "有効なデータ行がありません", errors },
        { status: 400 }
      )
    }

    // バルクinsert (50行ずつ)
    const supabase = createServiceRoleClient()
    let insertedCount = 0
    const batchSize = 50

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      const { error } = await supabase
        .from("actual_sales")
        .upsert(batch as any, { onConflict: "store_id,date,hour" })

      if (error) {
        errors.push(`バッチ ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      } else {
        insertedCount += batch.length
      }
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      total_rows: rows.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
