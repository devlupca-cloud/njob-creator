'use client'

import { Eye, Heart, DollarSign } from 'lucide-react'

import CardMetricas from '@/components/home/CardMetricas'
import Spinner from '@/components/ui/Spinner'
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-row gap-2">
      {/* Card 1 — Visitas */}
      <CardMetricas
        fillColor="#F1E2FF"
        icon={<Eye width={20} height={20} stroke="#222222" strokeWidth={2} />}
        value={metricas?.visitas_30d ?? 0}
        title={t('home.visits')}
        subTitle={t('home.last30days')}
        showIcon={true}
        valueMoeda={false}
      />

      {/* Card 2 — Curtidas */}
      <CardMetricas
        fillColor="#E8CDFF"
        icon={<Heart width={20} height={20} stroke="#222222" strokeWidth={2} />}
        value={metricas?.curtidas_30d ?? 0}
        title={t('home.likes')}
        subTitle={t('home.last30days')}
        showIcon={true}
        valueMoeda={false}
      />

      {/* Card 3 — Faturamento */}
      <CardMetricas
        fillColor="#DEB8FF"
        icon={<DollarSign width={20} height={20} stroke="#222222" strokeWidth={2} />}
        value={Math.round(metricas?.faturamento_30d ?? 0)}
        title={t('home.revenue')}
        subTitle={t('home.last30days')}
        showIcon={false}
        valueMoeda={true}
      />
    </div>
  )
}
