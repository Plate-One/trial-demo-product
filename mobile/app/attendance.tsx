import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { calcHours, ROLE_COLORS, formatCurrency } from '@/lib/helpers'

interface Shift {
  id: string; date: string; start_time: string; end_time: string; role: string; status: string
}
interface StoreInfo { hourly_wage_hall: number; hourly_wage_kitchen: number }

export default function AttendanceScreen() {
  const { profile } = useAuth()
  const [month, setMonth] = useState(new Date())
  const [shifts, setShifts] = useState<Shift[]>([])
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.store_id) return
    supabase.from('stores').select('hourly_wage_hall, hourly_wage_kitchen')
      .eq('id', profile.store_id).maybeSingle()
      .then(({ data }) => { if (data) setStore(data as StoreInfo) })
  }, [profile?.store_id])

  const fetchShifts = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('shifts')
      .select('id, date, start_time, end_time, role, status')
      .eq('staff_id', profile.id)
      .gte('date', format(startOfMonth(month), 'yyyy-MM-dd'))
      .lte('date', format(endOfMonth(month), 'yyyy-MM-dd'))
      .order('date').order('start_time')
    setShifts((data as Shift[]) ?? [])
    setLoading(false)
  }, [profile?.id, month])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  const hourlyRate = profile?.position === 'ホール'
    ? (store?.hourly_wage_hall ?? 1150)
    : (store?.hourly_wage_kitchen ?? 1200)

  const stats = useMemo(() => {
    const totalH = shifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
    return { days: shifts.length, hours: totalH, pay: Math.round(totalH * hourlyRate) }
  }, [shifts, hourlyRate])

  return (
    <ScrollView style={styles.container}>
      {/* Month nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => setMonth(addMonths(month, -1))}>
          <Ionicons name="chevron-back" size={22} color="#9ca3af" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{format(month, 'yyyy年M月', { locale: ja })}</Text>
        <TouchableOpacity onPress={() => setMonth(addMonths(month, 1))}>
          <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
          <Text style={styles.statLabel}>出勤日数</Text>
          <Text style={styles.statVal}>{stats.days}<Text style={styles.statUnit}>日</Text></Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="time-outline" size={16} color="#22c55e" />
          <Text style={styles.statLabel}>合計勤務</Text>
          <Text style={styles.statVal}>{stats.hours.toFixed(1)}<Text style={styles.statUnit}>h</Text></Text>
        </View>
      </View>

      <View style={styles.payCard}>
        <Ionicons name="trending-up" size={16} color="#1d4ed8" />
        <Text style={styles.payLabel}>見込み給与</Text>
        <Text style={styles.payVal}>{formatCurrency(stats.pay)}</Text>
        <Text style={styles.payDetail}>時給 {formatCurrency(hourlyRate)} × {stats.hours.toFixed(1)}h</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ paddingVertical: 40 }} color="#9ca3af" />
      ) : shifts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={40} color="#d1d5db" />
          <Text style={styles.emptyText}>この月の勤務データはありません</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {shifts.map(s => {
            const d = new Date(s.date + 'T00:00')
            const hours = calcHours(s.start_time, s.end_time)
            const rc = ROLE_COLORS[s.role]
            const confirmed = s.status === 'confirmed'
            return (
              <View key={s.id} style={styles.shiftCard}>
                <View style={styles.shiftDateBox}>
                  <Text style={styles.shiftDow}>{format(d, 'E', { locale: ja })}</Text>
                  <Text style={styles.shiftDay}>{format(d, 'd')}</Text>
                </View>
                <View style={styles.shiftInfo}>
                  <Text style={styles.shiftTime}>{s.start_time.slice(0, 5)} → {s.end_time.slice(0, 5)}</Text>
                  <View style={styles.shiftMeta}>
                    <Text style={styles.shiftHours}>{hours.toFixed(1)}h</Text>
                    <View style={[styles.statusBadge, { backgroundColor: confirmed ? '#d1fae5' : '#fef3c7' }]}>
                      <Text style={[styles.statusText, { color: confirmed ? '#059669' : '#d97706' }]}>
                        {confirmed ? '確定' : s.status === 'optimized' ? '最適化済' : '下書き'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View>
                  <View style={[styles.roleBadge, { backgroundColor: rc?.bg ?? '#f3f4f6' }]}>
                    <Text style={[styles.roleText, { color: rc?.text ?? '#6b7280' }]}>{s.role}</Text>
                  </View>
                  <Text style={styles.shiftPay}>{formatCurrency(Math.round(hours * hourlyRate))}</Text>
                </View>
              </View>
            )
          })}
        </View>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  monthLabel: { fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 12 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#f3f4f6' },
  statLabel: { fontSize: 10, color: '#9ca3af' },
  statVal: { fontSize: 24, fontWeight: '700' },
  statUnit: { fontSize: 13, color: '#9ca3af' },
  payCard: { marginHorizontal: 20, backgroundColor: '#eff6ff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#bfdbfe', gap: 4 },
  payLabel: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
  payVal: { fontSize: 26, fontWeight: '700', color: '#1e40af' },
  payDetail: { fontSize: 10, color: '#60a5fa' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 12 },
  list: { paddingHorizontal: 20 },
  shiftCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6' },
  shiftDateBox: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  shiftDow: { fontSize: 10, color: '#9ca3af' },
  shiftDay: { fontSize: 15, fontWeight: '700', color: '#374151' },
  shiftInfo: { flex: 1 },
  shiftTime: { fontSize: 14, fontWeight: '600' },
  shiftMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  shiftHours: { fontSize: 11, color: '#9ca3af' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '600' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-end' },
  roleText: { fontSize: 10, fontWeight: '600' },
  shiftPay: { fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' },
})
