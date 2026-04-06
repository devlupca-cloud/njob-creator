'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useCreator, useAppStore } from '@/lib/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { getCreatorInfo } from '@/lib/supabase/creator'
import { useTranslation } from '@/lib/i18n'

export default function PaymentsPage() {
  const router = useRouter()
  const creator = useCreator()
  const setCreator = useAppStore((s) => s.setCreator)
  const { t } = useTranslation()

  // Refetch creator data to keep account_details fresh
  useQuery({
    queryKey: ['creator-profile'],
    queryFn: async () => {
      const supabase = createClient()
      const info = await getCreatorInfo(supabase)
      if (info) setCreator(info)
      return info
    },
    enabled: !!creator,
  })

  const accountDetails = creator?.account_details
  const bank = accountDetails?.bank_account

  return (
    <div className="max-w-[720px] mx-auto">
      <h1 className="text-xl font-semibold mb-4">{t('payments.title')}</h1>
      <p className="text-[var(--color-muted)] text-sm mb-6">
        {t('payments.subtitle')}
      </p>
      {bank ? (
        <div className="p-4 bg-[var(--color-surface-2)] rounded-lg mb-4">
          <div className="font-semibold mb-1">{t('payments.bankAccount')}</div>
          <div className="text-sm text-[var(--color-muted)]">
            ****{bank.last4} · {bank.bank_name}
          </div>
          <button
            type="button"
            onClick={() => router.push('/payments/add')}
            className="mt-3 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-transparent cursor-pointer text-sm"
          >
            {t('payments.updateData')}
          </button>
        </div>
      ) : (
        <div className="p-6 bg-[var(--color-surface-2)] rounded-lg mb-4 text-center text-[var(--color-muted)]">
          {t('payments.noAccount')}
        </div>
      )}
      <button
        type="button"
        onClick={() => router.push('/payments/add')}
        className="px-6 py-3 rounded-lg border-none bg-[var(--color-primary)] text-white font-semibold cursor-pointer text-sm"
      >
        {bank ? t('payments.changeAccount') : t('payments.addCard')}
      </button>
    </div>
  )
}
