'use client'

import { useState } from 'react'
import Link from 'next/link'
import AppDrawer from '@/components/ui/AppDrawer'

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
)

/**
 * Mobile-only top bar with hamburger that opens AppDrawer.
 * Renders nothing on desktop (md and up).
 */
export default function MobileAppBar() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <header
        className="md:hidden flex items-center justify-between h-14 px-4 shrink-0 z-30"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:bg-surface-2"
          style={{ color: 'var(--color-foreground)' }}
          aria-label="Abrir menu"
        >
          <MenuIcon />
        </button>
        <Link href="/home" className="text-lg font-bold text-gradient-primary" aria-label="Ir para Home">
          njob
        </Link>
        <div className="w-10" /> {/* spacer for center logo */}
      </header>
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
