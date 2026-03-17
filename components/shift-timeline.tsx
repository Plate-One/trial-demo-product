"use client"

import { useState, useMemo } from "react"
import { ChevronUpIcon, ChevronDownIcon, ChevronsUpDownIcon, Users } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { MonthlyShiftTable } from "@/components/monthly-shift-table"
import { Badge } from "@/components/ui/badge"
import { useShifts, type ShiftWithStaff } from "@/lib/hooks/use-shifts"
import { useStoreContext } from "@/lib/hooks/use-store-context"
import { useActualSales } from "@/lib/hooks/use-actual-sales"
import { useDemandForecasts } from "@/lib/hooks/use-demand-forecast"

type SortField = "start" | "end"
type SortOrder = "asc" | "desc"

// 時間帯別推奨人数（DB demand_forecasts がなければ空 = 推奨なし）
const EMPTY_RECOMMENDED: Record<number, { hall: number; kitchen: number }> = {}

type StaffMember = {
  name: string
  type: "社員" | "アルバイト"
  shifts: { start: string; end: string; role: "ホール" | "キッチン" }[]
}

export function ShiftTimeline({
  viewMode,
  currentDate,
  shiftStatus = "preferred",
  storeId,
}: { viewMode: "daily" | "monthly"; currentDate: Date; shiftStatus?: "preferred" | "optimized" | "confirmed"; storeId?: string }) {
  const [sortField, setSortField] = useState<SortField>("start")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  const dateStr = format(currentDate, "yyyy-MM-dd")
  const { selectedStore } = useStoreContext()
  const effectiveStoreId = storeId || selectedStore?.id || ""

  // DBからシフトデータ取得
  const { shifts: dbShifts } = useShifts(effectiveStoreId, dateStr)

  // DBから売上実績・予測取得
  const { sales: actualSalesData } = useActualSales(effectiveStoreId, dateStr, dateStr)
  const { forecasts } = useDemandForecasts(effectiveStoreId, dateStr, dateStr)

  const hourlyWage = selectedStore?.hourly_wage_hall || 1200

  // DBシフトデータをStaffMember型に変換
  const staff: StaffMember[] = useMemo(() => {
    if (dbShifts.length === 0) return []

    // staff_id + role でグループ化
    const grouped = new Map<string, StaffMember>()
    for (const shift of dbShifts) {
      const key = `${shift.staff_id}-${shift.role}`
      const name = shift.staff?.name ?? "不明"
      const empType = shift.staff?.employment_type ?? "アルバイト"
      const type: "社員" | "アルバイト" = empType === "正社員" ? "社員" : "アルバイト"
      const startTime = shift.start_time?.slice(0, 5) ?? "00:00"
      const endTime = shift.end_time?.slice(0, 5) ?? "00:00"

      if (grouped.has(key)) {
        grouped.get(key)!.shifts.push({ start: startTime, end: endTime, role: shift.role })
      } else {
        grouped.set(key, { name, type, shifts: [{ start: startTime, end: endTime, role: shift.role }] })
      }
    }
    return Array.from(grouped.values())
  }, [dbShifts])

  // 売上指標
  const dailySales = useMemo(() => {
    return actualSalesData.reduce((sum, s) => sum + s.sales, 0)
  }, [actualSalesData])

  const forecastSales = useMemo(() => {
    const fc = forecasts.find(f => f.date === dateStr)
    return fc?.forecast_sales ?? 0
  }, [forecasts, dateStr])

  // 推奨人員（予測データから取得）
  const recommendedStaffing = useMemo(() => {
    const fc = forecasts.find(f => f.date === dateStr)
    const hourly = fc?.hourly_data as Record<string, any> | null
    if (!hourly) return EMPTY_RECOMMENDED

    const result: Record<number, { hall: number; kitchen: number }> = { ...EMPTY_RECOMMENDED }
    for (let h = 8; h <= 23; h++) {
      const hd = hourly[h] || hourly[String(h)]
      if (hd) {
        result[h] = { hall: hd.recommended_hall ?? EMPTY_RECOMMENDED[h]?.hall ?? 0, kitchen: hd.recommended_kitchen ?? EMPTY_RECOMMENDED[h]?.kitchen ?? 0 }
      }
    }
    return result
  }, [forecasts, dateStr])

  // ホールとキッチンのスタッフを分離
  const hallStaff = useMemo(() => {
    return staff.filter((m) => m.shifts.some((s) => s.role === "ホール"))
      .map((m) => ({ ...m, shifts: m.shifts.filter((s) => s.role === "ホール") }))
  }, [staff])

  const kitchenStaff = useMemo(() => {
    return staff.filter((m) => m.shifts.some((s) => s.role === "キッチン"))
      .map((m) => ({ ...m, shifts: m.shifts.filter((s) => s.role === "キッチン") }))
  }, [staff])

  const separateByType = (staffList: StaffMember[]) => ({
    employees: staffList.filter((m) => m.type === "社員"),
    partTimers: staffList.filter((m) => m.type === "アルバイト"),
  })

  const calculateActualStaff = (staffList: StaffMember[], hour: number, role: "ホール" | "キッチン") => {
    let count = 0
    for (const m of staffList) {
      for (const s of m.shifts) {
        if (s.role === role) {
          const sh = parseInt(s.start.split(":")[0])
          const eh = parseInt(s.end.split(":")[0])
          if (hour >= sh && hour < eh) count++
        }
      }
    }
    return count
  }

  const calculateTotalActualStaff = (hour: number, role: "ホール" | "キッチン") => calculateActualStaff(staff, hour, role)

  const sortStaff = (staffList: StaffMember[]) => {
    const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0) }
    return [...staffList].sort((a, b) => {
      const av = sortField === "start" ? a.shifts[0]?.start : a.shifts[a.shifts.length - 1]?.end
      const bv = sortField === "start" ? b.shifts[0]?.start : b.shifts[b.shifts.length - 1]?.end
      if (!av || !bv) return 0
      return sortOrder === "asc" ? toMin(av) - toMin(bv) : toMin(bv) - toMin(av)
    })
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortOrder("asc") }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field === sortField) return sortOrder === "asc" ? <ChevronUpIcon className="w-4 h-4 ml-1" /> : <ChevronDownIcon className="w-4 h-4 ml-1" />
    return <ChevronsUpDownIcon className="w-4 h-4 ml-1 text-gray-400" />
  }

  // 日別の労働時間集計
  const calculateMetrics = (staffList: StaffMember[]) => {
    let totalHours = 0
    for (const m of staffList) {
      for (const s of m.shifts) {
        const sh = parseInt(s.start.split(":")[0]) + parseInt(s.start.split(":")[1] || "0") / 60
        const eh = parseInt(s.end.split(":")[0]) + parseInt(s.end.split(":")[1] || "0") / 60
        totalHours += eh - sh
      }
    }
    const laborCost = totalHours * hourlyWage
    const laborCostRatio = dailySales > 0 ? (laborCost / dailySales) * 100 : forecastSales > 0 ? (laborCost / forecastSales) * 100 : 0
    return { totalHours, laborCost, laborCostRatio }
  }

  const HOUR_WIDTH = 80
  const stickyClass = (col: 0 | 1 | 2, bg: string) =>
    `sticky z-10 ${bg} ${col === 0 ? "left-0" : col === 1 ? "left-[120px]" : "left-[190px]"} shadow-[2px_0_4px_rgba(0,0,0,0.06)]`

  const renderStaffTable = (staffList: StaffMember[], title: string, isEmployee: boolean, role: "ホール" | "キッチン") => (
    <div className="mb-4">
      <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded ${isEmployee ? "bg-blue-100" : "bg-purple-100"}`}>
        <Badge variant="outline" className={`${isEmployee ? "text-blue-700" : "text-purple-700"} border-current text-xs`}>{title}</Badge>
        <span className={`text-xs font-medium ${isEmployee ? "text-blue-700" : "text-purple-700"}`}>{staffList.length}名</span>
      </div>
      <div className="overflow-x-auto overflow-y-visible rounded-lg border border-gray-200">
        <table className="border-collapse table-fixed" style={{ minWidth: 120 + 70 + 70 + 16 * HOUR_WIDTH }}>
          <colgroup>
            <col style={{ width: 120, minWidth: 120 }} />
            <col style={{ width: 70, minWidth: 70 }} />
            <col style={{ width: 70, minWidth: 70 }} />
            {Array.from({ length: 16 }, (_, i) => <col key={i} style={{ width: HOUR_WIDTH, minWidth: HOUR_WIDTH }} />)}
          </colgroup>
          <thead>
            <tr>
              <th className={`h-12 border-b border-r bg-gray-50 p-2 text-left text-sm font-medium text-gray-600 ${stickyClass(0, "bg-gray-50")}`}>スタッフ</th>
              <th className={`h-12 border-b border-r bg-gray-50 p-2 text-center text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 ${stickyClass(1, "bg-gray-50")}`} onClick={() => handleSort("start")}>
                <div className="flex items-center justify-center">始業<SortIcon field="start" /></div>
              </th>
              <th className={`h-12 border-b border-r bg-gray-50 p-2 text-center text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 ${stickyClass(2, "bg-gray-50")}`} onClick={() => handleSort("end")}>
                <div className="flex items-center justify-center">終業<SortIcon field="end" /></div>
              </th>
              {Array.from({ length: 16 }, (_, i) => i + 8).map((hour) => (
                <th key={hour} className="h-12 border-b border-r bg-gray-50 p-2 text-center text-sm font-medium text-gray-600">{hour}時</th>
              ))}
            </tr>
            <tr className="bg-gray-100">
              <td className={`h-12 border-b border-r bg-gray-100 p-2 text-xs font-medium text-gray-600 align-middle ${stickyClass(0, "bg-gray-100")}`}>
                <div className="flex items-center gap-1"><Users className="w-3 h-3" />推奨/実際</div>
              </td>
              <td className={`h-12 border-b border-r bg-gray-100 p-2 align-middle ${stickyClass(1, "bg-gray-100")}`}>&#8203;</td>
              <td className={`h-12 border-b border-r bg-gray-100 p-2 align-middle ${stickyClass(2, "bg-gray-100")}`}>&#8203;</td>
              {Array.from({ length: 16 }, (_, i) => i + 8).map((hour) => {
                const rec = recommendedStaffing[hour]?.[role === "ホール" ? "hall" : "kitchen"] || 0
                const totalActual = calculateTotalActualStaff(hour, role)
                const sectionActual = calculateActualStaff(staffList, hour, role)
                const isShort = totalActual < rec
                const isOver = totalActual > rec
                return (
                  <td key={hour} className={`h-12 border-b border-r p-2 text-center text-xs align-middle ${isShort ? "bg-red-100 text-red-700" : isOver ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                    <div className="font-bold">{sectionActual}名</div>
                    <div className="text-[10px] text-gray-600">全体:{totalActual}/{rec}</div>
                    {isShort && <div className="text-red-600 text-[10px]">-{rec - totalActual}</div>}
                    {isOver && <div className="text-yellow-600 text-[10px]">+{totalActual - rec}</div>}
                  </td>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {staffList.map((member, idx) => (
              <tr key={`${member.name}-${idx}`} className="border-b hover:bg-gray-50">
                <td className={`h-12 border-r p-2 text-sm font-medium text-gray-900 ${stickyClass(0, "bg-white")}`}>{member.name}</td>
                <td className={`h-12 border-r p-2 text-sm text-center text-gray-900 ${stickyClass(1, "bg-white")}`}>{member.shifts[0]?.start || "-"}</td>
                <td className={`h-12 border-r p-2 text-sm text-center text-gray-900 ${stickyClass(2, "bg-white")}`}>{member.shifts[member.shifts.length - 1]?.end || "-"}</td>
                <td colSpan={16} className="h-12 p-0 relative align-top">
                  <div className="relative w-full" style={{ width: 16 * HOUR_WIDTH, height: "3rem" }}>
                    {member.shifts.map((shift, si) => {
                      const sh = parseInt(shift.start.split(":")[0])
                      const eh = parseInt(shift.end.split(":")[0])
                      const startPct = ((sh - 8) / 16) * 100
                      const widthPct = ((eh - sh) / 16) * 100
                      const color = shift.role === "ホール"
                        ? shiftStatus === "confirmed" ? "bg-blue-200 text-blue-800 border-2 border-blue-500" : "bg-blue-100 text-blue-700 border border-blue-300"
                        : shiftStatus === "confirmed" ? "bg-emerald-200 text-emerald-800 border-2 border-emerald-500" : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      return (
                        <div key={si} className={`absolute flex items-center justify-center rounded px-1 text-center ${color}`} style={{ left: `${startPct}%`, width: `${widthPct}%`, top: "2px", bottom: "2px" }}>
                          <div className="text-xs font-medium truncate">{shift.start} - {shift.end}</div>
                        </div>
                      )
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderRoleTable = (roleStaff: StaffMember[], role: "ホール" | "キッチン", bgColor: string, textColor: string) => {
    const { employees, partTimers } = separateByType(roleStaff)
    return (
      <div className="mb-6">
        <div className={`flex items-center gap-2 mb-3 px-2 py-2 rounded-t-lg ${bgColor}`}>
          <Badge variant="outline" className={`${textColor} border-current`}>{role}</Badge>
          <span className={`text-sm font-medium ${textColor}`}>社員{employees.length}名 / アルバイト{partTimers.length}名</span>
        </div>
        {renderStaffTable(sortStaff(employees), "社員", true, role)}
        {renderStaffTable(sortStaff(partTimers), "アルバイト", false, role)}
      </div>
    )
  }

  if (viewMode === "monthly") return <MonthlyShiftTable storeId={effectiveStoreId} />

  // データなし表示
  if (staff.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <Users className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-lg font-medium text-gray-600 mb-1">シフトデータがありません</p>
        <p className="text-sm text-gray-400">シフト作成からシフトを作成してください</p>
      </div>
    )
  }

  const totalMetrics = calculateMetrics([...hallStaff, ...kitchenStaff])
  const hallMetrics = calculateMetrics(hallStaff)
  const kitchenMetrics = calculateMetrics(kitchenStaff)

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{format(currentDate, "yyyy年M月d日", { locale: ja })} 日別指標</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-3 bg-gray-50 text-left text-sm font-medium text-gray-600 min-w-[120px] whitespace-nowrap">指標</th>
                <th className="border p-3 bg-gray-50 text-center text-sm font-medium text-gray-600 min-w-[120px]">合計</th>
                <th className="border p-3 bg-blue-50 text-center text-sm font-medium text-blue-700 min-w-[120px]">ホール</th>
                <th className="border p-3 bg-emerald-50 text-center text-sm font-medium text-emerald-700 min-w-[120px]">キッチン</th>
              </tr>
            </thead>
            <tbody>
              {forecastSales > 0 && (
                <tr>
                  <td className="border p-3 text-sm font-medium text-gray-700 whitespace-nowrap">売上予測</td>
                  <td className="border p-3 text-center text-sm text-gray-900">{forecastSales.toLocaleString()}円</td>
                  <td className="border p-3 text-center text-sm text-gray-900 bg-blue-50/30">-</td>
                  <td className="border p-3 text-center text-sm text-gray-900 bg-emerald-50/30">-</td>
                </tr>
              )}
              {dailySales > 0 && (
                <tr>
                  <td className="border p-3 text-sm font-medium text-gray-700 whitespace-nowrap">売上実績</td>
                  <td className="border p-3 text-center text-sm text-gray-900">{dailySales.toLocaleString()}円</td>
                  <td className="border p-3 text-center text-sm text-gray-900 bg-blue-50/30">-</td>
                  <td className="border p-3 text-center text-sm text-gray-900 bg-emerald-50/30">-</td>
                </tr>
              )}
              <tr>
                <td className="border p-3 text-sm font-medium text-gray-700 whitespace-nowrap">投入労働時間</td>
                <td className="border p-3 text-center text-sm text-gray-900">{totalMetrics.totalHours.toFixed(1)}h</td>
                <td className="border p-3 text-center text-sm text-gray-900 bg-blue-50/30">{hallMetrics.totalHours.toFixed(1)}h</td>
                <td className="border p-3 text-center text-sm text-gray-900 bg-emerald-50/30">{kitchenMetrics.totalHours.toFixed(1)}h</td>
              </tr>
              <tr>
                <td className="border p-3 text-sm font-medium text-gray-700 whitespace-nowrap">人件費</td>
                <td className="border p-3 text-center text-sm text-gray-900">{totalMetrics.laborCost.toLocaleString()}円</td>
                <td className="border p-3 text-center text-sm text-gray-900 bg-blue-50/30">{hallMetrics.laborCost.toLocaleString()}円</td>
                <td className="border p-3 text-center text-sm text-gray-900 bg-emerald-50/30">{kitchenMetrics.laborCost.toLocaleString()}円</td>
              </tr>
              {totalMetrics.laborCostRatio > 0 && (
                <tr>
                  <td className="border p-3 text-sm font-medium text-gray-700 whitespace-nowrap">人件費率</td>
                  <td className="border p-3 text-center text-sm text-gray-900">{totalMetrics.laborCostRatio.toFixed(1)}%</td>
                  <td className="border p-3 text-center text-sm text-gray-900 bg-blue-50/30">{hallMetrics.laborCostRatio.toFixed(1)}%</td>
                  <td className="border p-3 text-center text-sm text-gray-900 bg-emerald-50/30">{kitchenMetrics.laborCostRatio.toFixed(1)}%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm space-y-6">
        {renderRoleTable(hallStaff, "ホール", "bg-blue-50", "text-blue-700")}
        {renderRoleTable(kitchenStaff, "キッチン", "bg-emerald-50", "text-emerald-700")}
      </div>
    </div>
  )
}
