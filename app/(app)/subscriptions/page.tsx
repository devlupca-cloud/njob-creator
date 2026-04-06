'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import { getAvailableCoupons, type CouponItem } from '@/lib/api/coupons'
import EmptyState from '@/components/ui/EmptyState'
import { useTranslation } from '@/lib/i18n'

function formatDiscount(c: CouponItem): string | null {
  if (c.discount_type === 'percentage' && c.discount_value != null) {
    return `${c.discount_value}% off`
  }
  if (c.discount_type === 'fixed' && c.discount_value != null) {
    return `R$ ${c.discount_value.toFixed(2)} off`
  }
  return null
}

function Spinner() {
  return (
    <div className="flex justify-center items-center p-12">
      <div className="size-10 rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
    </div>
  )
}

const TicketIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2" />
    <path d="M13 17v2" />
    <path d="M13 11v2" />
  </svg>
)

const ChevronIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export default function SubscriptionsPage() {
  const supabase = createClient()
  const creator = useCreator()
  const router = useRouter()
  const { t } = useTranslation()

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['get_available_coupons', creator?.profile?.username],
    enabled: !!creator,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) return []
      return getAvailableCoupons(token)
    },
  })

  return (
    <div className="max-w-[720px] mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold m-0 text-[var(--color-foreground)]">
          {t('subscriptions.couponsTitle')}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1.5 mb-0">
          {t('subscriptions.couponsSubtitle')}
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : coupons.length === 0 ? (
        <EmptyState
          title={t('subscriptions.noCoupons')}
          description={t('subscriptions.emptyCoupons')}
          icon="🎫"
        />
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {(coupons as CouponItem[]).map((c) => {
            const discount = formatDiscount(c)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/subscriptions/${encodeURIComponent(c.id)}`)}
                className="flex items-stretch gap-3.5 p-0 border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] cursor-pointer text-left overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-[box-shadow,transform] duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
              >
                {/* Imagem ou placeholder */}
                <div className="w-24 min-w-[96px] bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]">
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <TicketIcon />
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-3.5 py-3.5 flex flex-col justify-center gap-1">
                  <span className="text-base font-bold text-[var(--color-primary)] tracking-[0.02em]">
                    {c.code}
                  </span>
                  {(c.description || c.store_name) && (
                    <span
                      className="text-[13px] text-[var(--color-muted)] leading-[1.35]"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }} /* dynamic value - cannot be Tailwind (webkit-specific) */
                    >
                      {c.description ?? c.store_name}
                    </span>
                  )}
                  {discount && (
                    <span className="text-xs font-semibold text-[var(--color-foreground)] mt-0.5">
                      {discount}
                    </span>
                  )}
                </div>

                <div className="flex items-center pr-3 text-[var(--color-muted)]">
                  <ChevronIcon />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
