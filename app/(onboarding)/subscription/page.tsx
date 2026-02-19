'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { createSubscriptionCheckout } from '@/lib/api/subscription'
import { toast } from 'sonner'

type PlanRow = {
  id: string
  name: string
  description: string | null
  price_monthly: number
  stripe_price_id: string | null
}

export default function OnboardingSubscriptionPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const { data: plans = [] } = useQuery({
    queryKey: ['subscription_plans_onboarding'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscription_plans').select('*').eq('is_active', true)
      if (error) return []
      return data ?? []
    },
  })

  const handleAssinar = async (plan: PlanRow) => {
    const priceId = plan.stripe_price_id
    if (!priceId) {
      toast.error('Plano sem preço configurado.')
      return
    }
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) {
      toast.error('Faça login para assinar.')
      return
    }
    setLoadingId(plan.id)
    try {
      const { url, error } = await createSubscriptionCheckout(priceId, token)
      if (error) {
        toast.error(error)
        return
      }
      if (url) window.location.href = url
      else toast.error('Link de checkout não retornado.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao iniciar checkout.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Escolha seu plano</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 24 }}>
        Assinatura no primeiro acesso.
      </p>
      {plans.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>Nenhum plano disponível.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(plans as PlanRow[]).map((p) => (
            <div key={p.id} style={{ padding: 20, background: 'var(--color-surface-2)', borderRadius: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
              {p.description && <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--color-muted)' }}>{p.description}</p>}
              <div style={{ fontSize: 14, marginBottom: 12 }}>R$ {Number(p.price_monthly).toFixed(2)}/mês</div>
              <button
                type="button"
                disabled={!p.stripe_price_id || loadingId === p.id}
                onClick={() => handleAssinar(p)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: p.stripe_price_id && loadingId !== p.id ? 'pointer' : 'not-allowed',
                  opacity: p.stripe_price_id && loadingId !== p.id ? 1 : 0.6,
                  fontSize: 14,
                }}
              >
                {loadingId === p.id ? 'Abrindo checkout...' : 'Assinar'}
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 24 }}>
        <Link href="/home" style={{ fontSize: 14, color: 'var(--color-primary)', fontWeight: 600 }}>
          Pular e ir para o app →
        </Link>
      </div>
    </div>
  )
}
