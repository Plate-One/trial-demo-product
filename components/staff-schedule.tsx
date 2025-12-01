"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const staffSchedule = [
  { time: "10:00-14:00", hall: 3, kitchen: 2 },
  { time: "14:00-18:00", hall: 4, kitchen: 3 },
  { time: "18:00-22:00", hall: 5, kitchen: 4 },
  { time: "22:00-閉店", hall: 2, kitchen: 1 },
]

export default function StaffSchedule() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>時間帯</TableHead>
          <TableHead className="text-right">ホール</TableHead>
          <TableHead className="text-right">キッチン</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staffSchedule.map((shift) => (
          <TableRow key={shift.time}>
            <TableCell>{shift.time}</TableCell>
            <TableCell className="text-right">{shift.hall}名</TableCell>
            <TableCell className="text-right">{shift.kitchen}名</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
