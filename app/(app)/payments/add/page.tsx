'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL!

export default function AddPaymentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const openPayoutLink = async () => {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) {
      toast.error('Sessão expirada')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${base()}/functions/v1/creator-payout-update-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      const url = data?.url
      if (url) window.open(url, '_blank')
      else toast.error('Link não disponível')
      router.push('/payments')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <button type="button" onClick={() => router.back()} style={{ marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
        ← Voltar
      </button>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Adicionar cartão / conta</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 24 }}>
        Você será redirecionado ao Stripe para cadastrar ou atualizar seus dados de pagamento.
      </p>
      <button
        type="button"
        onClick={openPayoutLink}
        disabled={loading}
        style={{
          padding: '12px 24px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--color-primary)',
          color: '#fff',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 14,
        }}
      >
        {loading ? 'Abrindo...' : 'Continuar'}
      </button>
    </div>
  )
}
