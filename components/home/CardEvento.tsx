'use client'

import React from 'react'
import { formatTimeLocal } from '@/lib/utils/datetime'

export type TipoEvento = 'live' | 'call'

interface CardEventoProps {
  typeEvento: TipoEvento
  title: string
  /** ISO string ou Date — hora do evento */
  time: string | Date
  /** Duração formatada (ex: '60m', '30m') */
  duration: string
  /** Texto do botão de ação */
  textBTN: string
  /** Callback ao clicar no botão de ação */
  onTapBTN?: () => void
  /** Quantidade de participantes (exibido apenas para 'live') */
  users?: number
  eventId: string
  /** ISO string ou Date — data do evento */
  date?: string | Date | null
}

// ─── Ícones inline ────────────────────────────────────────────────

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

const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8z" />
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────────

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '--/--/----'
  const d = typeof value === 'string' ? new Date(value) : value
  if (isNaN(d.getTime())) return '--/--/----'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Retorna true se o horário do evento for <= agora
 * (o botão de ação deve aparecer apenas a partir do horário do evento)
 */
function isTimeReached(time: string | Date): boolean {
  const eventTime = typeof time === 'string' ? new Date(time) : time
  return new Date() >= eventTime
}

// ─── Cores da borda esquerda por tipo ────────────────────────────
const borderColors: Record<TipoEvento, string> = {
  live: '#6E8BFF',
  call: '#FFDF6E',
}

/**
 * CardEvento
 * Replica do CardEventoWidget Flutter.
 * - Borda esquerda colorida: azul para live, amarelo para call
 * - Exibe data, hora, duração
 * - Contagem de participantes apenas para live
 * - Botão de ação aparece somente se hora >= agora
 * - Clicar no card inteiro também dispara onTapBTN (comportamento Flutter)
 */
export default function CardEvento({
  typeEvento,
  title,
  time,
  duration,
  textBTN,
  onTapBTN,
  users = 0,
  eventId,
  date,
}: CardEventoProps) {
  const showButton = isTimeReached(time)
  const borderColor = borderColors[typeEvento] ?? '#FFDF6E'

  return (
    <div
      onClick={onTapBTN}
      style={{
        cursor: onTapBTN ? 'pointer' : 'default',
        borderRadius: 4,
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
        background: 'var(--color-surface)',
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <div style={{ padding: '8px 12px' }}>
        {/* Título */}
        <p
          style={{
            color: 'var(--color-foreground)',
            fontSize: 12,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {title}
        </p>

        {/* Linha de info: data/hora à esquerda, duração+users à direita */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 14,
          }}
        >
          {/* Data e hora */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{
                color: 'var(--color-muted)',
                fontSize: 12,
              }}
            >
              {formatDate(date)}
            </span>
            <span
              style={{
                color: 'var(--color-foreground)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {formatTimeLocal(time)}
            </span>
          </div>

          {/* Duração e participantes */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--color-foreground)',
                fontSize: 12,
              }}
            >
              <ClockIcon />
              {duration}
            </span>

            {typeEvento === 'live' && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--color-foreground)',
                  fontSize: 12,
                }}
              >
                <UserIcon />
                {users}
              </span>
            )}
          </div>
        </div>

        {/* Botão de ação — aparece apenas quando hora >= agora */}
        {showButton && (
          <div style={{ marginTop: 24, marginBottom: 10 }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTapBTN?.()
              }}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 8,
                background: 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                transition: 'opacity 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <VideoIcon />
              {textBTN}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
