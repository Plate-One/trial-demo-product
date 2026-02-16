"use client"

import { useState, useMemo } from "react"
import { ChevronUpIcon, ChevronDownIcon, ChevronsUpDownIcon, Users, DollarSign, Clock, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { MonthlyShiftTable } from "@/components/monthly-shift-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getHelpAssignmentsForStoreAndDay } from "@/lib/help-assignments"

type SortField = "start" | "end"
type SortOrder = "asc" | "desc"

const HOURLY_WAGE = 1200 // 時給

// モック売上データを生成
const generateMockSales = (date: Date): number => {
  const dayOfWeek = date.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const multiplier = isWeekend ? 1.3 : 1.0
  return Math.floor((150000 + Math.random() * 100000) * multiplier)
}

// 時間帯別推奨人数
const recommendedStaffing: Record<number, { hall: number; kitchen: number }> = {
  8: { hall: 1, kitchen: 1 },
  9: { hall: 2, kitchen: 2 },
  10: { hall: 3, kitchen: 2 },
  11: { hall: 4, kitchen: 3 },
  12: { hall: 5, kitchen: 4 },
  13: { hall: 5, kitchen: 4 },
  14: { hall: 3, kitchen: 2 },
  15: { hall: 2, kitchen: 2 },
  16: { hall: 2, kitchen: 2 },
  17: { hall: 3, kitchen: 3 },
  18: { hall: 5, kitchen: 4 },
  19: { hall: 6, kitchen: 5 },
  20: { hall: 6, kitchen: 5 },
  21: { hall: 5, kitchen: 4 },
  22: { hall: 4, kitchen: 3 },
  23: { hall: 2, kitchen: 2 },
}

type StaffMember = {
  name: string
  type: "社員" | "アルバイト"
  shifts: { start: string; end: string; role: "ホール" | "キッチン" }[]
  helpFromStore?: string
}

export function ShiftTimeline({
  viewMode,
  currentDate,
  shiftStatus = "preferred",
  storeId,
}: { viewMode: "daily" | "monthly"; currentDate: Date; shiftStatus?: "preferred" | "optimized" | "confirmed"; storeId?: string }) {
  const [sortField, setSortField] = useState<SortField>("start")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  // 自店スタッフ（ヘルプは storeId・日付に応じて getHelpAssignmentsForStoreAndDay で追加）
  const baseStaff: StaffMember[] = [
    // ホール - 社員5名
    { name: "鈴木一郎", type: "社員", shifts: [{ start: "10:00", end: "19:00", role: "ホール" }] },
    { name: "山田三郎", type: "社員", shifts: [{ start: "10:00", end: "11:00", role: "ホール" }, { start: "14:00", end: "22:00", role: "ホール" }] },
    { name: "佐藤四郎", type: "社員", shifts: [{ start: "10:00", end: "16:00", role: "ホール" }] },
    { name: "大倉栄一", type: "社員", shifts: [{ start: "10:00", end: "16:00", role: "ホール" }] },
    { name: "中村翔太", type: "社員", shifts: [{ start: "9:00", end: "13:00", role: "ホール" }] },
    // ホール - アルバイト
    { name: "小林陽子", type: "アルバイト", shifts: [{ start: "17:00", end: "23:00", role: "ホール" }] },
    { name: "伊藤真理", type: "アルバイト", shifts: [{ start: "10:00", end: "15:00", role: "ホール" }] },
    { name: "木村達也", type: "アルバイト", shifts: [{ start: "15:00", end: "20:00", role: "ホール" }] },
    { name: "山本浩二", type: "アルバイト", shifts: [{ start: "11:00", end: "19:00", role: "ホール" }] },
    { name: "佐々木健太", type: "アルバイト", shifts: [{ start: "14:00", end: "23:00", role: "ホール" }] },
    { name: "中島龍太", type: "アルバイト", shifts: [{ start: "18:00", end: "23:00", role: "ホール" }] },
    { name: "田中美咲", type: "アルバイト", shifts: [{ start: "12:00", end: "18:00", role: "ホール" }] },
    { name: "佐藤花子", type: "アルバイト", shifts: [{ start: "16:00", end: "22:00", role: "ホール" }] },
    { name: "高橋太郎", type: "アルバイト", shifts: [{ start: "11:00", end: "17:00", role: "ホール" }] },
    { name: "鈴木次郎", type: "アルバイト", shifts: [{ start: "13:00", end: "20:00", role: "ホール" }] },
    // キッチン - 社員5名
    { name: "田中二郎", type: "社員", shifts: [{ start: "10:00", end: "23:00", role: "キッチン" }] },
    { name: "渡辺直子", type: "社員", shifts: [{ start: "12:00", end: "16:00", role: "キッチン" }] },
    { name: "高橋美咲", type: "社員", shifts: [{ start: "11:00", end: "20:00", role: "キッチン" }] },
    { name: "加藤健一", type: "社員", shifts: [{ start: "13:00", end: "22:00", role: "キッチン" }] },
    { name: "中村翔太", type: "社員", shifts: [{ start: "14:00", end: "18:00", role: "キッチン" }] },
    // キッチン - アルバイト
    { name: "木村達也", type: "アルバイト", shifts: [{ start: "9:00", end: "14:00", role: "キッチン" }] },
    { name: "斎藤美穂", type: "アルバイト", shifts: [{ start: "16:00", end: "23:00", role: "キッチン" }] },
    { name: "松田聡子", type: "アルバイト", shifts: [{ start: "12:00", end: "21:00", role: "キッチン" }] },
    { name: "吉田美香", type: "アルバイト", shifts: [{ start: "16:00", end: "23:00", role: "キッチン" }] },
    { name: "山田花子", type: "アルバイト", shifts: [{ start: "10:00", end: "17:00", role: "キッチン" }] },
    { name: "佐々木健", type: "アルバイト", shifts: [{ start: "14:00", end: "21:00", role: "キッチン" }] },
    { name: "鈴木三郎", type: "アルバイト", shifts: [{ start: "11:00", end: "19:00", role: "キッチン" }] },
    { name: "高橋四郎", type: "アルバイト", shifts: [{ start: "13:00", end: "20:00", role: "キッチン" }] },
    { name: "田中五郎", type: "アルバイト", shifts: [{ start: "15:00", end: "22:00", role: "キッチン" }] },
    { name: "佐藤六郎", type: "アルバイト", shifts: [{ start: "12:00", end: "18:00", role: "キッチン" }] },
  ]

  // この店・この日にアサインされたヘルプ（ヘルプ一括作成の結果と同一データ）
  const helpAssignmentsForDay = useMemo(
    () => (storeId ? getHelpAssignmentsForStoreAndDay(storeId, currentDate) : []),
    [storeId, currentDate]
  )
  const helpStaffEntries: StaffMember[] = useMemo(
    () =>
      helpAssignmentsForDay.map((a) => ({
        name: a.helperName,
        type: "アルバイト" as const,
        shifts: [{ start: a.start, end: a.end, role: a.role }],
        helpFromStore: a.fromStoreName,
      })),
    [helpAssignmentsForDay]
  )
  const staff: StaffMember[] = useMemo(
    () => [...baseStaff, ...helpStaffEntries],
    [helpStaffEntries]
  )

  // ホールとキッチンのスタッフを分離
  const hallStaff = useMemo(() => {
    return staff.filter((member) => member.shifts.some((s) => s.role === "ホール"))
      .map((member) => ({
        ...member,
        shifts: member.shifts.filter((s) => s.role === "ホール"),
      }))
  }, [staff])

  const kitchenStaff = useMemo(() => {
    return staff.filter((member) => member.shifts.some((s) => s.role === "キッチン"))
      .map((member) => ({
        ...member,
        shifts: member.shifts.filter((s) => s.role === "キッチン"),
      }))
  }, [staff])

  // 社員とアルバイトを分離
  const separateByType = (staffList: typeof staff) => {
    const employees = staffList.filter((member) => member.type === "社員")
    const partTimers = staffList.filter((member) => member.type === "アルバイト")
    return { employees, partTimers }
  }

  // 各時間帯の実際の人数を計算
  const calculateActualStaff = (staffList: typeof staff, hour: number, role: "ホール" | "キッチン") => {
    let count = 0
    staffList.forEach((member) => {
      member.shifts.forEach((shift) => {
        if (shift.role === role) {
          const startHour = parseInt(shift.start.split(":")[0])
          const endHour = parseInt(shift.end.split(":")[0])
          if (hour >= startHour && hour < endHour) {
            count++
          }
        }
      })
    })
    return count
  }

  // 全体の実際の人数を計算（推奨人数との比較用）
  const calculateTotalActualStaff = (hour: number, role: "ホール" | "キッチン") => {
    return calculateActualStaff(staff, hour, role)
  }

  const sortStaff = (staffList: typeof staff) => {
    const parseTimeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number)
      return hours * 60 + (minutes || 0)
    }

    return [...staffList].sort((a, b) => {
      const aValue = sortField === "start" ? a.shifts[0]?.start : a.shifts[a.shifts.length - 1]?.end
      const bValue = sortField === "start" ? b.shifts[0]?.start : b.shifts[b.shifts.length - 1]?.end

      if (aValue === bValue) return 0
      if (!aValue) return 1
      if (!bValue) return -1

      const aMinutes = parseTimeToMinutes(aValue)
      const bMinutes = parseTimeToMinutes(bValue)

      return sortOrder === "asc" ? aMinutes - bMinutes : bMinutes - aMinutes
    })
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field === sortField) {
      return sortOrder === "asc" ? (
        <ChevronUpIcon className="w-4 h-4 ml-1" />
      ) : (
        <ChevronDownIcon className="w-4 h-4 ml-1" />
      )
    }
    return <ChevronsUpDownIcon className="w-4 h-4 ml-1 text-gray-400" />
  }


  // 時間帯別人数表示コンポーネント
  const StaffCountHeader = ({ role }: { role: "ホール" | "キッチン" }) => {
    const hours = Array.from({ length: 16 }, (_, i) => i + 8)
    const staffList = role === "ホール" ? hallStaff : kitchenStaff
    
    return (
      <tr className="bg-gray-100">
        <td colSpan={3} className="border-b border-r bg-gray-100 p-2 text-xs font-medium text-gray-600 sticky left-0 z-10">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            推奨/実際
          </div>
        </td>
        <td colSpan={16} className="p-0 border-b">
          <div className="flex" style={{ width: `${16 * 80}px` }}>
            {hours.map((hour) => {
              const recommended = recommendedStaffing[hour]?.[role === "ホール" ? "hall" : "kitchen"] || 0
              const actual = calculateActualStaff(staff, hour, role)
              const isShort = actual < recommended
              const isOver = actual > recommended
              
              return (
                <div
                  key={hour}
                  className={`flex-1 min-w-[80px] p-1 text-center text-xs border-r ${
                    isShort ? "bg-red-100 text-red-700" : isOver ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  <div className="font-bold">{actual}/{recommended}</div>
                  {isShort && <div className="text-red-600 text-[10px]">-{recommended - actual}</div>}
                  {isOver && <div className="text-yellow-600 text-[10px]">+{actual - recommended}</div>}
                </div>
              )
            })}
          </div>
        </td>
      </tr>
    )
  }

  // ロール別のテーブルレンダリング（社員とアルバイトを分けて表示）
  const renderRoleTable = (roleStaff: typeof staff, role: "ホール" | "キッチン", bgColor: string, textColor: string) => {
    const { employees, partTimers } = separateByType(roleStaff)
    const sortedEmployees = sortStaff(employees)
    const sortedPartTimers = sortStaff(partTimers)
    
    const HOUR_WIDTH = 80
    const COLS_LEFT = 3
    const stickyClass = (col: 0 | 1 | 2, bg: string) =>
      `sticky z-10 ${bg} ${col === 0 ? "left-0" : col === 1 ? "left-[120px]" : "left-[190px]"} shadow-[2px_0_4px_rgba(0,0,0,0.06)]`

    const renderStaffTable = (staffList: typeof staff, title: string, isEmployee: boolean) => {
      return (
        <div className="mb-4">
          <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded ${isEmployee ? "bg-blue-100" : "bg-purple-100"}`}>
            <Badge variant="outline" className={`${isEmployee ? "text-blue-700" : "text-purple-700"} border-current text-xs`}>
              {title}
            </Badge>
            <span className={`text-xs font-medium ${isEmployee ? "text-blue-700" : "text-purple-700"}`}>
              {staffList.length}名
            </span>
          </div>
          <div className="overflow-x-auto overflow-y-visible rounded-lg border border-gray-200">
            <table className="border-collapse table-fixed" style={{ minWidth: 120 + 70 + 70 + 16 * HOUR_WIDTH }}>
              <colgroup>
                <col style={{ width: 120, minWidth: 120 }} />
                <col style={{ width: 70, minWidth: 70 }} />
                <col style={{ width: 70, minWidth: 70 }} />
                {Array.from({ length: 16 }, (_, i) => (
                  <col key={i} style={{ width: HOUR_WIDTH, minWidth: HOUR_WIDTH }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className={`h-12 border-b border-r bg-gray-50 p-2 text-left text-sm font-medium text-gray-600 ${stickyClass(0, "bg-gray-50")}`}>
                    スタッフ
                  </th>
                  <th
                    className={`h-12 border-b border-r bg-gray-50 p-2 text-center text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 ${stickyClass(1, "bg-gray-50")}`}
                    onClick={() => handleSort("start")}
                  >
                    <div className="flex items-center justify-center">
                      始業
                      <SortIcon field="start" />
                    </div>
                  </th>
                  <th
                    className={`h-12 border-b border-r bg-gray-50 p-2 text-center text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 ${stickyClass(2, "bg-gray-50")}`}
                    onClick={() => handleSort("end")}
                  >
                    <div className="flex items-center justify-center">
                      終業
                      <SortIcon field="end" />
                    </div>
                  </th>
                  {Array.from({ length: 16 }, (_, i) => i + 8).map((hour) => (
                    <th
                      key={hour}
                      className="h-12 border-b border-r bg-gray-50 p-2 text-center text-sm font-medium text-gray-600"
                    >
                      {hour}時
                    </th>
                  ))}
                </tr>
                <tr className="bg-gray-100">
                  <td className={`h-12 border-b border-r bg-gray-100 p-2 text-xs font-medium text-gray-600 align-middle ${stickyClass(0, "bg-gray-100")}`}>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      推奨/実際
                    </div>
                  </td>
                  <td className={`h-12 border-b border-r bg-gray-100 p-2 align-middle ${stickyClass(1, "bg-gray-100")}`}>&#8203;</td>
                  <td className={`h-12 border-b border-r bg-gray-100 p-2 align-middle ${stickyClass(2, "bg-gray-100")}`}>&#8203;</td>
                  {Array.from({ length: 16 }, (_, i) => i + 8).map((hour) => {
                    const recommended = recommendedStaffing[hour]?.[role === "ホール" ? "hall" : "kitchen"] || 0
                    const totalActual = calculateTotalActualStaff(hour, role)
                    const sectionActual = calculateActualStaff(staffList, hour, role)
                    const isShort = totalActual < recommended
                    const isOver = totalActual > recommended
                    return (
                      <td
                        key={hour}
                        className={`h-12 border-b border-r p-2 text-center text-xs align-middle ${
                          isShort ? "bg-red-100 text-red-700" : isOver ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        <div className="font-bold">{sectionActual}名</div>
                        <div className="text-[10px] text-gray-600">全体:{totalActual}/{recommended}</div>
                        {isShort && <div className="text-red-600 text-[10px]">-{recommended - totalActual}</div>}
                        {isOver && <div className="text-yellow-600 text-[10px]">+{totalActual - recommended}</div>}
                      </td>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {staffList.map((member) => (
                  <tr key={`${role}-${member.name}-${member.helpFromStore ?? "own"}`} className={`border-b hover:bg-gray-50 ${member.helpFromStore ? "bg-amber-50/50" : ""}`}>
                    <td className={`h-12 border-r p-2 text-sm font-medium text-gray-900 ${stickyClass(0, member.helpFromStore ? "bg-amber-50/50" : "bg-white")}`}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{member.name}</span>
                        {member.helpFromStore && (
                          <Badge variant="outline" className="text-xs font-normal bg-amber-100 text-amber-800 border-amber-300 whitespace-nowrap">
                            ヘルプ（{member.helpFromStore}）
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className={`h-12 border-r p-2 text-sm text-center text-gray-900 ${stickyClass(1, member.helpFromStore ? "bg-amber-50/50" : "bg-white")}`}>
                      {member.shifts[0]?.start || "-"}
                    </td>
                    <td className={`h-12 border-r p-2 text-sm text-center text-gray-900 ${stickyClass(2, member.helpFromStore ? "bg-amber-50/50" : "bg-white")}`}>
                      {member.shifts[member.shifts.length - 1]?.end || "-"}
                    </td>
                    <td colSpan={16} className="h-12 p-0 relative align-top">
                      <div className="relative w-full" style={{ width: 16 * HOUR_WIDTH, height: "3rem" }}>
                        {member.shifts.map((shift, shiftIndex) => {
                          const startHour = Number.parseInt(shift.start.split(":")[0])
                          const endHour = Number.parseInt(shift.end.split(":")[0])
                          const startPercent = ((startHour - 8) / 16) * 100
                          const width = ((endHour - startHour) / 16) * 100
                          const getShiftColor = () => {
                            if (shiftStatus === "confirmed") {
                              return role === "ホール"
                                ? "bg-blue-200 text-blue-800 border-2 border-blue-500"
                                : "bg-emerald-200 text-emerald-800 border-2 border-emerald-500"
                            } else if (shiftStatus === "optimized") {
                              return role === "ホール"
                                ? "bg-blue-100 text-blue-800 border-2 border-blue-400"
                                : "bg-emerald-100 text-emerald-800 border-2 border-emerald-400"
                            } else {
                              return role === "ホール"
                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                            }
                          }
                          return (
                            <div
                              key={shiftIndex}
                              className={`absolute flex flex-col items-center justify-center rounded px-1 text-center ${getShiftColor()}`}
                              style={{
                                left: `${startPercent}%`,
                                width: `${width}%`,
                                top: "2px",
                                bottom: "2px",
                              }}
                            >
                              <div className="text-xs font-medium truncate">
                                {shift.start} - {shift.end}
                              </div>
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
    }
    
    return (
      <div className="mb-6">
        <div className={`flex items-center gap-2 mb-3 px-2 py-2 rounded-t-lg ${bgColor}`}>
          <Badge variant="outline" className={`${textColor} border-current`}>
            {role}
          </Badge>
          <span className={`text-sm font-medium ${textColor}`}>
            社員{employees.length}名 / アルバイト{partTimers.length}名
          </span>
        </div>
        {/* 社員セクション */}
        {renderStaffTable(sortedEmployees, "社員", true)}
        {/* アルバイトセクション */}
        {renderStaffTable(sortedPartTimers, "アルバイト", false)}
      </div>
    )
  }


  // 日別の労働時間、人件費、人件費率を計算（全体）
  const calculateDailyMetrics = (date: Date) => {
    const allStaff = [...hallStaff, ...kitchenStaff]
    let totalHours = 0

    allStaff.forEach((member) => {
      member.shifts.forEach((shift) => {
        const startHour = Number.parseInt(shift.start.split(":")[0])
        const endHour = Number.parseInt(shift.end.split(":")[0])
        const startMinute = Number.parseInt(shift.start.split(":")[1] || "0")
        const endMinute = Number.parseInt(shift.end.split(":")[1] || "0")
        const hours = endHour - startHour + (endMinute - startMinute) / 60
        totalHours += hours
      })
    })

    const laborCost = totalHours * HOURLY_WAGE
    const sales = generateMockSales(date)
    const actualSales = Math.floor(sales * (0.85 + Math.random() * 0.15)) // 実績は予測の85-100%
    // 人件費率は 20-30% の範囲で表示
    const laborCostRatio = 20 + ((date.getDate() + date.getMonth()) % 11)

    return { totalHours, laborCost, laborCostRatio, sales, actualSales }
  }

  // 日別の労働時間、人件費、人件費率を計算（ロール別）
  const calculateDailyMetricsByRole = (date: Date, role: "ホール" | "キッチン") => {
    const staffList = role === "ホール" ? hallStaff : kitchenStaff
    let totalHours = 0

    staffList.forEach((member) => {
      member.shifts.forEach((shift) => {
        const startHour = Number.parseInt(shift.start.split(":")[0])
        const endHour = Number.parseInt(shift.end.split(":")[0])
        const startMinute = Number.parseInt(shift.start.split(":")[1] || "0")
        const endMinute = Number.parseInt(shift.end.split(":")[1] || "0")
        const hours = endHour - startHour + (endMinute - startMinute) / 60
        totalHours += hours
      })
    })

    const laborCost = totalHours * HOURLY_WAGE
    const sales = generateMockSales(date)
    // 人件費率は 20-30% の範囲で表示
    const laborCostRatio = 20 + ((date.getDate() + date.getMonth()) % 11)

    return { totalHours, laborCost, laborCostRatio }
  }

  return viewMode === "daily" ? (
    <div className="mt-6 space-y-6">
      {/* 日別指標テーブル（統合） */}
      {(() => {
        const totalMetrics = calculateDailyMetrics(currentDate)
        const hallMetrics = calculateDailyMetricsByRole(currentDate, "ホール")
        const kitchenMetrics = calculateDailyMetricsByRole(currentDate, "キッチン")
        
        return (
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {format(currentDate, "yyyy年M月d日", { locale: ja })} 日別指標
            </h3>
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
                  <tr>
                    <td className="border p-3 text-sm font-medium text-gray-700 whitespace-nowrap">売上予測</td>
                    <td className="border p-3 text-center text-sm text-gray-900">{totalMetrics.sales.toLocaleString()}円</td>
                    <td className="border p-3 text-center text-sm text-gray-900 bg-blue-50/30">-</td>
                    <td className="border p-3 text-center text-sm text-gray-900 bg-emerald-50/30">-</td>
                  </tr>
                  <tr>
                    <td className="border p-3 text-sm font-medium text-gray-700 whitespace-nowrap">売上実績</td>
                    <td className="border p-3 text-center text-sm text-gray-900">{totalMetrics.actualSales.toLocaleString()}円</td>
                    <td className="border p-3 text-center text-sm text-gray-900 bg-blue-50/30">-</td>
                    <td className="border p-3 text-center text-sm text-gray-900 bg-emerald-50/30">-</td>
                  </tr>
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
                  <tr>
                    <td className="border p-3 text-sm font-medium text-gray-700 whitespace-nowrap">人件費率</td>
                    <td className="border p-3 text-center text-sm text-gray-900">{totalMetrics.laborCostRatio.toFixed(1)}%</td>
                    <td className="border p-3 text-center text-sm text-gray-900 bg-blue-50/30">{hallMetrics.laborCostRatio.toFixed(1)}%</td>
                    <td className="border p-3 text-center text-sm text-gray-900 bg-emerald-50/30">{kitchenMetrics.laborCostRatio.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}
      
      <div className="rounded-lg bg-white p-4 shadow-sm space-y-6">
        {/* ホールセクション */}
        {renderRoleTable(hallStaff, "ホール", "bg-blue-50", "text-blue-700")}
        
        {/* キッチンセクション */}
        {renderRoleTable(kitchenStaff, "キッチン", "bg-emerald-50", "text-emerald-700")}
      </div>
    </div>
  ) : (
    <MonthlyShiftTable storeId={storeId} />
  )
}
