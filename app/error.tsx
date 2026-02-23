'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-background)',
        padding: '0 24px',
        textAlign: 'center',
        gap: 24,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-foreground)', margin: 0 }}>
          Algo deu errado
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: 0, maxWidth: 320 }}>
          Ocorreu um erro inesperado. Tente novamente.
        </p>
      </div>

      <button
        onClick={reset}
        style={{
          padding: '10px 24px',
          borderRadius: 12,
          background: 'var(--color-primary)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
