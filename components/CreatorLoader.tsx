'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCreatorInfo } from '@/lib/supabase/creator'
import { useAppStore } from '@/lib/store/app-store'

/**
 * Carrega os dados do creator na store quando há sessão e creator ainda não foi carregado.
 * Pula carregamento para convidados (sem sessão Supabase).
 * Redireciona para /stripe-setup se o creator não completou o onboarding do Stripe.
 */
export default function CreatorLoader() {
  const creator = useAppStore((s) => s.creator)
  const isGuest = useAppStore((s) => s.isGuest)
  const setCreator = useAppStore((s) => s.setCreator)
  const loadingRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    if (creator != null || isGuest || loadingRef.current) return
    loadingRef.current = true

    const load = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { loadingRef.current = false; return }

        // Verificar se o Stripe está configurado (obrigatório para creators)
        const { data: payoutInfo } = await supabase
          .from('creator_payout_info')
          .select('status')
          .eq('creator_id', user.id)
          .maybeSingle()

        if (!payoutInfo || payoutInfo.status !== 'COMPLETED') {
          router.replace('/stripe-setup')
          return
        }

        const info = await getCreatorInfo(supabase)
        if (info) setCreator(info)
      } catch {
        // silently fail — avoids retry loop
      } finally {
        loadingRef.current = false
      }
    }

    load()
  }, [creator, isGuest, setCreator, router])

  return null
}
