'use client'

import Button from '@/components/ui/Button'
import { useTranslation } from '@/lib/i18n'

interface ComingSoonModalProps {
  open: boolean
  onClose: () => void
  feature?: string
}

export default function ComingSoonModal({
  open,
  onClose,
  feature,
}: ComingSoonModalProps) {
  const { t } = useTranslation()
  const featureName = feature || t('modals.comingSoonDefaultFeature')
  if (!open) return null

  return (
    <>
      <style>{`
        @keyframes comingSoonModalIn {
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

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coming-soon-title"
        className="fixed inset-0 z-50 bg-black/[0.72] backdrop-blur-[4px] flex items-center justify-center p-6"
        onClick={onClose}
      >
        <div
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 max-w-[380px] w-full flex flex-col items-center gap-0 [animation:comingSoonModalIn_220ms_cubic-bezier(0.22,1,0.36,1)_both]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="size-[72px] rounded-full bg-[rgba(174,50,195,0.12)] border-[1.5px] border-[rgba(174,50,195,0.25)] flex items-center justify-center mb-5 shrink-0">
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="rgba(174,50,195,0.18)"
                stroke="#AE32C3"
                strokeWidth="1.5"
              />
              <path
                d="M12 6v6l4 2"
                stroke="#AE32C3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2
            id="coming-soon-title"
            className="m-0 mb-2.5 text-lg font-bold text-[var(--color-foreground)] text-center leading-[1.3]"
          >
            {t('modals.comingSoonTitle')}
          </h2>

          <p className="m-0 mb-7 text-sm text-[var(--color-muted)] text-center leading-[1.6]">
            {t('modals.comingSoonDescription', { feature: featureName })}
          </p>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onClose}
          >
            {t('common.understood')}
          </Button>
        </div>
      </div>
    </>
  )
}
