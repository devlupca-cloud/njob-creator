'use client'

import { useRouter } from 'next/navigation'
import { useCreator } from '@/lib/store/app-store'

export default function PaymentsPage() {
  const router = useRouter()
  const creator = useCreator()
  const accountDetails = creator?.account_details
  const bank = accountDetails?.bank_account

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Pagamentos</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 24 }}>
        Gerencie os dados para recebimento de pagamentos.
      </p>
      {bank ? (
        <div style={{ padding: 16, background: 'var(--color-surface-2)', borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Conta bancária</div>
          <div style={{ fontSize: 14, color: 'var(--color-muted)' }}>
            ****{bank.last4} · {bank.bank_name}
          </div>
          <button
            type="button"
            onClick={() => router.push('/payments/add')}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Atualizar dados
          </button>
        </div>
      ) : (
        <div style={{ padding: 24, background: 'var(--color-surface-2)', borderRadius: 8, marginBottom: 16, textAlign: 'center', color: 'var(--color-muted)' }}>
          Nenhuma conta cadastrada.
        </div>
      )}
      <button
        type="button"
        onClick={() => router.push('/payments/add')}
        style={{
          padding: '12px 24px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--color-primary)',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        {bank ? 'Alterar conta' : 'Adicionar cartão/conta'}
      </button>
    </div>
  )
}
