'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { createStripeAccount } from '@/lib/supabase/creator'
import { useTranslation } from '@/lib/i18n'

function StripeSetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(
    searchParams.get('url')
  )
  const [loading, setLoading] = useState(!searchParams.get('url'))

  useEffect(() => {
    if (onboardingUrl) return
    const fetchUrl = async () => {
      const supabase = createClient()
      const result = await createStripeAccount(supabase)
      if ('error' in result) {
        toast.error(result.error)
        setLoading(false)
        return
      }
      setOnboardingUrl(result.url)
      setLoading(false)
    }
    fetchUrl()
  }, [onboardingUrl])

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
        Configurar pagamentos
      </h1>
      <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 32 }}>
        Para receber pagamentos, você precisa completar o cadastro no Stripe.
      </p>

      {loading ? (
        <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>
          {t('common.loading')}
        </p>
      ) : onboardingUrl ? (
        <button
          type="button"
          onClick={() => window.open(onboardingUrl, '_blank')}
          style={{
            padding: '14px 32px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 15,
            width: '100%',
            marginBottom: 12,
          }}
        >
          Abrir cadastro no Stripe
        </button>
      ) : (
        <p style={{ color: 'var(--color-error)', fontSize: 14 }}>
          Não foi possível obter o link de cadastro. Tente novamente mais tarde.
        </p>
      )}

    </div>
  )
}

export default function StripeSetupPage() {
  return (
    <Suspense>
      <StripeSetupContent />
    </Suspense>
  )
}
