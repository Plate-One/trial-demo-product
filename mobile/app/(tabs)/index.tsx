import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { format, addDays, startOfWeek, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { calcHours, ROLE_COLORS, formatCurrency } from '@/lib/helpers'
import { useRouter } from 'expo-router'

interface Shift {
  id: string
  date: string
  start_time: string
  end_time: string
  role: string
  status: string
}

interface StoreInfo {
  name: string
  hourly_wage_hall: number
  hourly_wage_kitchen: number
}

export default function HomeScreen() {
  const { profile } = useAuth()
  const router = useRouter()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [now, setNow] = useState(new Date())
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!profile?.store_id) return
    supabase
      .from('stores')
      .select('name, hourly_wage_hall, hourly_wage_kitchen')
      .eq('id', profile.store_id)
      .maybeSingle()
      .then(({ data }) => { if (data) setStore(data as StoreInfo) })
  }, [profile?.store_id])

  const fetchShifts = useCallback(async () => {
    if (!profile?.id) return
    const start = format(weekStart, 'yyyy-MM-dd')
    const end = format(addDays(weekStart, 6), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('shifts')
      .select('id, date, start_time, end_time, role, status')
      .eq('staff_id', profile.id)
      .gte('date', start).lte('date', end)
      .order('date').order('start_time')
    setShifts((data as Shift[]) ?? [])
    setLoading(false)
    setRefreshing(false)
  }, [profile?.id, weekStart])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  const hourlyRate = profile?.position === 'ホール'
    ? (store?.hourly_wage_hall ?? 1150)
    : (store?.hourly_wage_kitchen ?? 1200)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayShift = shifts.find(s => s.date === todayStr)
  const nextShift = useMemo(() => {
    if (todayShift) return null
    return shifts.find(s => s.date > todayStr) ?? null
  }, [shifts, todayStr, todayShift])

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const shiftByDate = useMemo(() => {
    const m = new Map<string, Shift>()
    shifts.forEach(s => { if (!m.has(s.date)) m.set(s.date, s) })
    return m
  }, [shifts])

  const weekStats = useMemo(() => {
    const totalHours = shifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
    return { workDays: shifts.length, totalHours, estimated: Math.round(totalHours * hourlyRate) }
  }, [shifts, hourlyRate])

  const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

  if (!profile) return null

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchShifts() }} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerDate}>{format(now, 'M月d日(E)', { locale: ja })}</Text>
              <Text style={styles.headerTime}>{timeStr}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerName}>{profile.name}</Text>
              <Text style={styles.headerStore}>{store?.name ?? '読み込み中...'}</Text>
            </View>
          </View>

          {/* Today's shift */}
          {todayShift ? (
            <View style={styles.todayCard}>
              <View style={styles.todayHeader}>
                <Ionicons name="time-outline" size={16} color="#93c5fd" />
                <Text style={styles.todayLabel}>本日のシフト</Text>
                <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[todayShift.role]?.bg ?? '#f3f4f6' }]}>
                  <Text style={[styles.roleBadgeText, { color: ROLE_COLORS[todayShift.role]?.text ?? '#6b7280' }]}>
                    {todayShift.role}
                  </Text>
                </View>
              </View>
              <Text style={styles.todayTime}>
                {todayShift.start_time.slice(0, 5)} → {todayShift.end_time.slice(0, 5)}
              </Text>
              <Text style={styles.todayHours}>
                勤務時間: {calcHours(todayShift.start_time, todayShift.end_time).toFixed(1)}時間
              </Text>
            </View>
          ) : nextShift ? (
            <View style={styles.todayCard}>
              <Text style={styles.offText}>本日はお休みです</Text>
              <Text style={styles.nextShiftText}>
                次のシフト: {format(new Date(nextShift.date + 'T00:00'), 'M/d(E)', { locale: ja })}{' '}
                {nextShift.start_time.slice(0, 5)}〜{nextShift.end_time.slice(0, 5)}
              </Text>
            </View>
          ) : (
            <View style={styles.todayCard}>
              <Text style={styles.offText}>今週のシフトはまだ登録されていません</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/shifts')} activeOpacity={0.7}>
            <Ionicons name="calendar-outline" size={24} color="#2563eb" />
            <Text style={styles.actionLabel}>シフト確認</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/requests')} activeOpacity={0.7}>
            <Ionicons name="send-outline" size={24} color="#059669" />
            <Text style={styles.actionLabel}>希望提出</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/attendance')} activeOpacity={0.7}>
            <Ionicons name="time-outline" size={24} color="#ea580c" />
            <Text style={styles.actionLabel}>勤怠履歴</Text>
          </TouchableOpacity>
        </View>

        {/* Week Navigation */}
        <View style={styles.section}>
          <View style={styles.weekNav}>
            <TouchableOpacity onPress={() => setWeekStart(addDays(weekStart, -7))}>
              <Ionicons name="chevron-back" size={22} color="#9ca3af" />
            </TouchableOpacity>
            <Text style={styles.weekLabel}>
              {format(weekStart, 'M/d')}〜{format(addDays(weekStart, 6), 'M/d')}
            </Text>
            <TouchableOpacity onPress={() => setWeekStart(addDays(weekStart, 7))}>
              <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ paddingVertical: 40 }} color="#9ca3af" />
          ) : (
            <>
              {/* Week strip */}
              <View style={styles.weekStrip}>
                {weekDays.map(d => {
                  const dateStr = format(d, 'yyyy-MM-dd')
                  const shift = shiftByDate.get(dateStr)
                  const today = isToday(d)
                  const dow = d.getDay()
                  return (
                    <View key={dateStr} style={[styles.dayCell, today && styles.dayCellToday]}>
                      <Text style={[styles.dayDow, today && styles.dayDowToday, (dow === 0 || dow === 6) && !today && styles.dayWeekend]}>
                        {format(d, 'E', { locale: ja })}
                      </Text>
                      <Text style={[styles.dayNum, today && styles.dayNumToday]}>{format(d, 'd')}</Text>
                      {shift ? (
                        <Text style={[styles.dayShift, today && styles.dayShiftToday]}>{shift.start_time.slice(0, 5)}</Text>
                      ) : (
                        <Text style={[styles.dayOff, today && { color: '#93c5fd' }]}>ー</Text>
                      )}
                    </View>
                  )
                })}
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>出勤日数</Text>
                  <Text style={styles.statValue}>{weekStats.workDays}<Text style={styles.statUnit}>日</Text></Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>合計時間</Text>
                  <Text style={styles.statValue}>{weekStats.totalHours.toFixed(1)}<Text style={styles.statUnit}>h</Text></Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>見込み給与</Text>
                  <Text style={styles.statValue}>{formatCurrency(weekStats.estimated)}</Text>
                </View>
              </View>

              {/* Shift list */}
              <Text style={styles.sectionTitle}>今週のシフト詳細</Text>
              {shifts.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>この週のシフトはありません</Text>
                </View>
              ) : (
                shifts.map(s => {
                  const d = new Date(s.date + 'T00:00')
                  const hours = calcHours(s.start_time, s.end_time)
                  const roleColor = ROLE_COLORS[s.role]
                  return (
                    <View key={s.id} style={styles.shiftCard}>
                      <View style={[styles.shiftDate, isToday(d) && styles.shiftDateToday]}>
                        <Text style={[styles.shiftDow, isToday(d) && { color: '#fff' }]}>{format(d, 'E', { locale: ja })}</Text>
                        <Text style={[styles.shiftDay, isToday(d) && { color: '#fff' }]}>{format(d, 'd')}</Text>
                      </View>
                      <View style={styles.shiftInfo}>
                        <Text style={styles.shiftTime}>{s.start_time.slice(0, 5)} → {s.end_time.slice(0, 5)}</Text>
                        <Text style={styles.shiftHours}>{hours.toFixed(1)}時間</Text>
                      </View>
                      <View style={[styles.roleBadge, { backgroundColor: roleColor?.bg ?? '#f3f4f6' }]}>
                        <Text style={[styles.roleBadgeText, { color: roleColor?.text ?? '#6b7280' }]}>{s.role}</Text>
                      </View>
                    </View>
                  )
                })
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerDate: { fontSize: 12, color: '#93c5fd' },
  headerTime: { fontSize: 28, fontWeight: '700', color: '#fff' },
  headerRight: { alignItems: 'flex-end' },
  headerName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  headerStore: { fontSize: 11, color: '#93c5fd', marginTop: 2 },
  todayCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16 },
  todayHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  todayLabel: { fontSize: 13, color: '#bfdbfe', fontWeight: '500' },
  todayTime: { fontSize: 32, fontWeight: '700', color: '#fff' },
  todayHours: { fontSize: 12, color: '#93c5fd', marginTop: 4 },
  offText: { fontSize: 14, color: '#bfdbfe' },
  nextShiftText: { fontSize: 13, color: '#fff', marginTop: 4 },
  quickActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: -14 },
  actionCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#374151', marginTop: 6 },
  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  weekNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  weekLabel: { fontSize: 14, fontWeight: '700', color: '#111' },
  weekStrip: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff' },
  dayCellToday: { backgroundColor: '#2563eb' },
  dayDow: { fontSize: 10, color: '#9ca3af' },
  dayDowToday: { color: '#93c5fd' },
  dayWeekend: { color: '#ef4444' },
  dayNum: { fontSize: 15, fontWeight: '700', color: '#111', marginVertical: 2 },
  dayNumToday: { color: '#fff' },
  dayShift: { fontSize: 9, color: '#2563eb', fontWeight: '600' },
  dayShiftToday: { color: '#93c5fd' },
  dayOff: { fontSize: 9, color: '#d1d5db' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#9ca3af', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111' },
  statUnit: { fontSize: 11, color: '#9ca3af' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#9ca3af' },
  shiftCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  shiftDate: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  shiftDateToday: { backgroundColor: '#2563eb' },
  shiftDow: { fontSize: 10, color: '#9ca3af' },
  shiftDay: { fontSize: 15, fontWeight: '700', color: '#111' },
  shiftInfo: { flex: 1 },
  shiftTime: { fontSize: 14, fontWeight: '600', color: '#111' },
  shiftHours: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleBadgeText: { fontSize: 10, fontWeight: '600' },
})
