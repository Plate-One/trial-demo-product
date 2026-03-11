import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { generateForecasts } from "@/lib/forecast-engine"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { store_id, start_date, end_date } = body

    if (!store_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: "store_id, start_date, end_date は必須です" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // 過去データを取得（直近3ヶ月）
    const threeMonthsAgo = new Date(start_date)
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data: actualSales, error: salesError } = await supabase
      .from("actual_sales")
      .select("store_id, date, hour, customers, sales, day_type")
      .eq("store_id", store_id)
      .gte("date", threeMonthsAgo.toISOString().slice(0, 10))
      .lt("date", start_date)
      .order("date")

    if (salesError) {
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    if (!actualSales || actualSales.length === 0) {
      return NextResponse.json(
        { error: "過去の売上データがありません。先にactual_salesにデータを登録してください。" },
        { status: 404 }
      )
    }

    // 予測生成
    const forecasts = generateForecasts(store_id, start_date, end_date, actualSales)

    // demand_forecasts テーブルに upsert
    const upsertData = forecasts.map((f) => ({
      store_id: f.store_id,
      date: f.date,
      forecast_customers: f.forecast_customers,
      forecast_sales: f.forecast_sales,
      hourly_data: f.hourly_data as any,
      weather: f.weather as any,
      event: f.event,
      is_holiday: f.is_holiday,
      holiday_name: f.holiday_name,
    }))

    const { error: upsertError } = await supabase
      .from("demand_forecasts")
      .upsert(upsertData as any, { onConflict: "store_id,date" })

    if (upsertError) {
      // UNIQUE制約がない場合は既存データを削除して再挿入
      await supabase
        .from("demand_forecasts")
        .delete()
        .eq("store_id", store_id)
        .gte("date", start_date)
        .lte("date", end_date)

      const { error: insertError } = await supabase
        .from("demand_forecasts")
        .insert(upsertData as any)

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      count: forecasts.length,
      forecasts,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
