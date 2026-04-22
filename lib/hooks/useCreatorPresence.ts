'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const HEARTBEAT_INTERVAL_MS = 60_000

/**
 * Mantém presença do creator via Supabase Realtime Presence.
 * Quando a aba fecha ou perde conexão, o canal emite leave → o hook
 * marca creator_presence.online=false, source='presence'.
 *
 * Também faz heartbeat a cada 60s atualizando last_heartbeat_at.
 * Só roda enquanto `isOnline` for true — se o creator desligou manualmente
 * não faz sentido manter presence ligada.
 */
export function useCreatorPresence(userId: string | null | undefined, isOnline: boolean) {
  const leaveGuardRef = useRef(false)

  useEffect(() => {
    if (!userId || !isOnline) return

    const supabase = createClient()
    const channel = supabase.channel(`presence:creator:${userId}`, {
      config: { presence: { key: userId } },
    })

    leaveGuardRef.current = false

    channel
      .on('presence', { event: 'sync' }, () => {
        // noop — só mantemos o canal vivo pra detectar disconnect.
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    const heartbeat = setInterval(() => {
      const nowIso = new Date().toISOString()
      supabase
        .from('creator_presence')
        .update({ last_heartbeat_at: nowIso, updated_at: nowIso })
        .eq('creator_id', userId)
        .then(() => {})
    }, HEARTBEAT_INTERVAL_MS)

    const cleanup = async () => {
      if (leaveGuardRef.current) return
      leaveGuardRef.current = true
      try {
        await channel.untrack()
      } catch {}
      try {
        await supabase.removeChannel(channel)
      } catch {}
      const nowIso = new Date().toISOString()
      // Ao desmontar (fechar aba / navegar fora), desliga o status online.
      await supabase
        .from('creator_presence')
        .upsert(
          {
            creator_id: userId,
            online: false,
            source: 'presence',
            last_heartbeat_at: nowIso,
            updated_at: nowIso,
          },
          { onConflict: 'creator_id' },
        )
      await supabase
        .from('profiles')
        .update({ is_available_for_calls: false })
        .eq('id', userId)
    }

    const handleBeforeUnload = () => {
      // best-effort: beforeunload não aguarda await.
      void cleanup()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearInterval(heartbeat)
      void cleanup()
    }
  }, [userId, isOnline])
}
