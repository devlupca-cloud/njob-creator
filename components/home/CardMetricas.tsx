'use client'

import React from 'react'

interface CardMetricasProps {
  fillColor: string
  icon: React.ReactNode
  value: number
  title: string
  subTitle?: string
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
  valueMoeda = false,
}: CardMetricasProps) {
  const displayValue = valueMoeda ? formatBRL(value) : formatCompact(value)

  return (
    <div
      className="rounded-2xl px-2 py-3 md:px-4 md:py-5 flex flex-col items-center justify-center text-center gap-0.5 min-w-0 h-[100px] md:h-[120px]"
      style={{ background: fillColor }}
    >
      <span className="text-[#222222]/50 flex mb-0.5">{icon}</span>
      <span className="text-[#222222] text-base md:text-xl font-bold leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
        {displayValue}
      </span>
      <p className="text-[#222222]/70 text-[10px] md:text-xs font-medium m-0 leading-tight">
        {title}
      </p>
      <p className="text-[#222222]/35 text-[9px] md:text-[10px] m-0 leading-tight">
        {subTitle}
      </p>
    </div>
  )
}
