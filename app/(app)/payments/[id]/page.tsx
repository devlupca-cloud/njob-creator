'use client'

import { useRouter, useParams } from 'next/navigation'
import { useCreator } from '@/lib/store/app-store'
import { useTranslation } from '@/lib/i18n'

export default function PaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const creator = useCreator()
  const { t } = useTranslation()
  const bank = creator?.account_details?.bank_account

  if (!params?.id) return null
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <button type="button" onClick={() => router.back()} style={{ marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
        ← {t('common.back')}
      </button>
      {bank ? (
        <div style={{ padding: 24, background: 'var(--color-surface-2)', borderRadius: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{t('payments.accountDetails')}</h1>
          <p style={{ margin: 0, fontSize: 14 }}>{t('payments.bank')}: {bank.bank_name}</p>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>{t('payments.last4Digits')}: ****{bank.last4}</p>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>{t('schedule.status')}: {bank.status}</p>
        </div>
      ) : (
        <p style={{ color: 'var(--color-muted)' }}>{t('payments.accountNotFound')}</p>
      )}
    </div>
  )
}
