'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'
import { useTranslation } from '@/lib/i18n'
import { ArrowLeft } from 'lucide-react'

type MessageRow = Database['public']['Views']['vw_messages']['Row']
type ConversationRow = Database['public']['Views']['vw_creator_conversations']['Row']

export default function ChatConversationPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation()
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [peerName, setPeerName] = useState<string>('Chat')
  const [userId, setUserId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    if (!id) return
    const { data, error } = await supabase
      .from('vw_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
    if (error) {
      console.error('[Chat]', error)
      setMessages([])
      return
    }
    setMessages((data ?? []) as MessageRow[])
  }, [id, supabase])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user?.id
      if (!uid) return
      if (!cancelled) setUserId(uid)
      const { data: conv } = await supabase
        .from('vw_creator_conversations')
        .select('peer_name')
        .eq('conversation_id', id)
        .eq('profile_id', uid)
        .single()
      const row = conv as Pick<ConversationRow, 'peer_name'> | null
      if (!cancelled && row?.peer_name) setPeerName(row.peer_name)
      await fetchMessages()
      if (!uid) return
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', id)
        .eq('profile_id', uid)
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [id, supabase, fetchMessages])

  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        () => {
          fetchMessages().then(() => {
            listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
          })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, supabase, fetchMessages])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'auto' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || !userId || !id) return
    setInput('')
    const { error } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: userId,
      content: text,
    })
    if (error) {
      console.error('[Chat] send', error)
      setInput(text)
      return
    }
    await fetchMessages()
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }

  if (!id) return null

  return (
    <div className="flex flex-col max-w-[720px] mx-auto h-[calc(100vh-120px)]">
      <div className="flex items-center gap-3 py-3 border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t('common.back')}
          className="bg-transparent border-none cursor-pointer p-1"
        >
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <span className="font-semibold text-base">{peerName}</span>
      </div>
      <div
        ref={listRef}
        className="flex-1 overflow-auto p-4 flex flex-col gap-2"
      >
        {loading ? (
          <div className="p-6 text-center text-[var(--color-muted)]">{t('common.loading')}</div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-center text-[var(--color-muted)]">{t('chat.noMessages')}</div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === userId
            return (
              <div
                key={m.message_id ?? m.created_at ?? ''}
                className={[
                  'max-w-[80%] px-3 py-2 rounded-xl text-sm',
                  isMe
                    ? 'self-end bg-[var(--color-primary)] text-white'
                    : 'self-start bg-[var(--color-surface-2)] text-[var(--color-foreground)]',
                ].join(' ')}
              >
                {m.content}
              </div>
            )
          })
        )}
      </div>
      <div className="p-3 border-t border-[var(--color-border)] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={t('chat.messagePlaceholder')}
          className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-foreground)] text-sm"
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim()}
          className={[
            'px-5 py-2.5 rounded-lg border-none bg-[var(--color-primary)] text-white font-semibold',
            input.trim() ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50',
          ].join(' ')}
        >
          {t('chat.send')}
        </button>
      </div>
    </div>
  )
}
