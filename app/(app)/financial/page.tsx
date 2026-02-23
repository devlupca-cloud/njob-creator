'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import { toast } from 'sonner'
import EmptyState from '@/components/ui/EmptyState'
import { useTranslation } from '@/lib/i18n'

const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL!

async function getStatement(year: number, month: number, token: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${base()}/functions/v1/get-creator-financial-statement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ year, month }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// STRIPE_DISABLED: getPayoutLink temporarily disabled
// async function getPayoutLink(token: string): Promise<{ url?: string }> {
//   const res = await fetch(`${base()}/functions/v1/creator-payout-update-link`, { ... })
//   return res.json()
// }

export default function FinancialPage() {
  const router = useRouter()
  const supabase = createClient()
  const creator = useCreator()
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return d.toISOString().slice(0, 10)
  })

  const { data: metrics } = useQuery({
    queryKey: ['get_creator_metrics', creator?.profile?.username],
    enabled: !!creator,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      const token = session.session?.access_token
      if (!uid || !token) return null
      const res = await fetch(`${base()}/rest/v1/rpc/get_creator_metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ p_profile_id: uid }),
      })
      if (!res.ok) return null
      const raw = await res.json()
      return Array.isArray(raw) ? raw[0] : raw
    },
  })

  const { data: statement, isLoading: statementLoading } = useQuery({
    queryKey: ['get-creator-financial-statement', year, month, creator?.profile?.username],
    enabled: !!creator && tab === 1,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) throw new Error('Não autenticado')
      return getStatement(year, month, token)
    },
  })

  // STRIPE_DISABLED: Payout link temporarily disabled
  const openPayoutLink = async () => {
    toast.info('Em breve')
  }

  const tabs = [t('financial.totalEarnings'), t('financial.history'), t('financial.withdraw')]
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>{t('financial.title')}</h1>
        <button type="button" onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          ← {t('common.back')}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: tab === i ? 'var(--color-primary)' : 'var(--color-surface-2)',
              color: tab === i ? '#fff' : 'var(--color-foreground)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: 16, background: 'var(--color-surface-2)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>{t('home.visits')} ({t('home.last30days')})</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{metrics?.visitas_30d ?? 0}</div>
          </div>
          <div style={{ padding: 16, background: 'var(--color-surface-2)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>{t('home.likes')} ({t('home.last30days')})</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{metrics?.curtidas_30d ?? 0}</div>
          </div>
          <div style={{ padding: 16, background: 'var(--color-surface-2)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>{t('home.revenue')} ({t('home.last30days')})</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>R$ {Number(metrics?.faturamento_30d ?? 0).toFixed(2)}</div>
          </div>
        </div>
      )}
      {tab === 1 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{t('financial.period')}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>{t('schedule.date')}</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const v = e.target.value
                    setStartDate(v)
                    if (v) {
                      const [y, m] = v.split('-').map(Number)
                      setYear(y)
                      setMonth(m)
                    }
                  }}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>{t('schedule.time')}</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value) || 1)}
                min={1}
                max={12}
                style={{ width: 60, padding: 8, borderRadius: 8, border: '1px solid var(--color-border)' }}
                title={t('schedule.minutes')}
              />
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
                style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid var(--color-border)' }}
                title={t('financial.period')}
              />
              <span style={{ fontSize: 12, color: 'var(--color-muted)', alignSelf: 'center' }}>{t('schedule.minutes')}/{t('financial.period')}</span>
            </div>
          </div>
          {statementLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>{t('common.loading')}</div>
          ) : statement ? (
            <pre style={{ padding: 16, background: 'var(--color-surface-2)', borderRadius: 8, overflow: 'auto', fontSize: 12 }}>
              {JSON.stringify(statement, null, 2)}
            </pre>
          ) : (
            <EmptyState title={t('financial.noTransactions')} description={t('financial.period')} />
          )}
        </>
      )}
      {tab === 2 && (
        <div>
          <p style={{ marginBottom: 16, color: 'var(--color-muted)', fontSize: 14 }}>
            {t('financial.withdraw')}
          </p>
          <button
            type="button"
            onClick={openPayoutLink}
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
            {t('financial.withdraw')}
          </button>
        </div>
      )}
    </div>
  )
}
