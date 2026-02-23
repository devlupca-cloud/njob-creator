'use client'

import React, { useEffect, useState } from 'react'
import type { TipoEventoAgenda } from './CardEventoAgenda'
import { useTranslation, getLocaleBcp47 } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface DetalhesAgendamentoModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  clientName: string
  duration: string
  value?: number
  date: string
  time: string
  typeEvent: TipoEventoAgenda
  /** ID do evento (live_streams.id ou one_on_one_calls.id) */
  eventId?: string | null
  /** Callback executado após cancelar com sucesso */
  onCancel?: () => void
  /** Status derivado do evento (para ocultar botão de cancelar em eventos finalizados) */
  status?: 'upcoming' | 'available' | 'finished' | 'cancelled'
  /** Status real da call vindo de one_on_one_calls (requested, confirmed, etc.) */
  callStatus?: string
}

// ─── Ícones ───────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
)

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const TimerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2" />
    <path d="M5 3L2 6" />
    <path d="M22 6l-3-3" />
    <line x1="12" y1="1" x2="12" y2="3" />
  </svg>
)

const DollarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
)

// ─── Cores por tipo (labels resolvidos dentro do componente via t()) ────────

const typeColors: Record<TipoEventoAgenda, { color: string; bg: string }> = {
  live: { color: '#6E8BFF', bg: 'rgba(110, 139, 255, 0.15)' },
  call: { color: '#FFDF6E', bg: 'rgba(255, 223, 110, 0.15)' },
}

// ─── Keyframes CSS ─────────────────────────────────────────────────

const modalKeyframes = `
@keyframes detalhesOverlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes detalhesModalIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
`

export default function DetalhesAgendamentoModal({
  isOpen,
  onClose,
  title,
  clientName,
  duration,
  value = 100,
  date,
  time,
  typeEvent,
  eventId,
  onCancel,
  status,
  callStatus,
}: DetalhesAgendamentoModalProps) {
  const { t, locale } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Fechar com Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmOpen) setConfirmOpen(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose, confirmOpen])

  // Reset confirm state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmOpen(false)
      setCancelling(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const terminalCallStatuses = ['completed', 'cancelled_by_user', 'cancelled_by_creator', 'rejected']
  const canCancel = !!eventId
    && status !== 'finished'
    && status !== 'cancelled'
    && (!callStatus || !terminalCallStatuses.includes(callStatus))

  const handleCancel = async () => {
    if (!eventId) return
    setCancelling(true)
    try {
      const supabase = createClient()
      if (typeEvent === 'live') {
        const { error } = await supabase
          .from('live_streams')
          .update({ status: 'cancelled' })
          .eq('id', eventId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('one_on_one_calls')
          .update({ status: 'cancelled_by_creator' })
          .eq('id', eventId)
        if (error) throw error
      }
      toast.success(t('schedule.eventCancelled'))
      setConfirmOpen(false)
      onClose()
      onCancel?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('schedule.errorCancel'))
    } finally {
      setCancelling(false)
    }
  }

  // Call status badge
  const callStatusBadge = (() => {
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
  })()

  const valueFormatted = new Intl.NumberFormat(getLocaleBcp47(locale), { style: 'currency', currency: 'BRL' }).format(value)
  const typeLabels: Record<TipoEventoAgenda, string> = {
    live: t('schedule.live').toUpperCase(),
    call: t('schedule.videoCall').toUpperCase(),
  }
  const cfg = { ...typeColors[typeEvent] ?? typeColors.live, label: typeLabels[typeEvent] ?? typeLabels.live }

  return (
    <>
      <style>{modalKeyframes}</style>

      {/* Overlay */}
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          animation: 'detalhesOverlayIn 180ms ease forwards',
        }}
      >
        {/* Modal */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detalhes-agendamento-title"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--color-surface)',
            borderRadius: 20,
            padding: 0,
            width: '100%',
            maxWidth: 440,
            maxHeight: '85vh',
            overflowY: 'auto',
            animation: 'detalhesModalIn 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
          }}
        >
          {/* Header com gradiente */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(174, 50, 195, 0.12) 0%, rgba(101, 22, 147, 0.08) 100%)',
              borderRadius: '20px 20px 0 0',
              padding: '20px 24px 16px',
              position: 'relative',
            }}
          >
            {/* Botão fechar */}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-muted)',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 150ms, background 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-foreground)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-muted)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              }}
            >
              <CloseIcon />
            </button>

            {/* Badge tipo + status da call */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  display: 'inline-block',
                  background: cfg.bg,
                  color: cfg.color,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  padding: '3px 10px',
                  borderRadius: 4,
                }}
              >
                {cfg.label}
              </span>
              {callStatusBadge && (
                <span
                  style={{
                    display: 'inline-block',
                    background: callStatusBadge.bg,
                    color: callStatusBadge.color,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    padding: '3px 10px',
                    borderRadius: 4,
                  }}
                >
                  {callStatusBadge.label}
                </span>
              )}
            </div>

            {/* Título do evento */}
            <h2
              id="detalhes-agendamento-title"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--color-foreground)',
                margin: 0,
                lineHeight: 1.3,
                paddingRight: 32,
              }}
            >
              {title}
            </h2>

            {/* Cliente */}
            {clientName && clientName !== '-' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 8,
                }}
              >
                <UserIcon />
                <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  {clientName}
                </span>
              </div>
            )}
          </div>

          {/* Corpo: campos em grid */}
          <div style={{ padding: '20px 24px 24px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <FieldCard icon={<CalendarIcon />} label={t('schedule.date')} value={date} />
              <FieldCard icon={<ClockIcon />} label={t('schedule.time')} value={time} />
              <FieldCard icon={<TimerIcon />} label={t('schedule.duration')} value={duration} />
              <FieldCard icon={<DollarIcon />} label={t('schedule.ticketPrice')} value={valueFormatted} />
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
              {/* Botão cancelar evento — oculto por enquanto */}

              {/* Botão fechar */}
              {!confirmOpen && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-foreground)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 150ms, border-color 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface-2)'
                    e.currentTarget.style.borderColor = 'var(--color-muted)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                  }}
                >
                  {t('common.close')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Field Card ────────────────────────────────────────────────────

function FieldCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--color-surface-2)',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--color-muted)', display: 'flex', flexShrink: 0 }}>{icon}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-muted)',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {label}
        </span>
      </div>
      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-foreground)' }}>
        {value}
      </span>
    </div>
  )
}
