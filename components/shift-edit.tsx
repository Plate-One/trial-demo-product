"use client"

import type React from "react"
import { useState, useCallback, useEffect, useMemo } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { MonthlyShiftTable } from "@/components/monthly-shift-table"
import { useShifts } from "@/lib/hooks/use-shifts"

interface Shift {
  id: string
  start: string
  end: string
  role: "ホール" | "キッチン"
}

interface StaffMember {
  id: string
  name: string
  shifts: Shift[]
}

const HOUR_WIDTH = 60 // Width of one hour in pixels
const START_HOUR = 8 // 8:00 AM
const END_HOUR = 22 // 10:00 PM
const TOTAL_HOURS = END_HOUR - START_HOUR

interface XYCoord {
  x: number
  y: number
}

const ShiftBlock: React.FC<{
  shift: Shift
  index: number
  moveShift: (dragIndex: number, hoverIndex: number) => void
  updateShift: (id: string, newShift: Partial<Shift>) => void
  deleteShift: (id: string) => void
  shiftStatus?: "preferred" | "optimized" | "confirmed"
}> = ({ shift, index, moveShift, updateShift, deleteShift, shiftStatus = "preferred" }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "SHIFT",
    item: { index, shift },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: "SHIFT",
    hover(item: { index: number; shift: Shift }, monitor) {
      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) {
        return
      }

      moveShift(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editedShift, setEditedShift] = useState(shift)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    updateShift(shift.id, editedShift)
    setIsEditing(false)
  }

  const handleDelete = () => {
    deleteShift(shift.id)
  }

  const parseTime = (timeString: string): number => {
    const [hours, minutes] = timeString.split(":").map(Number)
    return hours * 60 + minutes
  }

  const startMinutes = parseTime(shift.start)
  const endMinutes = parseTime(shift.end)

  const startPosition = (startMinutes / 60 - START_HOUR) * HOUR_WIDTH
  const width = ((endMinutes - startMinutes) / 60) * HOUR_WIDTH

  const getShiftColor = () => {
    if (shiftStatus === "confirmed") {
      return shift.role === "ホール"
        ? "bg-blue-200 text-blue-800 border-2 border-blue-500"
        : "bg-emerald-200 text-emerald-800 border-2 border-emerald-500"
    } else if (shiftStatus === "optimized") {
      return shift.role === "ホール"
        ? "bg-blue-100 text-blue-800 border-2 border-blue-400"
        : "bg-emerald-100 text-emerald-800 border-2 border-emerald-400"
    } else {
      return shift.role === "ホール"
        ? "bg-blue-100 text-blue-700 border border-blue-300"
        : "bg-emerald-100 text-emerald-700 border border-emerald-300"
    }
  }

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`absolute rounded px-1 py-0.5 text-center cursor-move ${getShiftColor()} ${isDragging ? "opacity-50" : ""}`}
      style={{
        left: `${startPosition}px`,
        width: `${width}px`,
        height: "30px",
      }}
      onClick={handleEdit}
    >
      <div className="text-xs font-medium whitespace-nowrap overflow-hidden">
        {shift.start} - {shift.end}
      </div>
      <div className="text-xs whitespace-nowrap overflow-hidden">{shift.role}</div>
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>シフト編集</DialogTitle>
            <DialogDescription>シフトの詳細を編集してください。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="start" className="text-right">
                開始時間
              </label>
              <Input
                id="start"
                type="time"
                value={editedShift.start}
                onChange={(e) => setEditedShift({ ...editedShift, start: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="end" className="text-right">
                終了時間
              </label>
              <Input
                id="end"
                type="time"
                value={editedShift.end}
                onChange={(e) => setEditedShift({ ...editedShift, end: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="role" className="text-right">
                役割
              </label>
              <Select
                value={editedShift.role}
                onValueChange={(value) => setEditedShift({ ...editedShift, role: value as "ホール" | "キッチン" })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="役割を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ホール">ホール</SelectItem>
                  <SelectItem value="キッチン">キッチン</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="destructive" onClick={handleDelete}>
              削除
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const StaffRow: React.FC<{
  staff: StaffMember
  updateStaff: (id: string, newStaff: Partial<StaffMember>) => void
  shiftStatus?: "preferred" | "optimized" | "confirmed"
}> = ({ staff, updateStaff, shiftStatus = "preferred" }) => {
  const moveShift = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      if (!staff || !staff.shifts) return
      const newShifts = [...staff.shifts]
      const dragShift = newShifts[dragIndex]
      newShifts.splice(dragIndex, 1)
      newShifts.splice(hoverIndex, 0, dragShift)
      updateStaff(staff.id, { shifts: newShifts })
    },
    [staff, updateStaff],
  )

  const updateShift = useCallback(
    (id: string, newShift: Partial<Shift>) => {
      if (!staff || !staff.shifts) return
      const newShifts = staff.shifts.map((shift) => (shift.id === id ? { ...shift, ...newShift } : shift))
      updateStaff(staff.id, { shifts: newShifts })
    },
    [staff, updateStaff],
  )

  const deleteShift = useCallback(
    (id: string) => {
      if (!staff || !staff.shifts) return
      const newShifts = staff.shifts.filter((shift) => shift.id !== id)
      updateStaff(staff.id, { shifts: newShifts })
    },
    [staff, updateStaff],
  )

  const addShift = () => {
    if (!staff) return
    const newShift: Shift = {
      id: Date.now().toString(),
      start: "12:00",
      end: "18:00",
      role: "ホール",
    }
    updateStaff(staff.id, { shifts: [...(staff.shifts || []), newShift] })
  }

  if (!staff) return null

  return (
    <tr className="border-b">
      <td className="sticky left-0 z-10 border-r bg-white p-3 text-sm font-medium text-gray-900">{staff.name}</td>
      <td colSpan={14} className="p-0">
        <div className="relative h-14" style={{ width: `${TOTAL_HOURS * HOUR_WIDTH}px` }}>
          {staff.shifts &&
            staff.shifts.map((shift, index) => (
              <ShiftBlock
                key={shift.id}
                shift={shift}
                index={index}
                moveShift={moveShift}
                updateShift={updateShift}
                deleteShift={deleteShift}
                shiftStatus={shiftStatus}
              />
            ))}
          <Button variant="outline" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={addShift}>
            +
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function ShiftEdit({
  viewMode,
  currentDate,
  shiftStatus = "preferred",
  storeId,
}: {
  viewMode: "daily" | "monthly"
  currentDate: Date
  shiftStatus?: "preferred" | "optimized" | "confirmed"
  storeId?: string
}) {
  const dateStr = format(currentDate, "yyyy-MM-dd")
  const { shifts: dbShifts, loading } = useShifts(storeId || "", dateStr)

  // Convert DB shifts to StaffMember[] format
  const dbStaffMembers = useMemo(() => {
    if (!dbShifts || dbShifts.length === 0) return []

    const staffMap = new Map<string, StaffMember>()

    dbShifts.forEach((shift) => {
      const staffId = shift.staff_id || shift.id
      const staffName = shift.staff?.name || "不明"
      const role = (shift.staff?.position === "キッチン" ? "キッチン" : "ホール") as "ホール" | "キッチン"

      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, {
          id: staffId,
          name: staffName,
          shifts: [],
        })
      }

      const startTime = shift.start_time ? shift.start_time.slice(0, 5) : "10:00"
      const endTime = shift.end_time ? shift.end_time.slice(0, 5) : "19:00"

      staffMap.get(staffId)!.shifts.push({
        id: shift.id,
        start: startTime,
        end: endTime,
        role,
      })
    })

    return Array.from(staffMap.values())
  }, [dbShifts])

  const [staff, setStaff] = useState<StaffMember[]>([])

  // Sync DB data into local state for editing
  useEffect(() => {
    if (dbStaffMembers.length > 0) {
      setStaff(dbStaffMembers)
    }
  }, [dbStaffMembers])

  const updateStaff = useCallback((id: string, newStaff: Partial<StaffMember>) => {
    setStaff((prevStaff) =>
      prevStaff.map((member) => (member && member.id === id ? { ...member, ...newStaff } : member)),
    )
  }, [])

  return viewMode === "daily" ? (
    <DndProvider backend={HTML5Backend}>
      <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">シフト編集</h2>
        {staff.length === 0 && !loading ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">この日のシフトデータがありません</p>
            <p className="text-sm">シフト作成からシフトを生成してください</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 border-b border-r bg-gray-50 p-3 text-left text-sm font-medium text-gray-600 min-w-[120px]">
                      スタッフ
                    </th>
                    {Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR).map((hour) => (
                      <th
                        key={hour}
                        className="border-b border-r bg-gray-50 p-3 text-center text-sm font-medium text-gray-600"
                        style={{ width: `${HOUR_WIDTH}px` }}
                      >
                        {hour}時
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => member && <StaffRow key={member.id} staff={member} updateStaff={updateStaff} shiftStatus={shiftStatus} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  ) : (
    <MonthlyShiftTable storeId={storeId} />
  )
}
