'use client'

import React from 'react'

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

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

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
const EVENT_DOT_STYLE: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: 'var(--color-primary)',
  flexShrink: 0,
}

export default function CalendarioEventos({
  typeCalendario,
  selectedDate,
  onDateSelected,
  height = typeCalendario === 'Mês' ? 400 : 150,
  datesWithEvents = [],
}: CalendarioEventosProps) {
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
      <div style={{ height, background: 'var(--color-surface)', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%' }}>
          {weekDates.map((d) => {
            const isSelected = sameDay(d, selectedDate)
            const hasEvent = eventSet.has(dateToKey(d))
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => onDateSelected(d)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  borderRadius: 4,
                  border: 'none',
                  background: isSelected ? 'var(--color-primary)' : 'transparent',
                  color: isSelected ? '#fff' : 'var(--color-foreground)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                <span style={{ opacity: 0.8 }}>{WEEKDAYS[d.getDay()]}</span>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{d.getDate()}</span>
                {hasEvent && <span style={EVENT_DOT_STYLE} />}
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
    <div style={{ height, background: 'var(--color-surface)', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: 12, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 18 }} aria-label="Mês anterior">
          ‹
        </button>
        <span style={{ fontWeight: 600, color: 'var(--color-foreground)', fontSize: 14 }}>
          {MONTHS[viewMonth.month]} {viewMonth.year}
        </span>
        <button type="button" onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 18 }} aria-label="Próximo mês">
          ›
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, flex: 1 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
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
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                padding: 4,
                border: 'none',
                borderRadius: 4,
                background: isSelected ? 'var(--color-primary)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--color-foreground)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <span>{d}</span>
              {hasEvent && <span style={EVENT_DOT_STYLE} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
