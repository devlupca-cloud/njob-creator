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
    <div className="max-w-[480px] mx-auto">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 bg-transparent border-none cursor-pointer text-sm"
      >
        ← {t('common.back')}
      </button>
      <h1 className="text-xl font-semibold mb-4">{t('payments.addCardTitle')}</h1>
      <p className="text-[var(--color-muted)] text-sm mb-6">
        Configure seus dados de pagamento no Stripe para receber transferências.
      </p>
      <button
        type="button"
        onClick={handleOpenStripe}
        disabled={loading}
        className={[
          'px-6 py-3 rounded-lg border-none bg-[var(--color-primary)] text-white font-semibold text-sm w-full',
          loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer opacity-100',
        ].join(' ')}
      >
        {loading ? t('common.loading') : 'Abrir configuração Stripe'}
      </button>
    </div>
  )
}
