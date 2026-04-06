'use client'

interface EmptyStateProps {
  title: string
  description?: string
  /** Optional emoji or icon character */
  icon?: string
}

export default function EmptyState({ title, description, icon = '—' }: EmptyStateProps) {
  return (
    <div className="p-8 text-center text-[var(--color-muted)] flex flex-col items-center gap-2">
      <span className="text-[28px] leading-none">{icon}</span>
      <p className="m-0 text-sm font-semibold text-[var(--color-foreground)]">{title}</p>
      {description && <p className="m-0 text-xs max-w-[280px]">{description}</p>}
    </div>
  )
}
