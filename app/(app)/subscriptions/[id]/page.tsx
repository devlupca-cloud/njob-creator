'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import { getAvailableCoupons, type CouponItem } from '@/lib/api/coupons'

export default function CouponDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const supabase = createClient()
  const creator = useCreator()
  const router = useRouter()
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
  if (!coupon) return <div style={{ padding: 24 }}>Carregando...</div>

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <button type="button" onClick={() => router.back()} style={{ marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
        ← Voltar
      </button>
      <div style={{ padding: 24, background: 'var(--color-surface-2)', borderRadius: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{coupon.code}</h1>
        {coupon.image_url && (
          <img src={coupon.image_url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />
        )}
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-muted)', marginBottom: 8 }}>{coupon.description ?? '—'}</p>
        <p style={{ margin: 0, fontSize: 14 }}>Loja: {coupon.store_name ?? '—'}</p>
        {coupon.valid_from && <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>Válido de {coupon.valid_from} até {coupon.valid_until ?? '—'}</p>}
        {coupon.discount_value != null && (
          <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 600 }}>
            Desconto: {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`}
          </p>
        )}
      </div>
    </div>
  )
}
