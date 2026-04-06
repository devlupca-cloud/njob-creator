'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getCreatorInfo } from '@/lib/supabase/creator'
import { useAppStore } from '@/lib/store/app-store'

const MAX_RETRIES = 3

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

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const info = await getCreatorInfo(supabase)
          if (info) { setCreator(info); return }
        } catch (err) {
          console.warn(`[CreatorLoader] attempt ${attempt}/${MAX_RETRIES} failed:`, err)
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 500 * attempt))
          }
        }
      }

      toast.error('Não foi possível carregar seus dados. Atualize a página.')
      loadingRef.current = false
    }

    load().catch(() => {
      loadingRef.current = false
    })
  }, [creator, isGuest, setCreator, router])

  return null
}
