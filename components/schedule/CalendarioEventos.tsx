'use client'

import React from 'react'
import { useTranslation, getLocaleBcp47 } from '@/lib/i18n'

/** Formato DD/MM/YYYY para comparar datas com eventos */
function dateToKey(date: Date): string {
  const d = date.getDate()
  const m = date.getMonth() + 1
  const y = date.getFullYear()
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

interface CalendarioEventosProps {
  /** 'Semana' = week strip, 'Mês' = full month */
  typeCalendario: 'Semana' | 'Mês'
  selectedDate: Date
  onDateSelected: (date: Date) => void
  /** Height in px. Flutter: Mês 400, Semana 150 */
  height?: number
  /** Chaves DD/MM/YYYY dos dias que têm evento (mostra bolinha) */
  datesWithEvents?: string[]
}

function getWeekdayNames(bcp47: string): string[] {
  const names: string[] = []
  // Use a known Sunday as base (2024-01-07 is a Sunday)
  for (let i = 0; i < 7; i++) {
    const d = new Date(2024, 0, 7 + i)
    names.push(new Intl.DateTimeFormat(bcp47, { weekday: 'short' }).format(d))
  }
  return names
}

function getMonthName(bcp47: string, year: number, month: number): string {
  const d = new Date(year, month, 1)
  const name = new Intl.DateTimeFormat(bcp47, { month: 'long' }).format(d)
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function getMonthDays(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay()
  const daysInMonth = last.getDate()
  const result: (number | null)[] = []
  for (let i = 0; i < startPad; i++) result.push(null)
  for (let d = 1; d <= daysInMonth; d++) result.push(d)
  return result
}

function getWeekDates(center: Date): Date[] {
  const day = center.getDay()
  const start = new Date(center)
  start.setDate(center.getDate() - day)
  const out: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    out.push(d)
  }
  return out
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/**
 * CalendarioEventos — replica do custom widget CalendarioEventos Flutter (TableCalendar).
 * Exibe semana ou mês e permite selecionar data.
 */

export default function CalendarioEventos({
  typeCalendario,
  selectedDate,
  onDateSelected,
  height = typeCalendario === 'Mês' ? 400 : 150,
  datesWithEvents = [],
}: CalendarioEventosProps) {
  const { t, locale } = useTranslation()
  const bcp47 = getLocaleBcp47(locale)
  const weekdays = React.useMemo(() => getWeekdayNames(bcp47), [bcp47])
  const eventSet = React.useMemo(() => new Set(datesWithEvents), [datesWithEvents])
  const [viewMonth, setViewMonth] = React.useState(() => ({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth(),
  }))

  React.useEffect(() => {
    setViewMonth({ year: selectedDate.getFullYear(), month: selectedDate.getMonth() })
  }, [selectedDate.getFullYear(), selectedDate.getMonth()])

  if (typeCalendario === 'Semana') {
    const weekDates = getWeekDates(selectedDate)
    return (
      <div
        className="bg-[var(--color-surface)] rounded-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] p-2"
        style={{ height }} /* dynamic value - cannot be Tailwind */
      >
        <div className="flex justify-around items-center h-full">
          {weekDates.map((d) => {
            const isSelected = sameDay(d, selectedDate)
            const hasEvent = eventSet.has(dateToKey(d))
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => onDateSelected(d)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-[4px] border-none cursor-pointer text-xs"
                style={{
                  background: isSelected ? 'var(--color-primary)' : 'transparent', /* dynamic value - cannot be Tailwind */
                  color: isSelected ? '#fff' : 'var(--color-foreground)', /* dynamic value - cannot be Tailwind */
                }}
              >
                <span className="opacity-80">{weekdays[d.getDay()]}</span>
                <span className="font-bold text-lg">{d.getDate()}</span>
                {hasEvent && <span className="size-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const days = getMonthDays(viewMonth.year, viewMonth.month)
  const prevMonth = () => setViewMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }))
  const nextMonth = () => setViewMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }))

  return (
    <div
      className="bg-[var(--color-surface)] rounded-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] p-3 flex flex-col"
      style={{ height }} /* dynamic value - cannot be Tailwind */
    >
      <div className="flex justify-between items-center mb-2">
        <button type="button" onClick={prevMonth} className="bg-transparent border-none cursor-pointer p-1 text-lg" aria-label={t('ui.previousMonth')}>
          ‹
        </button>
        <span className="font-semibold text-[var(--color-foreground)] text-sm">
          {getMonthName(bcp47, viewMonth.year, viewMonth.month)} {viewMonth.year}
        </span>
        <button type="button" onClick={nextMonth} className="bg-transparent border-none cursor-pointer p-1 text-lg" aria-label={t('ui.nextMonth')}>
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1">
        {weekdays.map((w) => (
          <div key={w} className="text-center text-[11px] text-[var(--color-muted)] font-semibold">
            {w}
          </div>
        ))}
        {days.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />
          const date = new Date(viewMonth.year, viewMonth.month, d)
          const isSelected = sameDay(date, selectedDate)
          const hasEvent = eventSet.has(dateToKey(date))
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onDateSelected(date)}
              className="flex flex-col items-center justify-center gap-0.5 p-1 border-none rounded-[4px] cursor-pointer text-[13px]"
              style={{
                background: isSelected ? 'var(--color-primary)' : 'transparent', /* dynamic value - cannot be Tailwind */
                color: isSelected ? '#fff' : 'var(--color-foreground)', /* dynamic value - cannot be Tailwind */
              }}
            >
              <span>{d}</span>
              {hasEvent && <span className="size-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
