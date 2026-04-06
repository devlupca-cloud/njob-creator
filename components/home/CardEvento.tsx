'use client'

import React, { useState, useEffect } from 'react'
import { formatTimeLocal } from '@/lib/utils/datetime'
import { useTranslation } from '@/lib/i18n'
import { getLocaleBcp47 } from '@/lib/i18n'

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
  /** Preço do ingresso */
  ticketPrice?: number | null
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
  ticketPrice,
}: CardEventoProps) {
  const { t, locale } = useTranslation()
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
      className="rounded-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.25)] bg-[var(--color-surface)] transition-opacity duration-200"
      style={{
        cursor: isClickable ? 'pointer' : 'default', /* dynamic value - cannot be Tailwind */
        borderLeft: `4px solid ${borderColor}`, /* dynamic value - cannot be Tailwind */
        opacity: status === 'finished' ? 0.5 : 1, /* dynamic value - cannot be Tailwind */
      }}
    >
      <div className="px-3 py-2">
        {/* Título */}
        <p className="text-[var(--color-foreground)] text-xs m-0 leading-[1.4]">
          {title}
        </p>

        {/* Linha de info: data/hora à esquerda, duração+users à direita */}
        <div className="flex flex-row justify-between items-end mt-3.5">
          {/* Data e hora */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[var(--color-muted)] text-xs">
              {formatDate(date)}
            </span>
            <span className="text-[var(--color-foreground)] text-xs font-semibold">
              {formatTimeLocal(time, getLocaleBcp47(locale))}
            </span>
          </div>

          {/* Duração, participantes e preço */}
          <div className="flex flex-row items-center gap-2">
            <span className="flex items-center gap-1 text-[var(--color-foreground)] text-xs">
              <ClockIcon />
              {duration}
            </span>

            {typeEvento === 'live' && (
              <span className="flex items-center gap-1 text-[var(--color-foreground)] text-xs">
                <UserIcon />
                {users}
              </span>
            )}

            {ticketPrice != null && ticketPrice > 0 && (
              <span className="text-xs font-semibold text-[var(--color-primary)]">
                {ticketPrice.toLocaleString(getLocaleBcp47(locale), { style: 'currency', currency: 'BRL' })}
              </span>
            )}
          </div>
        </div>

        {/* Status do evento */}
        {status === 'available' && (
          <div className="mt-6 mb-2.5">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTapBTN?.()
              }}
              className="w-full h-10 rounded-lg bg-[var(--color-primary)] text-white border-none cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-opacity hover:opacity-[0.88]"
            >
              <VideoIcon />
              {textBTN}
            </button>
          </div>
        )}

        {status === 'upcoming' && (
          <div className="mt-4 mb-1.5 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-surface-2,rgba(255,255,255,0.05))] border border-[var(--color-border)]">
            <LockIcon />
            <span className="text-[13px] text-[var(--color-muted)]">
              {t('events.availableIn', { time: countdown || t('events.availableSoon') })}
            </span>
          </div>
        )}

        {status === 'finished' && (
          <div className="mt-4 mb-1.5 flex items-center justify-center gap-1.5 px-4 py-2">
            <span className="text-xs text-[var(--color-muted)] italic">
              {t('events.eventFinished')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
