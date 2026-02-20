'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCreator } from '@/lib/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// ─── Icons ───────────────────────────────────────────────────────────────────

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
)

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
)

const XCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
)

const LogOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const DollarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

// ─── Menu Item ────────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  danger?: boolean
}

function MenuItem({ icon, label, href, onClick, danger = false }: MenuItemProps) {
  const color = danger ? 'var(--color-error)' : 'var(--color-primary)'
  const textColor = danger ? 'var(--color-error)' : 'var(--color-foreground)'

  const content = (
    <div
      className="flex items-center gap-3 py-3 px-1 transition-colors cursor-pointer hover:bg-surface rounded-lg"
      style={{ minHeight: '44px' }}
    >
      <span style={{ color }}>{icon}</span>
      <span className="flex-1 text-sm" style={{ color: textColor }}>
        {label}
      </span>
      {!danger && (
        <span style={{ color: 'var(--color-muted)' }}>
          <ChevronRightIcon />
        </span>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return <div onClick={onClick}>{content}</div>
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: '1px', background: 'var(--color-border)' }} />
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const creator = useCreator()
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(false)

  const handleFinanceiro = async () => {
    setLoadingFinanceiro(true)
    try {
      const supabaseClient = createClient()
      const { data: session } = await supabaseClient.auth.getSession()
      const token = session.session?.access_token
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.')
        return
      }

      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

      // Tenta link de atualização (conta Stripe já completou onboarding)
      const res = await fetch(`${baseUrl}/functions/v1/creator-payout-update-link`, {
        method: 'POST',
        headers,
      })

      let data = await res.json()

      // Se a conta ainda não completou o onboarding, faz fallback para o link de onboarding
      if (!res.ok && data?.error?.includes?.('account_onboarding')) {
        const onboardingRes = await fetch(`${baseUrl}/functions/v1/create-stripe-connected-account`, {
          method: 'POST',
          headers,
        })
        if (!onboardingRes.ok) throw new Error('Erro ao gerar link de onboarding')
        data = await onboardingRes.json()
        toast.info('Você precisa completar o cadastro no Stripe primeiro.')
      } else if (!res.ok) {
        throw new Error(data?.error || 'Erro ao gerar link')
      }

      const url = data?.url ?? data?.onboarding_url
      if (url && typeof url === 'string') {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error('Não foi possível abrir o painel financeiro.')
      }
    } catch {
      toast.error('Erro ao acessar o financeiro. Tente novamente.')
    } finally {
      setLoadingFinanceiro(false)
    }
  }

  const handleInativarConta = () => {
    toast.error('Esta funcionalidade ainda não está disponível.')
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: 'var(--color-background)' }}
    >
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <h1
          className="text-center text-base font-semibold"
          style={{ color: 'var(--color-foreground)' }}
        >
          Perfil
        </h1>
      </div>

      {/* Profile summary — toque leva para Informações pessoais */}
      {creator && (
        <Link
          href="/profile/info"
          className="block px-4 py-4 flex items-center gap-4 active:opacity-90 transition-opacity"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div
            className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0"
            style={{ background: 'var(--color-surface-2)' }}
          >
            {creator.profile.avatar_url ? (
              <img
                src={creator.profile.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--color-muted)' }}>
                <UserIcon />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold truncate" style={{ color: 'var(--color-foreground)' }}>
              {creator.profile.full_name?.trim() || 'Definir nome'}
            </p>
            <p className="text-sm truncate" style={{ color: 'var(--color-muted)' }}>
              {creator.profile.username?.trim()
                ? `@${creator.profile.username}`
                : 'Definir @usuário'}
            </p>
          </div>
          <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}>
            <ChevronRightIcon />
          </span>
        </Link>
      )}

      {/* Menu */}
      <div className="flex-1 px-4 py-2">
        <MenuItem
          icon={<UserIcon />}
          label="Informações pessoais"
          href="/profile/info"
        />
        <Divider />
        <MenuItem
          icon={<DollarIcon />}
          label={loadingFinanceiro ? 'Abrindo painel...' : 'Financeiro'}
          onClick={handleFinanceiro}
        />
        <Divider />
        <MenuItem
          icon={<InfoIcon />}
          label="Sobre essa versão"
          onClick={() => toast('njob Creator Web — v1.0.0')}
        />
        <Divider />
        <MenuItem
          icon={<XCircleIcon />}
          label="Inativar conta"
          onClick={handleInativarConta}
          danger
        />
        <Divider />
        <MenuItem
          icon={<LogOutIcon />}
          label="Sair"
          onClick={handleLogout}
          danger
        />
      </div>
    </div>
  )
}
