import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, addDays, startOfMonth, endOfMonth, addMonths, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

type DayChoice = 'available' | 'off' | null
interface DayEntry { choice: DayChoice; start: string; end: string }
interface ShiftPeriod { id: string; period_start: string; period_end: string; status: string }

export default function RequestsScreen() {
  const { profile } = useAuth()
  const [month, setMonth] = useState(() => addMonths(new Date(), 1))
  const [entries, setEntries] = useState<Record<string, DayEntry>>({})
  const [period, setPeriod] = useState<ShiftPeriod | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)

  const fetchPeriod = useCallback(async () => {
    if (!profile?.store_id || !profile?.id) return
    setLoading(true)
    const start = format(monthStart, 'yyyy-MM-dd')
    const end = format(monthEnd, 'yyyy-MM-dd')

    const { data: p } = await supabase
      .from('shift_periods')
      .select('id, period_start, period_end, status')
      .eq('store_id', profile.store_id)
      .lte('period_start', end)
      .gte('period_end', start)
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle()

    setPeriod(p as ShiftPeriod | null)

    if (p) {
      const { data: reqs } = await supabase
        .from('shift_requests')
        .select('date, request_type, preferred_start_time, preferred_end_time')
        .eq('shift_period_id', (p as ShiftPeriod).id)
        .eq('staff_id', profile.id)

      if (reqs && reqs.length > 0) {
        const e: Record<string, DayEntry> = {}
        ;(reqs as any[]).forEach(r => {
          e[r.date] = {
            choice: r.request_type === 'holiday' ? 'off' : 'available',
            start: r.preferred_start_time?.slice(0, 5) ?? '10:00',
            end: r.preferred_end_time?.slice(0, 5) ?? '18:00',
          }
        })
        setEntries(e)
      }
    }
    setLoading(false)
  }, [profile?.store_id, profile?.id, month])

  useEffect(() => { fetchPeriod() }, [fetchPeriod])

  const toggleDay = (dateStr: string) => {
    setEntries(prev => {
      const cur = prev[dateStr]?.choice
      let next: DayChoice
      if (!cur) next = 'available'
      else if (cur === 'available') next = 'off'
      else next = null

      if (!next) {
        const copy = { ...prev }
        delete copy[dateStr]
        return copy
      }
      return { ...prev, [dateStr]: { choice: next, start: prev[dateStr]?.start ?? '10:00', end: prev[dateStr]?.end ?? '18:00' } }
    })
    setSubmitted(false)
  }

  const handleSubmit = async () => {
    if (!period || !profile) return
    setSubmitting(true)
    try {
      await supabase
        .from('shift_requests')
        .delete()
        .eq('shift_period_id', period.id)
        .eq('staff_id', profile.id)

      const rows = Object.entries(entries).map(([date, e]) => ({
        shift_period_id: period.id,
        staff_id: profile.id,
        store_id: profile.store_id,
        date,
        request_type: e.choice === 'off' ? 'holiday' : 'available',
        preferred_start_time: e.choice === 'available' ? e.start + ':00' : null,
        preferred_end_time: e.choice === 'available' ? e.end + ':00' : null,
      }))

      if (rows.length > 0) {
        await supabase.from('shift_requests').insert(rows)
      }
      setSubmitted(true)
      Alert.alert('完了', '希望シフトを提出しました')
    } catch (e) {
      Alert.alert('エラー', '提出に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const days: Date[] = []
  let d = monthStart
  while (d <= monthEnd) { days.push(d); d = addDays(d, 1) }

  const availCount = Object.values(entries).filter(e => e.choice === 'available').length
  const offCount = Object.values(entries).filter(e => e.choice === 'off').length

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.hint}>日付をタップして希望を入力してください</Text>

        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => { setMonth(addMonths(month, -1)); setEntries({}); setSubmitted(false) }}>
            <Ionicons name="chevron-back" size={22} color="#9ca3af" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{format(month, 'yyyy年M月', { locale: ja })}</Text>
          <TouchableOpacity onPress={() => { setMonth(addMonths(month, 1)); setEntries({}); setSubmitted(false) }}>
            <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.legendText}>出勤可能</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>休み希望</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#d1d5db' }]} />
            <Text style={styles.legendText}>未入力</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <Text style={[styles.summaryLabel, { color: '#16a34a' }]}>出勤可能</Text>
            <Text style={[styles.summaryVal, { color: '#15803d' }]}>{availCount}<Text style={styles.summaryUnit}>日</Text></Text>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Text style={[styles.summaryLabel, { color: '#dc2626' }]}>休み希望</Text>
            <Text style={[styles.summaryVal, { color: '#b91c1c' }]}>{offCount}<Text style={styles.summaryUnit}>日</Text></Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ paddingVertical: 60 }} color="#9ca3af" />
        ) : !period ? (
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={20} color="#ca8a04" />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>シフト期間が未設定</Text>
              <Text style={styles.warningText}>この月のシフト期間がまだ作成されていません。管理者にお問い合わせください。</Text>
            </View>
          </View>
        ) : (
          <View style={styles.dayList}>
            {days.map(day => {
              const ds = format(day, 'yyyy-MM-dd')
              const entry = entries[ds]
              const dow = day.getDay()
              const weekend = dow === 0 || dow === 6
              return (
                <TouchableOpacity
                  key={ds}
                  style={styles.dayRow}
                  onPress={() => toggleDay(ds)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dayBadge, isToday(day) && styles.dayBadgeToday, weekend && !isToday(day) && styles.dayBadgeWeekend]}>
                    <Text style={[styles.dayDow, isToday(day) && { color: '#fff' }]}>{format(day, 'E', { locale: ja })}</Text>
                    <Text style={[styles.dayNum, isToday(day) && { color: '#fff' }]}>{format(day, 'd')}</Text>
                  </View>
                  <Text style={styles.dayLabel}>{format(day, 'M月d日(E)', { locale: ja })}</Text>
                  <View style={styles.dayRight}>
                    {entry?.choice === 'available' && (
                      <Text style={styles.timeText}>{entry.start}〜{entry.end}</Text>
                    )}
                    <View style={[
                      styles.choiceDot,
                      entry?.choice === 'available' && { backgroundColor: '#22c55e' },
                      entry?.choice === 'off' && { backgroundColor: '#ef4444' },
                      !entry?.choice && { backgroundColor: '#d1d5db' },
                    ]}>
                      {entry?.choice === 'available' && <Ionicons name="checkmark" size={14} color="#fff" />}
                      {entry?.choice === 'off' && <Ionicons name="close" size={14} color="#fff" />}
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Submit button */}
      {period && (
        <View style={styles.submitBar}>
          <TouchableOpacity
            style={[styles.submitBtn, submitted && styles.submitBtnDone, Object.keys(entries).length === 0 && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || Object.keys(entries).length === 0}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : submitted ? (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.submitText}>提出完了</Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.submitText}>希望シフトを提出</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  hint: { fontSize: 12, color: '#9ca3af', paddingHorizontal: 20, paddingTop: 12 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  monthLabel: { fontSize: 16, fontWeight: '700' },
  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#6b7280' },
  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 12 },
  summaryBox: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1 },
  summaryLabel: { fontSize: 10, fontWeight: '600' },
  summaryVal: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  summaryUnit: { fontSize: 12 },
  warningCard: { marginHorizontal: 20, backgroundColor: '#fefce8', borderRadius: 14, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: '#fde047' },
  warningTitle: { fontSize: 14, fontWeight: '600', color: '#854d0e' },
  warningText: { fontSize: 12, color: '#a16207', marginTop: 4 },
  dayList: { paddingHorizontal: 20 },
  dayRow: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 6, borderWidth: 1, borderColor: '#f3f4f6' },
  dayBadge: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dayBadgeToday: { backgroundColor: '#2563eb' },
  dayBadgeWeekend: { backgroundColor: '#fef2f2' },
  dayDow: { fontSize: 9, color: '#9ca3af' },
  dayNum: { fontSize: 14, fontWeight: '700', color: '#374151' },
  dayLabel: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  dayRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { fontSize: 10, color: '#22c55e' },
  choiceDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  submitBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8, backgroundColor: '#f3f4f6' },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnDone: { backgroundColor: '#22c55e' },
  submitBtnDisabled: { backgroundColor: '#d1d5db' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
