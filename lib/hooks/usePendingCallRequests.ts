'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

export type PendingCallRequest = Database['public']['Tables']['one_on_one_calls']['Row'] & {
  user?: { full_name: string | null; avatar_url: string | null } | null
}

/**
 * Retorna todas as solicitações de videochamada em status='requested' para o
 * creator logado. Atualiza em tempo real via Realtime (INSERT/UPDATE/DELETE).
 */
export function usePendingCallRequests(creatorId: string | null | undefined) {
  const [pending, setPending] = useState<PendingCallRequest[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNow = useCallback(async () => {
    if (!creatorId) return
    const supabase = createClient()
    setLoading(true)
    const { data } = await supabase
      .from('one_on_one_calls')
      .select('*, user:profiles!one_on_one_calls_user_id_fkey(full_name, avatar_url)')
      .eq('creator_id', creatorId)
      .eq('status', 'requested')
      .order('created_at', { ascending: true })

    setPending((data as PendingCallRequest[] | null) ?? [])
    setLoading(false)
  }, [creatorId])

  useEffect(() => {
    if (!creatorId) {
      setPending([])
      return
    }

    void fetchNow()

    const supabase = createClient()
    const channel = supabase
      .channel(`pending-calls:${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'one_on_one_calls',
          filter: `creator_id=eq.${creatorId}`,
        },
        () => {
          void fetchNow()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [creatorId, fetchNow])

  return { pending, loading, refetch: fetchNow }
}
