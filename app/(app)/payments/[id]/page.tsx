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
    <div className="max-w-[480px] mx-auto">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 bg-transparent border-none cursor-pointer text-sm"
      >
        ← {t('common.back')}
      </button>
      {bank ? (
        <div className="p-6 bg-[var(--color-surface-2)] rounded-xl">
          <h1 className="text-lg font-semibold mb-3">{t('payments.accountDetails')}</h1>
          <p className="m-0 text-sm">{t('payments.bank')}: {bank.bank_name}</p>
          <p className="mt-2 text-sm">{t('payments.last4Digits')}: ****{bank.last4}</p>
          <p className="mt-2 text-sm">{t('schedule.status')}: {bank.status}</p>
        </div>
      ) : (
        <p className="text-[var(--color-muted)]">{t('payments.accountNotFound')}</p>
      )}
    </div>
  )
}
