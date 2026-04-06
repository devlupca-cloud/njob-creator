'use client'

import React from 'react'
import { useTranslation } from '@/lib/i18n'

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
  /** Status da call (requested, confirmed, completed, cancelled_*, rejected) */
  callStatus?: string
  /** Nome do cliente que comprou a call */
  clientName?: string
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
/** Resolve call status to badge color + translated label */
function useCallStatusBadge(callStatus?: string) {
  const { t } = useTranslation()
  if (!callStatus) return null

  const map: Record<string, { color: string; bg: string; label: string }> = {
    requested: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: t('schedule.pending') },
    confirmed: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: t('schedule.confirmed') },
    completed: { color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)', label: t('schedule.completed') },
    cancelled_by_user: { color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)', label: t('schedule.cancelled') },
    cancelled_by_creator: { color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)', label: t('schedule.cancelled') },
    rejected: { color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)', label: t('schedule.callStatusRejected') },
  }
  return map[callStatus] ?? null
}

/** Compute end time string from start time + duration minutes */
function computeTimeRange(startTime: string, durationMin: string): string {
  const min = parseInt(durationMin, 10)
  if (!startTime || isNaN(min)) return startTime
  // Parse HH:mm from startTime (could be "00:30" or "0:30")
  const match = startTime.match(/(\d{1,2}):(\d{2})/)
  if (!match) return startTime
  const totalMin = parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + min
  const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, '0')
  const endM = String(totalMin % 60).padStart(2, '0')
  return `${startTime} - ${endH}:${endM}`
}

export default function CardEventoAgenda({
  title,
  time,
  typeEvent,
  duration,
  count,
  callStatus,
  clientName,
  onTap,
}: CardEventoAgendaProps) {
  const borderColor = borderColors[typeEvent] ?? '#FFDF6E'
  const badge = useCallStatusBadge(callStatus)
  const timeRange = computeTimeRange(time, duration)

  return (
    <div className="flex flex-row items-start gap-[30px]">
      {/* Hora à esquerda */}
      <span className="text-[var(--color-muted)] text-xs shrink-0 mt-2.5">
        {time}
      </span>

      {/* Card clicável */}
      <div className="flex-1 min-w-0">
        <div className="h-px bg-[var(--color-muted)] mb-2.5" />
        <button
          type="button"
          onClick={onTap}
          className="w-full text-left py-1 px-3 rounded-[4px] bg-[var(--color-surface)] border-none cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
          style={{ borderLeft: `4px solid ${borderColor}` }} /* dynamic value - cannot be Tailwind */
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[var(--color-foreground)] text-xs font-medium">
                {title || '-'}
              </span>
              {badge && (
                <span
                  className="inline-block text-[10px] font-bold px-1.5 py-[2px] rounded-[4px] whitespace-nowrap"
                  style={{ color: badge.color, background: badge.bg }} /* dynamic value - cannot be Tailwind */
                >
                  {badge.label}
                </span>
              )}
            </div>
            <ActionIcon />
          </div>
          {clientName && (
            <div className="mt-1">
              <span className="text-[11px] text-[var(--color-muted)]">
                {clientName}
              </span>
            </div>
          )}
          <div
            className="flex justify-between items-center gap-2"
            style={{ marginTop: clientName ? 8 : 14 }} /* dynamic value - cannot be Tailwind */
          >
            <span className="text-[var(--color-foreground)] text-xs">{timeRange}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-[var(--color-foreground)]">
                <ClockIcon />
                {duration}
              </span>
              {typeEvent === 'live' && count != null && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-foreground)]">
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
