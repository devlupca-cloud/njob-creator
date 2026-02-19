'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type MessageRow = Database['public']['Views']['vw_messages']['Row']
type ConversationRow = Database['public']['Views']['vw_creator_conversations']['Row']

export default function ChatConversationPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const supabase = createClient()
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
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span style={{ fontWeight: 600, fontSize: 16 }}>{peerName}</span>
      </div>
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>Carregando...</div>
        ) : messages.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>Nenhuma mensagem ainda.</div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === userId
            return (
              <div
                key={m.message_id ?? m.created_at ?? ''}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: isMe ? 'var(--color-primary)' : 'var(--color-surface-2)',
                  color: isMe ? '#fff' : 'var(--color-foreground)',
                  fontSize: 14,
                }}
              >
                {m.content}
              </div>
            )
          })
        )}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Mensagem"
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            color: 'var(--color-foreground)',
            fontSize: 14,
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim()}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 600,
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            opacity: input.trim() ? 1 : 0.5,
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
