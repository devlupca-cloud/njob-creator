'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCreatorInfo } from '@/lib/supabase/creator'
import { useAppStore } from '@/lib/store/app-store'

/**
 * Carrega os dados do creator na store quando há sessão e creator ainda não foi carregado.
 * Pula carregamento para convidados (sem sessão Supabase).
 */
export default function CreatorLoader() {
  const creator = useAppStore((s) => s.creator)
  const isGuest = useAppStore((s) => s.isGuest)
  const setCreator = useAppStore((s) => s.setCreator)

  useEffect(() => {
    if (creator != null || isGuest) return

    const load = async () => {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) return

      const info = await getCreatorInfo(supabase)
      if (info) setCreator(info)
    }

    load()
  }, [creator, isGuest, setCreator])

  return null
}
