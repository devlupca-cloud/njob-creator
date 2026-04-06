'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import type { Database } from '@/lib/types/database'
import EmptyState from '@/components/ui/EmptyState'
import { formatTimeLocal, formatDateLocal } from '@/lib/utils/datetime'
import { useTranslation } from '@/lib/i18n'

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
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [filterUnread, setFilterUnread] = useState(false)
  const [sortNewest, setSortNewest] = useState(true)

  const { data: conversations = [], isLoading: loading } = useQuery({
    queryKey: ['vw_creator_conversations', creator?.profile?.username],
    enabled: !!creator,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user?.id
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
    <div className="max-w-[720px] mx-auto">
      <h1 className="text-xl font-semibold mb-4">{t('chat.title')}</h1>
      <div className="mb-3">
        <input
          type="text"
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-foreground)] text-sm"
        />
        <div className="flex gap-2 mt-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={filterUnread} onChange={(e) => setFilterUnread(e.target.checked)} />
            {t('chat.unread')}
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={sortNewest} onChange={(e) => setSortNewest(e.target.checked)} />
            {t('chat.recent')}
          </label>
        </div>
      </div>
      {loading ? (
        <div className="p-8 text-center text-[var(--color-muted)]">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title={t('chat.noConversations')} description={t('chat.emptyMessage')} icon="💬" />
      ) : (
        <ul className="list-none p-0 m-0">
          {filtered.map((c) => (
            <li key={c.conversation_id ?? c.peer_id ?? ''}>
              <button
                type="button"
                onClick={() => openChat(c)}
                className="w-full flex items-center gap-3 p-3 border-none border-b border-[var(--color-border)] cursor-pointer text-left"
                style={{
                  background: (c.unread_count ?? 0) > 0 ? 'var(--color-primary-muted, rgba(101,22,147,0.08))' : 'transparent', /* dynamic value - cannot be Tailwind */
                }}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--color-surface-2)] shrink-0">
                  {c.peer_avatar_url ? (
                    <img src={c.peer_avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-[var(--color-primary)]">
                      {(c.peer_name ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-semibold text-sm text-[var(--color-foreground)]">{c.peer_name ?? t('chat.noName')}</span>
                    <span className="text-xs text-[var(--color-muted)]">{formatMessageTime(c.last_message_created_at)}</span>
                  </div>
                  <p className="m-0 text-[13px] text-[var(--color-muted)] overflow-hidden text-ellipsis whitespace-nowrap">
                    {c.last_message ?? '—'}
                  </p>
                </div>
                {(c.unread_count ?? 0) > 0 && (
                  <span className="min-w-5 h-5 rounded-[10px] bg-[var(--color-primary)] text-white text-[11px] font-bold flex items-center justify-center px-1">
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
