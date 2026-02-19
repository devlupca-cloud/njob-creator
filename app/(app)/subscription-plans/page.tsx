'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import { createSubscriptionCheckout } from '@/lib/api/subscription'
import { toast } from 'sonner'

type PlanRow = {
  id: string
  name: string
  description: string | null
  price_monthly: number
  currency: string
  stripe_price_id: string | null
}

export default function SubscriptionPlansPage() {
  const supabase = createClient()
  const creator = useCreator()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription_plans'],
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
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Planos de assinatura</h1>
      {isLoading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)' }}>Carregando...</div>
      ) : plans.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)' }}>Nenhum plano disponível.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(plans as PlanRow[]).map((p) => (
            <div key={p.id} style={{ padding: 24, background: 'var(--color-surface-2)', borderRadius: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{p.name}</div>
              {p.description && <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--color-muted)' }}>{p.description}</p>}
              <div style={{ fontSize: 14, marginBottom: 16 }}>{p.currency} {Number(p.price_monthly).toFixed(2)}/mês</div>
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
    </div>
  )
}
