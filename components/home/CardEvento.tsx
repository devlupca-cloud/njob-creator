'use client'

import React, { useState, useEffect } from 'react'
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

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────────

/** Minutos de antecedência para liberar a entrada */
const BUFFER_MINUTES = 15

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '--/--/----'
  const d = typeof value === 'string' ? new Date(value) : value
  if (isNaN(d.getTime())) return '--/--/----'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

type EventStatus = 'upcoming' | 'available' | 'finished'

/**
 * Retorna o status do evento baseado no horário atual:
 * - upcoming: falta mais de BUFFER_MINUTES para o evento
 * - available: dentro da janela (BUFFER_MINUTES antes até fim do evento)
 * - finished: evento já terminou (start + duração)
 */
function getEventStatus(time: string | Date, durationStr: string): EventStatus {
  const eventTime = typeof time === 'string' ? new Date(time) : time
  const now = new Date()

  // Parse duração em minutos (ex: "60m", "30m")
  const durationMin = parseInt(durationStr.replace(/\D/g, ''), 10) || 60
  const eventEnd = new Date(eventTime.getTime() + durationMin * 60 * 1000)
  const bufferStart = new Date(eventTime.getTime() - BUFFER_MINUTES * 60 * 1000)

  if (now > eventEnd) return 'finished'
  if (now >= bufferStart) return 'available'
  return 'upcoming'
}

/**
 * Calcula quanto tempo falta para o buffer iniciar.
 * Retorna string formatada como "Xh Xmin" ou "Xmin"
 */
function getTimeUntilAvailable(time: string | Date): string {
  const eventTime = typeof time === 'string' ? new Date(time) : time
  const bufferStart = new Date(eventTime.getTime() - BUFFER_MINUTES * 60 * 1000)
  const now = new Date()
  const diffMs = bufferStart.getTime() - now.getTime()

  if (diffMs <= 0) return ''

  const totalMin = Math.ceil(diffMs / 60000)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60

  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`
  if (hours > 0) return `${hours}h`
  return `${mins}min`
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
 * - Botão de ação aparece somente 15min antes do horário agendado
 * - Mostra countdown/status quando o evento ainda não está disponível
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
  const [status, setStatus] = useState<EventStatus>(() => getEventStatus(time, duration))
  const [countdown, setCountdown] = useState(() => getTimeUntilAvailable(time))

  // Atualiza o status a cada 30 segundos
  useEffect(() => {
    const update = () => {
      setStatus(getEventStatus(time, duration))
      setCountdown(getTimeUntilAvailable(time))
    }

    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [time, duration])

  const borderColor = borderColors[typeEvento] ?? '#FFDF6E'
  const isClickable = status === 'available' && !!onTapBTN

  return (
    <div
      onClick={isClickable ? onTapBTN : undefined}
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        borderRadius: 4,
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
        background: 'var(--color-surface)',
        borderLeft: `4px solid ${borderColor}`,
        opacity: status === 'finished' ? 0.5 : 1,
        transition: 'opacity 200ms',
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

        {/* Status do evento */}
        {status === 'available' && (
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

        {status === 'upcoming' && (
          <div
            style={{
              marginTop: 16,
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              background: 'var(--color-surface-2, rgba(255,255,255,0.05))',
              border: '1px solid var(--color-border)',
            }}
          >
            <LockIcon />
            <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              Disponível em {countdown || 'breve'}
            </span>
          </div>
        )}

        {status === 'finished' && (
          <div
            style={{
              marginTop: 16,
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 16px',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>
              Evento encerrado
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
