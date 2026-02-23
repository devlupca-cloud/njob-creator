'use client'

import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { useTranslation } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

type NotificationType = 'success' | 'info' | 'warning' | 'error'

interface Notification {
  id: string
  title: string | null
  message: string
  type: NotificationType
  is_read: boolean | null
  created_at: string | null
}

type Filter = 'all' | 'unread'

const typeColors: Record<NotificationType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(16,185,129,0.1)', border: '#10b981', icon: '#10b981' },
  info: { bg: 'rgba(101,22,147,0.1)', border: '#651693', icon: '#651693' },
  warning: { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', icon: '#f59e0b' },
  error: { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', icon: '#ef4444' },
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}sem`
}

export default function NotificationsPage() {
  const { t } = useTranslation()
  const supabase = createClient()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
    })
  }, [supabase])

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, type, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications((data ?? []) as Notification[])
    setLoading(false)
  }, [userId, supabase])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllAsRead = async () => {
    if (!userId) return
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
      <PageHeader title={t('nav.notifications')} />

      {/* Filter tabs + mark all */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'unread'] as Filter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: filter === tab ? 'var(--color-primary)' : 'var(--color-secondary)',
                color: filter === tab ? '#fff' : 'var(--color-muted)',
                transition: 'all 150ms',
              }}
            >
              {tab === 'all' ? 'Todas' : 'Não lidas'}
              {tab === 'unread' && unreadCount > 0 && (
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '2px 6px' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-secondary)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 12, width: '40%', background: 'var(--color-secondary)', borderRadius: 4 }} />
                <div style={{ height: 10, width: '80%', background: 'var(--color-secondary)', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 4 }}>
            {filter === 'unread' ? 'Tudo em dia!' : 'Nenhuma notificação'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-muted)', maxWidth: 280 }}>
            {filter === 'unread' ? 'Você leu todas as suas notificações.' : 'Quando houver novidades, elas aparecerão aqui.'}
          </p>
          {filter === 'unread' && (
            <button
              onClick={() => setFilter('all')}
              style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Ver todas
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((n) => {
            const colors = typeColors[n.type] || typeColors.info
            return (
              <button
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                disabled={!!n.is_read}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--color-border)',
                  borderLeft: !n.is_read ? `3px solid ${colors.border}` : '3px solid transparent',
                  background: !n.is_read ? 'rgba(101,22,147,0.04)' : 'transparent',
                  opacity: n.is_read ? 0.6 : 1,
                  cursor: n.is_read ? 'default' : 'pointer',
                  border: 'none',
                  borderBottomWidth: 1,
                  borderBottomStyle: 'solid',
                  borderBottomColor: 'var(--color-border)',
                  borderLeftWidth: 3,
                  borderLeftStyle: 'solid',
                  borderLeftColor: !n.is_read ? colors.border : 'transparent',
                  transition: 'background 150ms',
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: colors.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {n.type === 'success' && <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>}
                    {n.type === 'info' && <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>}
                    {n.type === 'warning' && <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>}
                    {n.type === 'error' && <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>}
                  </svg>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: n.is_read ? 'var(--color-muted)' : 'var(--color-foreground)', lineHeight: 1.4 }}>
                      {n.title || n.message}
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)', flexShrink: 0 }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.title && n.message && (
                    <p style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {n.message}
                    </p>
                  )}
                  {!n.is_read && (
                    <p style={{ marginTop: 6, fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>
                      Marcar como lida
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
