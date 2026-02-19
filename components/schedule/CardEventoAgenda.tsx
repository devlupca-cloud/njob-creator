'use client'

import React from 'react'

export type TipoEventoAgenda = 'live' | 'call'

export interface CardEventoAgendaProps {
  title: string
  /** Time string e.g. "14:30" (from event.time or start_date+time) */
  time: string
  typeEvent: TipoEventoAgenda
  /** Duration string e.g. "60" (minutes) */
  duration: string
  /** Attendee count (shown only for live) */
  count?: number | null
  onTap: () => void
}

const borderColors: Record<TipoEventoAgenda, string> = {
  live: '#6E8BFF',
  call: '#FFDF6E',
}

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)
const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
)
const ActionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l3 3 3-3" />
    <path d="M12 9v6" />
  </svg>
)

/**
 * CardEventoAgenda — replica do CardEventoAgendaWidget Flutter.
 * Layout: hora à esquerda, card à direita (título, hora, duração, count para live). onTap abre detalhes.
 */
export default function CardEventoAgenda({
  title,
  time,
  typeEvent,
  duration,
  count,
  onTap,
}: CardEventoAgendaProps) {
  const borderColor = borderColors[typeEvent] ?? '#FFDF6E'

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 30 }}>
      {/* Hora à esquerda */}
      <span
        style={{
          color: 'var(--color-muted)',
          fontSize: 12,
          flexShrink: 0,
          marginTop: 10,
        }}
      >
        {time}
      </span>

      {/* Card clicável */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            height: 1,
            background: 'var(--color-muted)',
            marginBottom: 10,
          }}
        />
        <button
          type="button"
          onClick={onTap}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '4px 12px',
            borderRadius: 4,
            background: 'var(--color-surface)',
            border: 'none',
            borderLeft: `4px solid ${borderColor}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-foreground)', fontSize: 12, fontWeight: 500 }}>
              {title || '-'}
            </span>
            <ActionIcon />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 14,
              gap: 8,
            }}
          >
            <span style={{ color: 'var(--color-foreground)', fontSize: 12 }}>{time}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-foreground)' }}>
                <ClockIcon />
                {duration}
              </span>
              {typeEvent === 'live' && count != null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-foreground)' }}>
                  <UserIcon />
                  {count}
                </span>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
