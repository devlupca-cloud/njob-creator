'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL!

export default function AddPaymentPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const handleOpenStripe = async () => {
    setLoading(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) {
        toast.error(t('profile.sessionExpired'))
        return
      }

      const res = await fetch(`${base()}/functions/v1/creator-payout-update-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json().catch(() => ({}))

      // Accept account_onboarding error as valid (returns onboarding URL)
      if (!res.ok && data?.error !== 'account_onboarding') {
        toast.error(data?.message ?? data?.error ?? `HTTP ${res.status}`)
        return
      }

      const url = data?.url ?? data?.login_url ?? data?.onboarding_url
      if (url) {
        window.open(url, '_blank')
      } else {
        toast.error('Nenhum link retornado')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <button type="button" onClick={() => router.back()} style={{ marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
        ← {t('common.back')}
      </button>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>{t('payments.addCardTitle')}</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 24 }}>
        Configure seus dados de pagamento no Stripe para receber transferências.
      </p>
      <button
        type="button"
        onClick={handleOpenStripe}
        disabled={loading}
        style={{
          padding: '12px 24px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--color-primary)',
          color: '#fff',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontSize: 14,
          width: '100%',
        }}
      >
        {loading ? t('common.loading') : 'Abrir configuração Stripe'}
      </button>
    </div>
  )
}
