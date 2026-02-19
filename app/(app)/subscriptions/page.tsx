'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import { getAvailableCoupons, type CouponItem } from '@/lib/api/coupons'
import EmptyState from '@/components/ui/EmptyState'

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
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: 'var(--color-foreground)' }}>
          Cupons
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '6px 0 0' }}>
          Ofertas e descontos disponíveis na loja
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : coupons.length === 0 ? (
        <EmptyState
          title="Nenhum cupom disponível"
          description="Quando houver ofertas ou descontos, eles aparecerão aqui."
          icon="🎫"
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {(coupons as CouponItem[]).map((c) => {
            const discount = formatDiscount(c)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/subscriptions/${encodeURIComponent(c.id)}`)}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 14,
                  padding: 0,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  transition: 'box-shadow 0.2s, transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Imagem ou placeholder */}
                <div
                  style={{
                    width: 96,
                    minWidth: 96,
                    background: 'var(--color-surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-muted)',
                  }}
                >
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <TicketIcon />
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '14px 14px 14px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {c.code}
                  </span>
                  {(c.description || c.store_name) && (
                    <span
                      style={{
                        fontSize: 13,
                        color: 'var(--color-muted)',
                        lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {c.description ?? c.store_name}
                    </span>
                  )}
                  {discount && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--color-foreground)',
                        marginTop: 2,
                      }}
                    >
                      {discount}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    paddingRight: 12,
                    color: 'var(--color-muted)',
                  }}
                >
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
