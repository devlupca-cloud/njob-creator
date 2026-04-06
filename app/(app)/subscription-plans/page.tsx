'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { createSubscriptionCheckout } from '@/lib/api/subscription'
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

  const handleAssinar = async (plan: PlanRow) => {
    if (!plan.stripe_price_id) {
      toast.error(t('subscriptions.noPriceConfigured'))
      return
    }
    setLoadingId(plan.id)
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) {
        toast.error(t('profile.sessionExpired'))
        return
      }
      const { url, error } = await createSubscriptionCheckout(plan.stripe_price_id, token)
      if (error) {
        toast.error(error)
        return
      }
      if (url) {
        window.open(url, '_blank')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="max-w-[720px] mx-auto">
      <h1 className="text-xl font-semibold mb-4">{t('subscriptions.plans')}</h1>
      {isLoading ? (
        <div className="p-8 text-center text-[var(--color-muted)]">{t('common.loading')}</div>
      ) : plans.length === 0 ? (
        <div className="p-8 text-center text-[var(--color-muted)]">{t('subscriptions.noPlans')}</div>
      ) : (
        <div className="flex flex-col gap-4">
          {(plans as PlanRow[]).map((p) => (
            <div key={p.id} className="p-6 bg-[var(--color-surface-2)] rounded-xl">
              <div className="font-semibold text-lg mb-1">{p.name}</div>
              {p.description && (
                <p className="m-0 mb-2 text-sm text-[var(--color-muted)]">{p.description}</p>
              )}
              <div className="text-sm mb-4">{p.currency} {Number(p.price_monthly).toFixed(2)}/mês</div>
              <button
                type="button"
                disabled={loadingId === p.id}
                onClick={() => handleAssinar(p)}
                className={[
                  'px-5 py-2.5 rounded-lg border-none bg-[var(--color-primary)] text-white font-semibold text-sm',
                  loadingId !== p.id ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-60',
                ].join(' ')}
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
