'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import type { Database } from '@/lib/types/database'
import EmptyState from '@/components/ui/EmptyState'
import { formatTimeLocal, formatDateLocal } from '@/lib/utils/datetime'

type ConversationRow = Database['public']['Views']['vw_creator_conversations']['Row']

function formatMessageTime(iso: string | null): string {
  if (!iso) return '--:--'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '--:--'
  const now = new Date()
  const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  if (sameDay) return formatTimeLocal(d)
  return formatDateLocal(d)
}

function filterByName(list: ConversationRow[], search: string): ConversationRow[] {
  const q = search.trim().toLowerCase()
  if (!q) return list
  return list.filter((c) => (c.peer_name ?? '').toLowerCase().includes(q))
}

export default function ChatListPage() {
  const supabase = createClient()
  const creator = useCreator()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterUnread, setFilterUnread] = useState(false)
  const [sortNewest, setSortNewest] = useState(true)

  const { data: conversations = [], isLoading: loading } = useQuery({
    queryKey: ['vw_creator_conversations', creator?.profile?.username],
    enabled: !!creator,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) return []
      const { data, error } = await supabase
        .from('vw_creator_conversations')
        .select('*')
        .eq('profile_id', uid)
        .order('last_message_created_at', { ascending: false, nullsFirst: false })
      if (error) {
        console.error('[ChatList]', error)
        return []
      }
      return (data ?? []) as ConversationRow[]
    },
    refetchOnWindowFocus: true,
  })

  const filtered = useMemo(() => {
    let list = filterByName(conversations, search)
    if (filterUnread) list = list.filter((c) => (c.unread_count ?? 0) > 0)
    if (!sortNewest) list = [...list].sort((a, b) => {
      const ta = a.last_message_created_at ?? ''
      const tb = b.last_message_created_at ?? ''
      return ta.localeCompare(tb)
    })
    return list
  }, [conversations, search, filterUnread, sortNewest])

  const openChat = (c: ConversationRow) => {
    router.push(`/chat/${encodeURIComponent(c.conversation_id ?? '')}`)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Chat</h1>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            color: 'var(--color-foreground)',
            fontSize: 14,
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={filterUnread} onChange={(e) => setFilterUnread(e.target.checked)} />
            Não lidas
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={sortNewest} onChange={(e) => setSortNewest(e.target.checked)} />
            Mais recentes
          </label>
        </div>
      </div>
      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)' }}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Nenhuma conversa" description="Quando alguém enviar uma mensagem, ela aparecerá aqui." icon="💬" />
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {filtered.map((c) => (
            <li key={c.conversation_id ?? c.peer_id ?? ''}>
              <button
                type="button"
                onClick={() => openChat(c)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  border: 'none',
                  borderBottom: '1px solid var(--color-border)',
                  background: (c.unread_count ?? 0) > 0 ? 'var(--color-primary-muted, rgba(101,22,147,0.08))' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: 'var(--color-surface-2)',
                    flexShrink: 0,
                  }}
                >
                  {c.peer_avatar_url ? (
                    <img src={c.peer_avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: 'var(--color-primary)' }}>
                      {(c.peer_name ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-foreground)' }}>{c.peer_name ?? 'Sem nome'}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{formatMessageTime(c.last_message_created_at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.last_message ?? '—'}
                  </p>
                </div>
                {(c.unread_count ?? 0) > 0 && (
                  <span
                    style={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      background: 'var(--color-primary)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {c.unread_count}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
