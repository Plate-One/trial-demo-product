import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  type: 'shift_confirmed' | 'reminder' | 'announcement'
  title: string
  body: string
  date: string
  read: boolean
  pinned?: boolean
}

const TYPE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  shift_confirmed: { icon: 'calendar', color: '#059669', bg: '#d1fae5' },
  reminder: { icon: 'notifications', color: '#7c3aed', bg: '#ede9fe' },
  announcement: { icon: 'information-circle', color: '#2563eb', bg: '#dbeafe' },
}

export default function NotificationsScreen() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!profile?.id || !profile?.store_id) return

    const fetch = async () => {
      setLoading(true)
      const today = format(new Date(), 'yyyy-MM-dd')
      const notifs: Notification[] = []

      // Shift periods
      const { data: periods } = await supabase
        .from('shift_periods')
        .select('id, period_start, period_end, status')
        .eq('store_id', profile.store_id)
        .order('period_start', { ascending: false })
        .limit(3)

      ;(periods as any[] ?? []).forEach(p => {
        if (p.status === 'collecting') {
          notifs.push({
            id: `period-${p.id}`,
            type: 'reminder',
            title: '希望シフト受付中',
            body: `${format(new Date(p.period_start + 'T00:00'), 'M月d日', { locale: ja })}〜${format(new Date(p.period_end + 'T00:00'), 'M月d日', { locale: ja })}のシフト希望を受け付けています。`,
            date: new Date().toISOString(),
            read: false,
            pinned: true,
          })
        }
        if (p.status === 'confirmed') {
          notifs.push({
            id: `confirmed-${p.id}`,
            type: 'shift_confirmed',
            title: 'シフトが確定しました',
            body: `${format(new Date(p.period_start + 'T00:00'), 'M月d日', { locale: ja })}〜${format(new Date(p.period_end + 'T00:00'), 'M月d日', { locale: ja })}のシフトが確定しました。`,
            date: p.period_start + 'T00:00:00',
            read: false,
          })
        }
      })

      // Next shift
      const { data: nextShifts } = await supabase
        .from('shifts')
        .select('id, date, start_time, end_time')
        .eq('staff_id', profile.id)
        .eq('status', 'confirmed')
        .gte('date', today)
        .order('date')
        .limit(1)

      if (nextShifts && nextShifts.length > 0) {
        const s = nextShifts[0] as any
        notifs.push({
          id: `next-${s.id}`,
          type: 'reminder',
          title: '次のシフト',
          body: `${format(new Date(s.date + 'T00:00'), 'M月d日(E)', { locale: ja })} ${s.start_time.slice(0, 5)}〜${s.end_time.slice(0, 5)}`,
          date: new Date().toISOString(),
          read: false,
        })
      }

      notifs.push({
        id: 'welcome',
        type: 'announcement',
        title: '従業員アプリへようこそ',
        body: 'シフト確認、希望提出、勤怠履歴の確認がアプリからできます。',
        date: new Date().toISOString(),
        read: true,
        pinned: true,
      })

      setNotifications(notifs)
      setLoading(false)
    }

    fetch()
  }, [profile?.id, profile?.store_id])

  const markRead = (id: string) => setReadIds(prev => new Set([...prev, id]))

  const pinned = notifications.filter(n => n.pinned)
  const regular = notifications.filter(n => !n.pinned)

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ paddingVertical: 60 }} color="#9ca3af" />
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={40} color="#d1d5db" />
          <Text style={styles.emptyText}>お知らせはありません</Text>
        </View>
      ) : (
        <>
          {pinned.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pin" size={14} color="#9ca3af" />
                <Text style={styles.sectionTitle}>固定</Text>
              </View>
              {pinned.map(n => {
                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.announcement
                const isRead = n.read || readIds.has(n.id)
                return (
                  <TouchableOpacity key={n.id} style={[styles.card, !isRead && styles.cardUnread]} onPress={() => markRead(n.id)} activeOpacity={0.7}>
                    <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle}>{n.title}</Text>
                        {!isRead && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.cardText}>{n.body}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          {regular.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>通知</Text>
              {regular.map(n => {
                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.announcement
                const isRead = n.read || readIds.has(n.id)
                return (
                  <TouchableOpacity key={n.id} style={[styles.card, !isRead && styles.cardUnread]} onPress={() => markRead(n.id)} activeOpacity={0.7}>
                    <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle}>{n.title}</Text>
                        {!isRead && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.cardText}>{n.body}</Text>
                      <Text style={styles.cardDate}>{format(new Date(n.date), 'M/d HH:mm')}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
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
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 12 },
  section: { paddingHorizontal: 20, paddingTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6' },
  cardUnread: { borderColor: '#bfdbfe', backgroundColor: '#f0f7ff' },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#111' },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3b82f6' },
  cardText: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  cardDate: { fontSize: 10, color: '#d1d5db', marginTop: 6 },
})
