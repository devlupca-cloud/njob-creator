'use client'

import { useState } from 'react'
import { Eye, Heart, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

import CardMetricas from '@/components/home/CardMetricas'
import Spinner from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n'

interface CreatorMetrics {
  visitas_30d: number
  curtidas_30d: number
  faturamento_30d: number
}

interface MetricsCardsProps {
  metricas: CreatorMetrics | undefined
  isLoading: boolean
}

export function MetricsCards({ metricas, isLoading }: MetricsCardsProps) {
  const { t } = useTranslation()
  const [stripeLoading, setStripeLoading] = useState(false)

  const handleOpenStripe = async () => {
    if (stripeLoading) return
    setStripeLoading(true)
    try {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) { toast.error(t('profile.sessionExpired')); return }

      const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const res = await fetch(`${base}/functions/v1/creator-payout-update-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (data?.status === 'VERIFYING') { toast.info(data?.message ?? t('profile.stripeVerifying')); return }
      if (!res.ok && data?.error !== 'account_onboarding') { toast.error(data?.message ?? data?.error ?? `Erro HTTP ${res.status}`); return }

      const url = data?.url ?? data?.login_url ?? data?.onboarding_url
      if (url) { window.open(url, '_blank') } else { toast.error(t('profile.stripeNoLink')) }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setStripeLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Card 1 — Visitas */}
      <div className="flex-1 min-w-0">
        <CardMetricas
          fillColor="#F1E2FF"
          icon={<Eye width={20} height={20} stroke="#222222" strokeWidth={2} />}
          value={metricas?.visitas_30d ?? 0}
          title={t('home.visits')}
          subTitle={t('home.last30days')}
          showIcon={true}
          valueMoeda={false}
        />
      </div>

      {/* Card 2 — Curtidas */}
      <div className="flex-1 min-w-0">
        <CardMetricas
          fillColor="#E8CDFF"
          icon={<Heart width={20} height={20} stroke="#222222" strokeWidth={2} />}
          value={metricas?.curtidas_30d ?? 0}
          title={t('home.likes')}
          subTitle={t('home.last30days')}
          showIcon={true}
          valueMoeda={false}
        />
      </div>

      {/* Card 3 — Faturamento (clicável → abre Stripe dashboard) */}
      <div
        onClick={handleOpenStripe}
        className={`basis-1/2 shrink-0 md:basis-auto md:flex-1 md:min-w-0 cursor-pointer ${stripeLoading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <CardMetricas
          fillColor="#DEB8FF"
          icon={<DollarSign width={20} height={20} stroke="#222222" strokeWidth={2} />}
          value={metricas?.faturamento_30d ?? 0}
          title={t('home.revenue')}
          subTitle={t('home.last30days')}
          showIcon={false}
          valueMoeda={true}
        />
      </div>
    </div>
  )
}
