'use client'

import React from 'react'

interface CardMetricasProps {
  fillColor: string
  icon: React.ReactNode
  value: number
  title: string
  subTitle?: string
  showIcon?: boolean
  valueMoeda?: boolean
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (value >= 10_000) return `${(value / 1_000).toFixed(1).replace('.0', '')}K`
  if (value >= 1_000) return new Intl.NumberFormat('pt-BR').format(value)
  return String(value)
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
  const displayValue = valueMoeda ? formatBRL(value) : formatCompact(value)

  return (
    <div
      className="rounded-2xl p-3 md:p-4 flex flex-col gap-1.5 md:gap-2 flex-1 min-w-0"
      style={{ background: fillColor }}
    >
      {/* Ícone */}
      {!valueMoeda && showIcon && (
        <span className="text-[#222222]/60 flex">{icon}</span>
      )}

      {/* Valor */}
      <span className="text-[#222222] text-lg md:text-2xl font-bold leading-none whitespace-nowrap overflow-hidden text-ellipsis">
        {displayValue}
      </span>

      {/* Título + subtítulo */}
      <div>
        <p className="text-[#222222]/80 text-[11px] md:text-xs font-medium m-0 leading-tight">
          {title}
        </p>
        <p className="text-[#222222]/40 text-[10px] md:text-[11px] m-0 leading-tight">
          {subTitle}
        </p>
      </div>
    </div>
  )
}
