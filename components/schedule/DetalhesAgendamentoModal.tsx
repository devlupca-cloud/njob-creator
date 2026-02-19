'use client'

import React from 'react'
import type { TipoEventoAgenda } from './CardEventoAgenda'

interface DetalhesAgendamentoModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  clientName: string
  duration: string
  /** Value could come from API; Flutter used 100.0 as placeholder */
  value?: number
  date: string
  time: string
  typeEvent: TipoEventoAgenda
}

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

/**
 * DetalhesAgendamentoModal — replica do DetalhesAgendatamentoWidget Flutter (bottom sheet).
 * Detalhes de agendamento: título, cliente, duração, valor, data, hora, tipo.
 */
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
}: DetalhesAgendamentoModalProps) {
  if (!isOpen) return null

  const valueFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.25)',
          zIndex: 50,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalhes-agendamento-title"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 51,
          background: 'var(--color-surface)',
          borderRadius: '4px 4px 0 0',
          padding: '4px 16px 24px',
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-foreground)', padding: 4 }}
          >
            <CloseIcon />
          </button>
        </div>
        <h2
          id="detalhes-agendamento-title"
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--color-foreground)',
            margin: '0 0 16px',
          }}
        >
          Detalhes de agendamento
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Row label="Título" value={title} />
          <Row label="Cliente" value={clientName} />
          <Row label="Duração" value={duration} />
          <Row label="Valor" value={valueFormatted} />
          <Row label="Data" value={date} />
          <Row label="Horário" value={time} />
          <Row label="Tipo" value={typeEvent === 'live' ? 'Live' : 'Chamada'} />
        </div>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--color-muted)', fontSize: 14 }}>{label}</span>
      <span style={{ color: 'var(--color-foreground)', fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  )
}
