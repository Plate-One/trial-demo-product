import type React from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Shift {
  id: string
  start: number
  end: number
  count: number
}

interface DayShiftCardProps {
  day: {
    date: Date
    staffRequirements: {
      ホール: Shift[]
      キッチン: Shift[]
    }
  }
  onStaffChange: (position: string, shifts: Shift[]) => void
}

const ShiftBlock: React.FC<{
  shift: Shift
  position: string
  onCountChange: (newCount: number) => void
  onTimeChange: (start: number, end: number) => void
  onDelete: () => void
}> = ({ shift, position, onCountChange, onTimeChange, onDelete }) => {
  const timeOptions = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div
      className={`p-2 mb-2 text-sm rounded ${
        position === "ホール" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
      }`}
    >
      <div className="flex flex-col mb-2">
        <Select
          value={shift.start.toString()}
          onValueChange={(value) => onTimeChange(Number.parseInt(value), shift.end)}
        >
          <SelectTrigger className="w-full mb-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((time) => (
              <SelectItem key={time} value={time.toString()}>
                {time}:00
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-center mb-1">-</div>
        <Select
          value={shift.end.toString()}
          onValueChange={(value) => onTimeChange(shift.start, Number.parseInt(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((time) => (
              <SelectItem key={time} value={time.toString()}>
                {time}:00
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-between items-center">
        <Button size="sm" variant="outline" onClick={() => onCountChange(shift.count - 1)} disabled={shift.count <= 1}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="font-semibold">{shift.count}人</span>
        <Button size="sm" variant="outline" onClick={() => onCountChange(shift.count + 1)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button size="sm" variant="ghost" onClick={onDelete} className="w-full mt-2">
        削除
      </Button>
    </div>
  )
}

export const DayShiftCard: React.FC<DayShiftCardProps> = ({ day, onStaffChange }) => {
  const handleCountChange = (position: string, shiftId: string, newCount: number) => {
    const newShifts = day.staffRequirements[position].map((shift) =>
      shift.id === shiftId ? { ...shift, count: newCount } : shift,
    )
    onStaffChange(position, newShifts)
  }

  const handleTimeChange = (position: string, shiftId: string, start: number, end: number) => {
    const newShifts = day.staffRequirements[position].map((shift) =>
      shift.id === shiftId ? { ...shift, start, end } : shift,
    )
    onStaffChange(position, newShifts)
  }

  const handleAddShift = (position: string) => {
    const newShift: Shift = {
      id: Date.now().toString(),
      start: 9,
      end: 17,
      count: 1,
    }
    const newShifts = [...day.staffRequirements[position], newShift]
    onStaffChange(position, newShifts)
  }

  const handleDeleteShift = (position: string, shiftId: string) => {
    const newShifts = day.staffRequirements[position].filter((shift) => shift.id !== shiftId)
    onStaffChange(position, newShifts)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{format(day.date, "M/d (E)", { locale: ja })}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">ホール</h4>
            {day.staffRequirements.ホール.map((shift) => (
              <ShiftBlock
                key={shift.id}
                shift={shift}
                position="ホール"
                onCountChange={(newCount) => handleCountChange("ホール", shift.id, newCount)}
                onTimeChange={(start, end) => handleTimeChange("ホール", shift.id, start, end)}
                onDelete={() => handleDeleteShift("ホール", shift.id)}
              />
            ))}
            <Button size="sm" variant="outline" onClick={() => handleAddShift("ホール")} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              シフトを追加
            </Button>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1">キッチン</h4>
            {day.staffRequirements.キッチン.map((shift) => (
              <ShiftBlock
                key={shift.id}
                shift={shift}
                position="キッチン"
                onCountChange={(newCount) => handleCountChange("キッチン", shift.id, newCount)}
                onTimeChange={(start, end) => handleTimeChange("キッチン", shift.id, start, end)}
                onDelete={() => handleDeleteShift("キッチン", shift.id)}
              />
            ))}
            <Button size="sm" variant="outline" onClick={() => handleAddShift("キッチン")} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              シフトを追加
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
