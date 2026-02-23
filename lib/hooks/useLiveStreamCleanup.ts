import { useEffect, useRef } from 'react'
import type { CreatorData } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook L3: Lazy status cleanup — marca live_streams agendadas que já
 * terminaram como 'finished'. Executa apenas uma vez por montagem do
 * componente (controlado por cleanupRanRef), após o creator estar
 * disponível.
 *
 * @param creator  Dados do creator autenticado (ou null quando indisponível)
 * @param refetch  Callback para re-buscar os eventos após o cleanup
 */
export function useLiveStreamCleanup(
  creator: CreatorData | null,
  refetch: () => void,
): void {
  const cleanupRanRef = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    if (cleanupRanRef.current || !creator) return
    cleanupRanRef.current = true
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) return

      const { data: stale } = await supabase
        .from('live_streams')
        .select('id, scheduled_start_time, estimated_duration_minutes')
        .eq('creator_id', userId)
        .eq('status', 'scheduled')

      if (!stale?.length) return

      const now = Date.now()
      const expiredIds = stale
        .filter((ls) => {
          const start = new Date(ls.scheduled_start_time).getTime()
          const dur = (ls.estimated_duration_minutes ?? 60) * 60 * 1000
          return now > start + dur
        })
        .map((ls) => ls.id)

      if (expiredIds.length > 0) {
        await supabase
          .from('live_streams')
          .update({ status: 'finished' })
          .in('id', expiredIds)
        refetch()
      }
    })()
  }, [creator, supabase, refetch])
}
