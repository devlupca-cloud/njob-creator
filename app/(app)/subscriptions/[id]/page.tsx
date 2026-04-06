'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import { getAvailableCoupons, type CouponItem } from '@/lib/api/coupons'
import { useTranslation } from '@/lib/i18n'

export default function CouponDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const supabase = createClient()
  const creator = useCreator()
  const router = useRouter()
  const { t } = useTranslation()
  const [coupon, setCoupon] = useState<CouponItem | null>(null)

  useEffect(() => {
    if (!id || !creator) return
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) return
      const list = await getAvailableCoupons(token)
      const c = list.find((x) => x.id === id)
      setCoupon(c ?? null)
    })()
  }, [id, creator, supabase])

  if (!id) return null
  if (!coupon) return <div className="p-6">{t('common.loading')}</div>

  return (
    <div className="max-w-[480px] mx-auto">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 bg-transparent border-none cursor-pointer text-sm"
      >
        ← {t('common.back')}
      </button>
      <div className="p-6 bg-[var(--color-surface-2)] rounded-xl">
        <h1 className="text-xl font-semibold mb-2">{coupon.code}</h1>
        {coupon.image_url && (
          <img
            src={coupon.image_url}
            alt=""
            className="w-full max-h-[200px] object-cover rounded-lg mb-4"
          />
        )}
        <p className="m-0 text-sm text-[var(--color-muted)] mb-2">{coupon.description ?? '—'}</p>
        <p className="m-0 text-sm">{t('subscriptions.store')}: {coupon.store_name ?? '—'}</p>
        {coupon.valid_from && (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {t('subscriptions.validFrom')} {coupon.valid_from} {t('subscriptions.validUntil')} {coupon.valid_until ?? '—'}
          </p>
        )}
        {coupon.discount_value != null && (
          <p className="mt-2 text-sm font-semibold">
            {t('subscriptions.discount')}: {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`}
          </p>
        )}
      </div>
    </div>
  )
}
