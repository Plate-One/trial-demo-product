import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, addDays, startOfMonth, endOfMonth, addMonths, isSameMonth, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { startOfWeek } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { calcHours, ROLE_COLORS } from '@/lib/helpers'

interface Shift {
  id: string; date: string; start_time: string; end_time: string; role: string; status: string
}

interface Coworker {
  start_time: string; end_time: string; role: string
  staff: { name: string; position: string } | null
}

export default function ShiftsScreen() {
  const { profile } = useAuth()
  const [month, setMonth] = useState(new Date())
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [coworkers, setCoworkers] = useState<Coworker[]>([])
  const [cwLoading, setCwLoading] = useState(false)

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })

  const fetchShifts = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('shifts')
      .select('id, date, start_time, end_time, role, status')
      .eq('staff_id', profile.id)
      .gte('date', format(calStart, 'yyyy-MM-dd'))
      .lte('date', format(addDays(monthEnd, 7), 'yyyy-MM-dd'))
      .order('date').order('start_time')
    setShifts((data as Shift[]) ?? [])
    setLoading(false)
  }, [profile?.id, month])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  useEffect(() => {
    if (!selected || !profile?.store_id || !profile?.id) { setCoworkers([]); return }
    setCwLoading(true)
    supabase
      .from('shifts')
      .select('start_time, end_time, role, staff:staff(name, position)')
      .eq('store_id', profile.store_id)
      .eq('date', selected)
      .neq('staff_id', profile.id)
      .order('start_time')
      .then(({ data }) => { setCoworkers((data as Coworker[]) ?? []); setCwLoading(false) })
  }, [selected, profile?.store_id, profile?.id])

  const shiftMap = useMemo(() => {
    const m = new Map<string, Shift>()
    shifts.forEach(s => { if (!m.has(s.date)) m.set(s.date, s) })
    return m
  }, [shifts])

  const weeks = useMemo(() => {
    const result: Date[][] = []
    let d = calStart
    while (d <= monthEnd || result.length < 5) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) { week.push(d); d = addDays(d, 1) }
      result.push(week)
      if (!isSameMonth(week[0], month) && week[0] > monthEnd) break
    }
    return result
  }, [month])

  const monthStats = useMemo(() => {
    const ms = shifts.filter(s => isSameMonth(new Date(s.date + 'T00:00'), month))
    return { days: ms.length, hours: ms.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0) }
  }, [shifts, month])

  const selectedShift = selected ? shiftMap.get(selected) : null

  return (
    <ScrollView style={styles.container}>
      {/* Month nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => { setMonth(addMonths(month, -1)); setSelected(null) }}>
          <Ionicons name="chevron-back" size={22} color="#9ca3af" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{format(month, 'yyyy年M月', { locale: ja })}</Text>
        <TouchableOpacity onPress={() => { setMonth(addMonths(month, 1)); setSelected(null) }}>
          <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>出勤日数</Text>
          <Text style={styles.statVal}>{monthStats.days}<Text style={styles.statUnit}>日</Text></Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>合計時間</Text>
          <Text style={styles.statVal}>{monthStats.hours.toFixed(1)}<Text style={styles.statUnit}>h</Text></Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ paddingVertical: 60 }} color="#9ca3af" />
      ) : (
        <>
          {/* Calendar */}
          <View style={styles.calendar}>
            <View style={styles.dowRow}>
              {['月', '火', '水', '木', '金', '土', '日'].map((d, i) => (
                <Text key={d} style={[styles.dowText, i === 5 && { color: '#3b82f6' }, i === 6 && { color: '#ef4444' }]}>{d}</Text>
              ))}
            </View>
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map(day => {
                  const ds = format(day, 'yyyy-MM-dd')
                  const shift = shiftMap.get(ds)
                  const td = isToday(day)
                  const cm = isSameMonth(day, month)
                  const sel = selected === ds
                  const dow = day.getDay()
                  return (
                    <TouchableOpacity
                      key={ds}
                      style={[styles.calCell, sel && styles.calCellSel]}
                      onPress={() => setSelected(sel ? null : ds)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.calNum, td && styles.calNumToday]}>
                        <Text style={[
                          styles.calNumText,
                          td && { color: '#fff' },
                          !cm && { opacity: 0.3 },
                          !td && dow === 0 && { color: '#ef4444' },
                          !td && dow === 6 && { color: '#3b82f6' },
                        ]}>{format(day, 'd')}</Text>
                      </View>
                      {shift && (
                        <View style={[styles.shiftDot, { backgroundColor: ROLE_COLORS[shift.role]?.text ?? '#9ca3af' }]} />
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            ))}
          </View>

          {/* Detail */}
          {selected && (
            <View style={styles.detailCard}>
              <Text style={styles.detailDate}>
                {format(new Date(selected + 'T00:00'), 'M月d日(E)', { locale: ja })}
              </Text>
              {selectedShift ? (
                <View style={styles.detailShift}>
                  <Text style={styles.detailTime}>
                    {selectedShift.start_time.slice(0, 5)} → {selectedShift.end_time.slice(0, 5)}
                  </Text>
                  <Text style={styles.detailHours}>
                    {calcHours(selectedShift.start_time, selectedShift.end_time).toFixed(1)}時間 / {selectedShift.role}
                  </Text>
                </View>
              ) : (
                <Text style={styles.noShift}>この日のシフトはありません</Text>
              )}

              <View style={styles.cwSection}>
                <Text style={styles.cwTitle}>同日のスタッフ</Text>
                {cwLoading ? (
                  <ActivityIndicator size="small" color="#9ca3af" />
                ) : coworkers.length === 0 ? (
                  <Text style={styles.cwEmpty}>データなし</Text>
                ) : coworkers.map((c, i) => (
                  <View key={i} style={styles.cwRow}>
                    <Text style={styles.cwName}>{c.staff?.name ?? '不明'}</Text>
                    <Text style={styles.cwTime}>{c.start_time.slice(0, 5)}〜{c.end_time.slice(0, 5)} / {c.role}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  monthLabel: { fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  statLabel: { fontSize: 10, color: '#9ca3af' },
  statVal: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  statUnit: { fontSize: 12, color: '#9ca3af' },
  calendar: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6' },
  dowRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dowText: { flex: 1, textAlign: 'center', paddingVertical: 8, fontSize: 11, fontWeight: '500', color: '#9ca3af' },
  weekRow: { flexDirection: 'row' },
  calCell: { flex: 1, alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f9fafb', borderRightWidth: 0.5, borderRightColor: '#f9fafb' },
  calCellSel: { backgroundColor: '#eff6ff' },
  calNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  calNumToday: { backgroundColor: '#2563eb' },
  calNumText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  shiftDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  detailCard: { margin: 20, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  detailDate: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  detailShift: { marginBottom: 12 },
  detailTime: { fontSize: 20, fontWeight: '700' },
  detailHours: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  noShift: { fontSize: 13, color: '#9ca3af', marginBottom: 12 },
  cwSection: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  cwTitle: { fontSize: 12, fontWeight: '600', color: '#9ca3af', marginBottom: 8 },
  cwEmpty: { fontSize: 12, color: '#d1d5db' },
  cwRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  cwName: { fontSize: 13, color: '#374151' },
  cwTime: { fontSize: 12, color: '#9ca3af' },
})
