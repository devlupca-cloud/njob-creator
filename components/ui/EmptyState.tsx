'use client'

interface EmptyStateProps {
  title: string
  description?: string
  /** Optional emoji or icon character */
  icon?: string
}

export default function EmptyState({ title, description, icon = '—' }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: 32,
        textAlign: 'center',
        color: 'var(--color-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-foreground)' }}>{title}</p>
      {description && <p style={{ margin: 0, fontSize: 12, maxWidth: 280 }}>{description}</p>}
    </div>
  )
}
