"use client"

import { useState, useMemo } from "react"
import { ChevronUpIcon, ChevronDownIcon, ChevronsUpDownIcon } from "lucide-react"
import { format, addDays, startOfWeek } from "date-fns"
import { ja } from "date-fns/locale"
import { MonthlyShiftTable } from "@/components/monthly-shift-table"

type SortField = "start" | "end"
type SortOrder = "asc" | "desc"

export function ShiftTimeline({
  viewMode,
  currentDate,
}: { viewMode: "daily" | "weekly" | "monthly"; currentDate: Date }) {
  const [sortField, setSortField] = useState<SortField>("start")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  const staff = [
    {
      name: "鈴木一郎",
      shifts: [{ start: "10:00", end: "19:00", role: "ホール" }],
    },
    {
      name: "田中二郎",
      shifts: [{ start: "10:00", end: "23:00", role: "キッチン" }],
    },
    {
      name: "山田三郎",
      shifts: [
        { start: "10:00", end: "11:00", role: "ホール" },
        { start: "14:00", end: "22:00", role: "ホール" },
      ],
    },
    {
      name: "佐藤四郎",
      shifts: [{ start: "10:00", end: "16:00", role: "ホール" }],
    },
    {
      name: "渡辺直子",
      shifts: [{ start: "12:00", end: "16:00", role: "キッチン" }],
    },
    {
      name: "大倉栄一",
      shifts: [{ start: "10:00", end: "16:00", role: "ホール" }],
    },
    {
      name: "高橋美咲",
      shifts: [{ start: "11:00", end: "20:00", role: "キッチン" }],
    },
    {
      name: "中村翔太",
      shifts: [
        { start: "9:00", end: "13:00", role: "ホール" },
        { start: "14:00", end: "18:00", role: "キッチン" },
      ],
    },
    {
      name: "小林陽子",
      shifts: [{ start: "17:00", end: "23:00", role: "ホール" }],
    },
    {
      name: "加藤健一",
      shifts: [{ start: "13:00", end: "22:00", role: "キッチン" }],
    },
    {
      name: "伊藤真理",
      shifts: [{ start: "10:00", end: "15:00", role: "ホール" }],
    },
    {
      name: "木村達也",
      shifts: [
        { start: "9:00", end: "14:00", role: "キッチン" },
        { start: "15:00", end: "20:00", role: "ホール" },
      ],
    },
    {
      name: "斎藤美穂",
      shifts: [{ start: "16:00", end: "23:00", role: "キッチン" }],
    },
    {
      name: "山本浩二",
      shifts: [{ start: "11:00", end: "19:00", role: "ホール" }],
    },
    {
      name: "松田聡子",
      shifts: [{ start: "12:00", end: "21:00", role: "キッチン" }],
    },
    {
      name: "佐々木健太",
      shifts: [{ start: "14:00", end: "23:00", role: "ホール" }],
    },
    {
      name: "吉田美香",
      shifts: [{ start: "16:00", end: "23:00", role: "キッチン" }],
    },
    {
      name: "中島龍太",
      shifts: [{ start: "18:00", end: "23:00", role: "ホール" }],
    },
  ]

  const sortedStaff = useMemo(() => {
    const parseTimeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number)
      return hours * 60 + (minutes || 0)
    }

    return [...staff].sort((a, b) => {
      const aValue = sortField === "start" ? a.shifts[0]?.start : a.shifts[a.shifts.length - 1]?.end
      const bValue = sortField === "start" ? b.shifts[0]?.start : b.shifts[b.shifts.length - 1]?.end

      if (aValue === bValue) return 0
      if (!aValue) return 1
      if (!bValue) return -1

      const aMinutes = parseTimeToMinutes(aValue)
      const bMinutes = parseTimeToMinutes(bValue)

      return sortOrder === "asc" ? aMinutes - bMinutes : bMinutes - aMinutes
    })
  }, [staff, sortField, sortOrder])

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

  const generateWeeklyData = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startDate, i)
      return {
        date: format(date, "MM/dd (E)", { locale: ja }),
        shifts: staff.map((member) => ({
          ...member,
          shifts: member.shifts.map((shift) => ({
            ...shift,
            start: `${shift.start}`,
            end: `${shift.end}`,
          })),
          // Randomly assign some off days
          isOff: Math.random() < 0.2,
        })),
      }
    })
  }

  const calculateTotalHours = (memberShifts: any[]) => {
    return memberShifts.reduce((total, day) => {
      if (day.isOff) return total
      return (
        total +
        day.shifts.reduce((dayTotal, shift) => {
          const [startHour, startMinute] = shift.start.split(":").map(Number)
          const [endHour, endMinute] = shift.end.split(":").map(Number)
          return dayTotal + (endHour - startHour) + (endMinute - startMinute) / 60
        }, 0)
      )
    }, 0)
  }

  const weeklyData = useMemo(() => generateWeeklyData(), [currentDate, staff])

  const renderWeeklyView = () => (
    <div className="mt-6 rounded-lg bg-white p-4 shadow-sm overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-3 bg-gray-50 text-left text-sm font-medium text-gray-600">スタッフ</th>
            {weeklyData.map((day) => (
              <th key={day.date} className="border p-3 bg-gray-50 text-left text-sm font-medium text-gray-600">
                {day.date}
              </th>
            ))}
            <th className="border p-3 bg-gray-50 text-left text-sm font-medium text-gray-600">週合計時間</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => {
            const memberShifts = weeklyData.map((day) => day.shifts.find((s) => s.name === member.name))
            const totalHours = calculateTotalHours(memberShifts)
            return (
              <tr key={member.name}>
                <td className="border p-3 text-sm text-gray-900">{member.name}</td>
                {memberShifts.map((shift, index) => (
                  <td key={`${member.name}-${weeklyData[index].date}`} className="border p-3">
                    {shift.isOff ? (
                      <div className="text-xs text-gray-500">休み</div>
                    ) : (
                      shift.shifts.map((s, i) => (
                        <div
                          key={i}
                          className={`mb-1 p-1 rounded text-xs ${
                            s.role === "ホール" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          <div className="font-medium">
                            {s.start} - {s.end}
                          </div>
                          <div>{s.role}</div>
                        </div>
                      ))
                    )}
                  </td>
                ))}
                <td className="border p-3 text-center text-sm text-gray-900">{totalHours.toFixed(1)}時間</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return viewMode === "daily" ? (
    <div className="mt-6 rounded-lg bg-white p-4 shadow-sm">
      <div className="overflow-x-auto">
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="flex">
            <div className="sticky left-0 z-10 bg-white">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="h-14 border-b border-r bg-gray-50 p-3 text-left text-sm font-medium text-gray-600 min-w-[120px]">
                      スタッフ
                    </th>
                    <th
                      className="h-14 border-b border-r bg-gray-50 p-3 text-center text-sm font-medium text-gray-600 min-w-[80px] cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("start")}
                    >
                      <div className="flex items-center justify-center">
                        始業
                        <SortIcon field="start" />
                      </div>
                    </th>
                    <th
                      className="h-14 border-b border-r bg-gray-50 p-3 text-center text-sm font-medium text-gray-600 min-w-[80px] cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("end")}
                    >
                      <div className="flex items-center justify-center">
                        終業
                        <SortIcon field="end" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStaff.map((member) => (
                    <tr key={member.name} className="border-b">
                      <td className="h-14 border-r bg-white p-3 text-sm font-medium text-gray-900 min-w-[120px]">
                        {member.name}
                      </td>
                      <td className="h-14 border-r bg-white p-3 text-sm text-center text-gray-900 min-w-[80px]">
                        {member.shifts[0]?.start || "-"}
                      </td>
                      <td className="h-14 border-r bg-white p-3 text-sm text-center text-gray-900 min-w-[80px]">
                        {member.shifts[member.shifts.length - 1]?.end || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto">
              <table className="border-collapse">
                <thead>
                  <tr>
                    {Array.from({ length: 16 }, (_, i) => i + 8).map((hour) => (
                      <th
                        key={hour}
                        className="h-14 border-b border-r bg-gray-50 p-3 text-center text-sm font-medium text-gray-600 min-w-[80px]"
                      >
                        {hour}時
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedStaff.map((member) => (
                    <tr key={member.name} className="border-b">
                      <td colSpan={16} className="h-14 p-0 relative">
                        <div className="relative h-full" style={{ width: `${16 * 80}px` }}>
                          {member.shifts.map((shift, shiftIndex) => {
                            const startHour = Number.parseInt(shift.start.split(":")[0])
                            const endHour = Number.parseInt(shift.end.split(":")[0])
                            const startPercent = ((startHour - 8) / 16) * 100
                            const width = ((endHour - startHour) / 16) * 100

                            return (
                              <div
                                key={shiftIndex}
                                className={`absolute flex items-center justify-center rounded px-1 text-center ${
                                  shift.role === "ホール"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
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
                                <div className="text-xs truncate">{shift.role}</div>
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
        </div>
      </div>
    </div>
  ) : viewMode === "weekly" ? (
    renderWeeklyView()
  ) : (
    <MonthlyShiftTable />
  )
}
