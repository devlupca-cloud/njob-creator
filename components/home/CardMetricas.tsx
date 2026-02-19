'use client'

import React from 'react'

interface CardMetricasProps {
  /** Cor de fundo do card (ex: '#F1E2FF') */
  fillColor: string
  /** Ícone SVG renderizado dentro do card */
  icon: React.ReactNode
  /** Valor numérico a exibir */
  value: number
  /** Título da métrica (ex: 'Visitas') */
  title: string
  /** Subtítulo da métrica (ex: 'últimos 30 dias') */
  subTitle?: string
  /** Se true, mostra o ícone na linha superior */
  showIcon?: boolean
  /** Se true, formata o valor como moeda BRL (R$ X,XX) */
  valueMoeda?: boolean
}

/**
 * CardMetricas
 * Replica do CardMetricasWidget Flutter.
 * - Altura fixa 124px
 * - Fundo colorido (passado via fillColor, sempre com opacidade no dark para contraste)
 * - Textos internos em #222222 (escuro, pois o fundo é claro)
 * - Valor formatado como moeda se valueMoeda=true
 */

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export default function CardMetricas({
  fillColor,
  icon,
  value,
  title,
  subTitle = 'últimos 30 dias',
  showIcon = true,
  valueMoeda = false,
}: CardMetricasProps) {
  const displayValue = valueMoeda ? formatBRL(value) : String(value ?? '-')

  return (
    <div
      style={{
        height: 124,
        borderRadius: 12,
        background: fillColor,
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Linha superior: ícone + valor */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: valueMoeda ? 'center' : 'space-between',
        }}
      >
        {!valueMoeda && showIcon && (
          <span style={{ color: '#222222', display: 'flex' }}>{icon}</span>
        )}
        <span
          style={{
            color: '#222222',
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {displayValue}
        </span>
      </div>

      {/* Linha inferior: título + subtítulo */}
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            color: '#222222',
            fontSize: 14,
            fontWeight: 600,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {title}
        </p>
        <p
          style={{
            color: '#616161',
            fontSize: 12,
            margin: 0,
            marginTop: 2,
            lineHeight: 1.2,
          }}
        >
          {subTitle}
        </p>
      </div>
    </div>
  )
}
