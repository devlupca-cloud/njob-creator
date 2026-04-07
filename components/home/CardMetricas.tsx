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
      className="h-[124px] rounded-xl py-6 px-3 flex flex-col justify-between flex-1 min-w-0"
      style={{ background: fillColor }} /* dynamic value - cannot be Tailwind */
    >
      {/* Linha superior: ícone + valor */}
      <div
        className="flex flex-row items-center"
        style={{ justifyContent: valueMoeda ? 'center' : 'space-between' }} /* dynamic value - cannot be Tailwind */
      >
        {!valueMoeda && showIcon && (
          <span className="text-[#222222] flex">{icon}</span>
        )}
        <span className={`text-[#222222] font-bold leading-none ${valueMoeda ? 'text-base' : 'text-2xl'} whitespace-nowrap overflow-hidden text-ellipsis`}>
          {displayValue}
        </span>
      </div>

      {/* Linha inferior: título + subtítulo */}
      <div className="text-center">
        <p className="text-[#222222] text-sm font-semibold m-0 leading-[1.2]">
          {title}
        </p>
        <p className="text-[#616161] text-xs m-0 mt-0.5 leading-[1.2]">
          {subTitle}
        </p>
      </div>
    </div>
  )
}
