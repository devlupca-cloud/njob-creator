'use client'

// STRIPE_DISABLED: Stripe payout link temporarily disabled.

import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'

export default function AddPaymentPage() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <button type="button" onClick={() => router.back()} style={{ marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
        ← {t('common.back')}
      </button>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>{t('payments.addCardTitle')}</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 24 }}>
        Funcionalidade de pagamento em breve.
      </p>
    </div>
  )
}
