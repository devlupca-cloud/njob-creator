'use client'

import Button from '@/components/ui/Button'

interface ComingSoonModalProps {
  open: boolean
  onClose: () => void
  feature?: string
}

export default function ComingSoonModal({
  open,
  onClose,
  feature = 'Este recurso',
}: ComingSoonModalProps) {
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
            animation: 'comingSoonModalIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
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
            Em breve!
          </h2>

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
            {feature} estará disponível na próxima versão. Fique ligado nas novidades!
          </p>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onClose}
          >
            Entendi
          </Button>
        </div>
      </div>
    </>
  )
}
