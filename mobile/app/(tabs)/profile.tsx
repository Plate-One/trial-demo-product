import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { calcHours, formatCurrency } from '@/lib/helpers'
import { useRouter } from 'expo-router'

interface StoreInfo { name: string; hourly_wage_hall: number; hourly_wage_kitchen: number }

const ROLE_LABELS: Record<string, string> = { '店長': '店長', 'マネージャー': 'マネージャー', 'チーフ': 'チーフ', 'スタッフ': 'スタッフ' }
const POS_LABELS: Record<string, string> = { 'ホール': 'ホール', 'キッチン': 'キッチン', '両方': 'ホール・キッチン' }
const EMP_LABELS: Record<string, string> = { '正社員': '正社員', 'パート': 'パート', 'アルバイト': 'アルバイト' }

export default function ProfileScreen() {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [monthStats, setMonthStats] = useState<{ workDays: number; totalHours: number; pay: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAbsence, setShowAbsence] = useState(false)
  const [absenceDate, setAbsenceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [absenceReason, setAbsenceReason] = useState('')
  const [absenceLoading, setAbsenceLoading] = useState(false)

  useEffect(() => {
    if (!profile?.id || !profile?.store_id) return
    const load = async () => {
      setLoading(true)
      const { data: s } = await supabase
        .from('stores')
        .select('name, hourly_wage_hall, hourly_wage_kitchen')
        .eq('id', profile.store_id)
        .maybeSingle()
      if (s) setStore(s as StoreInfo)

      const ms = startOfMonth(new Date())
      const me = endOfMonth(new Date())
      const { data: shifts } = await supabase
        .from('shifts')
        .select('start_time, end_time')
        .eq('staff_id', profile.id)
        .gte('date', format(ms, 'yyyy-MM-dd'))
        .lte('date', format(me, 'yyyy-MM-dd'))

      if (shifts) {
        const hours = (shifts as any[]).reduce((sum, sh) => sum + calcHours(sh.start_time, sh.end_time), 0)
        const rate = profile.position === 'ホール' ? ((s as StoreInfo)?.hourly_wage_hall ?? 1150) : ((s as StoreInfo)?.hourly_wage_kitchen ?? 1200)
        setMonthStats({ workDays: shifts.length, totalHours: hours, pay: Math.round(hours * rate) })
      }
      setLoading(false)
    }
    load()
  }, [profile?.id, profile?.store_id])

  const submitAbsence = async () => {
    if (!profile || !absenceReason.trim()) return
    setAbsenceLoading(true)
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '')}/api/absence-requests`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staff_id: profile.id, store_id: profile.store_id, date: absenceDate, reason: absenceReason }),
        }
      )
      if (res.ok) {
        Alert.alert('完了', '欠勤連絡を送信しました')
        setShowAbsence(false)
        setAbsenceReason('')
      }
    } catch {
      Alert.alert('エラー', '送信に失敗しました')
    } finally {
      setAbsenceLoading(false)
    }
  }

  if (!profile) return null

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ paddingVertical: 60 }} color="#9ca3af" />
      ) : (
        <>
          {/* Profile card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.name?.charAt(0) ?? '?'}</Text>
            </View>
            <Text style={styles.name}>{profile.name}</Text>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: '#d1fae5' }]}>
                <Text style={[styles.badgeText, { color: '#059669' }]}>{POS_LABELS[profile.position] ?? profile.position}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#f3f4f6' }]}>
                <Text style={[styles.badgeText, { color: '#6b7280' }]}>{ROLE_LABELS[profile.role] ?? profile.role}</Text>
              </View>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#9ca3af" />
                <Text style={styles.infoText}>{store?.name ?? '未設定'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="briefcase-outline" size={16} color="#9ca3af" />
                <Text style={styles.infoText}>{EMP_LABELS[profile.employment_type] ?? '未設定'}</Text>
              </View>
            </View>
          </View>

          {/* Monthly stats */}
          {monthStats && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>今月の実績 ({format(new Date(), 'M月')})</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{monthStats.workDays}</Text>
                  <Text style={styles.statLabel}>出勤日数</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{monthStats.totalHours.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>勤務時間</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{formatCurrency(monthStats.pay)}</Text>
                  <Text style={styles.statLabel}>見込み給与</Text>
                </View>
              </View>
            </View>
          )}

          {/* Menu */}
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/attendance')} activeOpacity={0.7}>
              <Ionicons name="time-outline" size={18} color="#9ca3af" />
              <Text style={styles.menuText}>勤怠履歴</Text>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/shifts')} activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
              <Text style={styles.menuText}>シフトカレンダー</Text>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/requests')} activeOpacity={0.7}>
              <Ionicons name="send-outline" size={18} color="#9ca3af" />
              <Text style={styles.menuText}>希望シフト提出</Text>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setShowAbsence(!showAbsence)} activeOpacity={0.7}>
              <Ionicons name="alert-circle-outline" size={18} color="#9ca3af" />
              <Text style={styles.menuText}>欠勤連絡</Text>
              <Ionicons name={showAbsence ? 'chevron-down' : 'chevron-forward'} size={18} color="#d1d5db" />
            </TouchableOpacity>
          </View>

          {/* Absence form */}
          {showAbsence && (
            <View style={styles.absenceCard}>
              <Text style={styles.absenceTitle}>欠勤連絡</Text>
              <Text style={styles.fieldLabel}>日付</Text>
              <TextInput
                style={styles.input}
                value={absenceDate}
                onChangeText={setAbsenceDate}
                placeholder="YYYY-MM-DD"
              />
              <Text style={styles.fieldLabel}>理由</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={absenceReason}
                onChangeText={setAbsenceReason}
                placeholder="欠勤の理由を入力..."
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[styles.absenceBtn, (!absenceReason.trim() || absenceLoading) && styles.absenceBtnDisabled]}
                onPress={submitAbsence}
                disabled={!absenceReason.trim() || absenceLoading}
                activeOpacity={0.8}
              >
                {absenceLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.absenceBtnText}>欠勤連絡を送信</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text style={styles.logoutText}>ログアウト</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  profileCard: { margin: 20, backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  infoList: { alignSelf: 'stretch', gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: '#374151' },
  statsCard: { marginHorizontal: 20, backgroundColor: '#eff6ff', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#bfdbfe' },
  statsTitle: { fontSize: 12, fontWeight: '700', color: '#1d4ed8', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#1e40af' },
  statLabel: { fontSize: 10, color: '#60a5fa', marginTop: 4 },
  menu: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12 },
  menuText: { flex: 1, fontSize: 14, color: '#374151' },
  absenceCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  absenceTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12, backgroundColor: '#f9fafb' },
  textArea: { height: 80, textAlignVertical: 'top' },
  absenceBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  absenceBtnDisabled: { backgroundColor: '#d1d5db' },
  absenceBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  logoutBtn: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#f3f4f6' },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
})
