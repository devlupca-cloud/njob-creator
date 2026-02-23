import Link from 'next/link'

export default function NotFound() {
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
          background: 'var(--color-surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-muted)' }}>404</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-foreground)', margin: 0 }}>
          Página não encontrada
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: 0, maxWidth: 300 }}>
          A página que você procura não existe ou foi movida.
        </p>
      </div>

      <Link
        href="/home"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 24px',
          borderRadius: 12,
          background: 'var(--color-primary)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Voltar ao início
      </Link>
    </div>
  )
}
