'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { useAppStore } from '@/lib/store/app-store'

// ─── Types ──────────────────────────────────────────────────────────────────

interface GuestAuthModalProps {
  open: boolean
  onClose: () => void
  message?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Removes a cookie by setting its expiry to the past. */
function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function GuestAuthModal({
  open,
  onClose,
  message,
}: GuestAuthModalProps) {
  const router = useRouter()
  const setGuest = useAppStore((s) => s.setGuest)

  if (!open) return null

  const description =
    message ??
    'Para acessar este recurso, você precisa de uma conta NJob. O cadastro é rápido e gratuito.'

  function handleRegister() {
    // 1. Close modal first to avoid any flash
    onClose()
    // 2. Clear guest cookie
    deleteCookie('njob-guest')
    // 3. Clear guest flag from store
    setGuest(false)
    // 4. Navigate to register
    router.push('/register')
  }

  return (
    <>
      {/* Keyframe animation defined once inline — no external CSS dependency */}
      <style>{`
        @keyframes guestModalIn {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      {/* Overlay */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-auth-title"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
        onClick={onClose}
      >
        {/* Panel — stops click propagation so overlay click only fires on the backdrop */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 16,
            padding: 32,
            maxWidth: 380,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            animation: 'guestModalIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon container */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(174, 50, 195, 0.12)',
              border: '1.5px solid rgba(174, 50, 195, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              flexShrink: 0,
            }}
          >
            {/* Shield with lock — SVG inline */}
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              {/* Shield body */}
              <path
                d="M12 2L4 6v5c0 5.25 3.5 10.15 8 11.35C16.5 21.15 20 16.25 20 11V6L12 2Z"
                fill="rgba(174,50,195,0.18)"
                stroke="#AE32C3"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Lock body */}
              <rect
                x="9"
                y="11"
                width="6"
                height="5"
                rx="1"
                fill="#AE32C3"
              />
              {/* Lock shackle */}
              <path
                d="M10 11V9.5a2 2 0 0 1 4 0V11"
                stroke="#AE32C3"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Keyhole dot */}
              <circle cx="12" cy="13.5" r="0.75" fill="#fff" />
            </svg>
          </div>

          {/* Title */}
          <h2
            id="guest-auth-title"
            style={{
              margin: 0,
              marginBottom: 10,
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--color-foreground)',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            Crie sua conta para continuar
          </h2>

          {/* Description */}
          <p
            style={{
              margin: 0,
              marginBottom: 28,
              fontSize: 14,
              color: 'var(--color-muted)',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              width: '100%',
            }}
          >
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleRegister}
            >
              Cadastrar
            </Button>

            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
