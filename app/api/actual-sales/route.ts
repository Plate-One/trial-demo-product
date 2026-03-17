import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, validateStoreAccess } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("store_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    if (!storeId) {
      return NextResponse.json({ error: "store_id は必須です" }, { status: 400 })
    }

    const access = await validateStoreAccess(storeId)
    if (access.error) return access.error

    const supabase = createServiceRoleClient()

    let query = supabase
      .from("actual_sales")
      .select("*")
      .eq("store_id", storeId)
      .order("date")
      .order("hour")

    if (startDate) query = query.gte("date", startDate)
    if (endDate) query = query.lte("date", endDate)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
