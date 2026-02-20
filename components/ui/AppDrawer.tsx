'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/supabase/auth'
import { useState } from 'react'
import { useAppStore, useIsGuest } from '@/lib/store/app-store'
import GuestAuthModal from '@/components/ui/GuestAuthModal'

export interface DrawerItem {
  label: string
  href: string
  icon: React.ReactNode
}

const CouponsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2M13 17v2M13 11v2" />
  </svg>
)

const SupportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const NotificationsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
)

const FinancialIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const PaymentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
)

const PlanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const SignOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
)

const drawerItems: DrawerItem[] = [
  { label: 'Cupons', href: '/subscriptions', icon: <CouponsIcon /> },
  { label: 'Suporte', href: '/support', icon: <SupportIcon /> },
  { label: 'Notificações', href: '/notifications', icon: <NotificationsIcon /> },
  { label: 'Financeiro', href: '/financial', icon: <FinancialIcon /> },
  { label: 'Pagamentos', href: '/payments', icon: <PaymentsIcon /> },
  { label: 'Planos de assinatura', href: '/subscription-plans', icon: <PlanIcon /> },
]

interface AppDrawerProps {
  open: boolean
  onClose: () => void
}

export default function AppDrawer({ open, onClose }: AppDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isGuest = useIsGuest()
  const setGuest = useAppStore((s) => s.setGuest)
  const [guestModalOpen, setGuestModalOpen] = useState(false)

  const handleSignOut = async () => {
    onClose()
    if (isGuest) {
      document.cookie = 'njob-guest=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
      setGuest(false)
    } else {
      await signOut()
    }
    router.push('/login')
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        role="presentation"
        className="md:hidden fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      {/* Drawer panel */}
      <aside
        className="md:hidden fixed top-0 left-0 z-50 h-full w-[280px] max-w-[85vw] flex flex-col py-6 shadow-xl"
        style={{
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease-out',
        }}
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="px-5 mb-6">
          <span className="text-xl font-bold text-gradient-primary">njob</span>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5 px-3 overflow-y-auto">
          {drawerItems.map((item) => {
            const isActive = pathname === item.href

            // Convidado: qualquer item abre modal de cadastro
            if (isGuest) {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => { onClose(); setGuestModalOpen(true) }}
                  className={[
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px]',
                    isActive ? 'bg-gradient-primary text-white' : 'hover:bg-surface-2',
                  ].join(' ')}
                  style={!isActive ? { color: 'var(--color-foreground)' } : undefined}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px]',
                  isActive ? 'bg-gradient-primary text-white' : 'hover:bg-surface-2',
                ].join(' ')}
                style={!isActive ? { color: 'var(--color-foreground)' } : undefined}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium w-full transition-colors hover:bg-surface-2 min-h-[48px]"
            style={{ color: 'var(--color-error)' }}
          >
            <SignOutIcon />
            Sair
          </button>
        </div>
      </aside>

      <GuestAuthModal
        open={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        message="Você precisa de uma conta para navegar pela plataforma."
      />
    </>
  )
}
