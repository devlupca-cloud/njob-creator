'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { useAppStore } from '@/lib/store/app-store'
import { useTranslation } from '@/lib/i18n'

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
  const { t } = useTranslation()

  if (!open) return null

  const description = message ?? t('modals.guestDescription')

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
        className="fixed inset-0 z-50 bg-black/[0.72] backdrop-blur-[4px] flex items-center justify-center p-6"
        onClick={onClose}
      >
        {/* Panel — stops click propagation so overlay click only fires on the backdrop */}
        <div
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 max-w-[380px] w-full flex flex-col items-center gap-0 [animation:guestModalIn_220ms_cubic-bezier(0.22,1,0.36,1)_both]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon container */}
          <div className="size-[72px] rounded-full bg-[rgba(174,50,195,0.12)] border-[1.5px] border-[rgba(174,50,195,0.25)] flex items-center justify-center mb-5 shrink-0">
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
            className="m-0 mb-2.5 text-lg font-bold text-[var(--color-foreground)] text-center leading-[1.3]"
          >
            {t('modals.guestTitle')}
          </h2>

          {/* Description */}
          <p className="m-0 mb-7 text-sm text-[var(--color-muted)] text-center leading-[1.6]">
            {description}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 w-full">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleRegister}
            >
              {t('modals.guestRegister')}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={onClose}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
