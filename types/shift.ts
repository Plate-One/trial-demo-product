export interface ShiftMetrics {
  modelShift: number
  actualStaff: number
  difference: number
  kitchen: number
  hall: number
}

export interface StaffMember {
  id: string
  name: string
  shifts: {
    start: string
    end: string
    role: "hall" | "kitchen"
  }[]
}

export interface ShiftData {
  date: string
  metrics: Record<string, ShiftMetrics>
  staff: StaffMember[]
  totals: {
    staffCost: number
    staffCostHourly: number
    staffCostMonthly: number
    revenue: number
  }
}
