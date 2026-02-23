'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import { useTranslation } from '@/lib/i18n'
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
  const { t } = useTranslation()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription_plans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscription_plans').select('*').eq('is_active', true)
      if (error) return []
      return data ?? []
    },
  })

  // STRIPE_DISABLED: Subscription checkout temporarily disabled
  const handleAssinar = async (_plan: PlanRow) => {
    toast.info('Em breve')
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>{t('subscriptions.plans')}</h1>
      {isLoading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)' }}>{t('common.loading')}</div>
      ) : plans.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)' }}>{t('subscriptions.noPlans')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(plans as PlanRow[]).map((p) => (
            <div key={p.id} style={{ padding: 24, background: 'var(--color-surface-2)', borderRadius: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{p.name}</div>
              {p.description && <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--color-muted)' }}>{p.description}</p>}
              <div style={{ fontSize: 14, marginBottom: 16 }}>{p.currency} {Number(p.price_monthly).toFixed(2)}/mês</div>
              <button
                type="button"
                disabled={loadingId === p.id}
                onClick={() => handleAssinar(p)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: loadingId !== p.id ? 'pointer' : 'not-allowed',
                  opacity: loadingId !== p.id ? 1 : 0.6,
                  fontSize: 14,
                }}
              >
                {loadingId === p.id ? t('subscriptions.openingCheckout') : t('subscriptions.subscribe')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
