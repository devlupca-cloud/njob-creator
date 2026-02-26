'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import type { Database } from '@/lib/types/database'
import Spinner from '@/components/ui/Spinner'
import CalendarioEventos from '@/components/schedule/CalendarioEventos'
import CardEventoAgenda from '@/components/schedule/CardEventoAgenda'
import DetalhesAgendamentoModal from '@/components/schedule/DetalhesAgendamentoModal'
import NovoEventoModal from '@/components/home/NovoEventoModal'
import { formatTimeLocal, eventDateKeyLocal } from '@/lib/utils/datetime'
import { useTranslation, getLocaleBcp47 } from '@/lib/i18n'
import { useLiveStreamCleanup } from '@/lib/hooks/useLiveStreamCleanup'

type VwCreatorEventRow = Database['public']['Views']['vw_creator_events']['Row']
type TabCalendario = 'day' | 'week' | 'month'

function formatDDMMY(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${d.getFullYear()}`
}

function formatDMY(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${d.getFullYear()}`
}

/** Chave do dia no fuso local (DD/MM/YYYY) para agrupar eventos — ex.: "hoje 23h" aparece no dia certo. */
function eventDateKey(row: VwCreatorEventRow): string {
  return eventDateKeyLocal(row.start_date, row.time)
}

/** Monta ISO (UTC) a partir de start_date + time da view para exibir no fuso local. */
function eventTimeISO(row: VwCreatorEventRow): string {
  if (!row.start_date || !row.time) return ''
  const timePart = String(row.time).slice(0, 5)
  return `${row.start_date}T${timePart}:00.000Z`
}

/** Derives frontend status from event time + duration (mirrors CardEvento logic). */
function deriveEventStatus(row: VwCreatorEventRow): 'upcoming' | 'available' | 'finished' {
  const iso = eventTimeISO(row)
  if (!iso) return 'upcoming'
  const eventTime = new Date(iso).getTime()
  const durationMin = row.duration_min ?? 60
  const eventEnd = eventTime + durationMin * 60 * 1000
  const bufferStart = eventTime - 15 * 60 * 1000
  const now = Date.now()
  if (now > eventEnd) return 'finished'
  if (now >= bufferStart) return 'available'
  return 'upcoming'
}

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const AddIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const LiveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49" />
    <path d="M7.76 16.24a6 6 0 0 1 0-8.49" />
  </svg>
)
const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="15" height="14" x="1" y="5" rx="2" ry="2" />
    <path d="m16 12 6-4v8l-6-4z" />
  </svg>
)
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

function isSlotPast(dateStr: string, slotTime: string): boolean {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (dateStr !== todayStr) return false
  const [hh, mm] = slotTime.split(':').map(Number)
  const slotDate = new Date(now)
  slotDate.setHours(hh, mm, 0, 0)
  return now > slotDate
}

export default function SchedulePage() {
  const supabase = createClient()
  const creator = useCreator()
  const { t, locale } = useTranslation()
  const router = useRouter()

  const [tabCalendarioSelect, setTabCalendarioSelect] = useState<TabCalendario>('month')
  const [dataSelect, setDataSelect] = useState<Date>(() => new Date())
  const [modalNovoOpen, setModalNovoOpen] = useState(false)
  const [detalhesEvento, setDetalhesEvento] = useState<VwCreatorEventRow | null>(null)
  const [showFabMenu, setShowFabMenu] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'live' | 'call'>('all')
  const fabMenuRef = useRef<HTMLDivElement>(null)

  const {
    data: eventos = [],
    isLoading: eventosLoading,
    refetch: refetchEventos,
  } = useQuery<VwCreatorEventRow[]>({
    queryKey: ['vw_creator_events', 'schedule', creator?.profile.username],
    enabled: !!creator,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) return []
      const { data, error } = await supabase
        .from('vw_creator_events')
        .select('*')
        .eq('creator_id', userId)
      if (error) {
        console.error('[SchedulePage] vw_creator_events error:', error)
        return []
      }
      return data ?? []
    },
  })

  // ── Query suplementar: detalhes das calls (status + nome do cliente) ──
  const callEventIds = useMemo(
    () => eventos.filter((e) => e.event_type === 'call' && e.event_id).map((e) => e.event_id!),
    [eventos],
  )

  const { data: callInfoMap = new Map<string, { status: string; clientName: string }>() } = useQuery({
    queryKey: ['call_details', callEventIds],
    enabled: callEventIds.length > 0,
    queryFn: async () => {
      const { data: calls, error: callsErr } = await supabase
        .from('one_on_one_calls')
        .select('id, status, user_id')
        .in('id', callEventIds)
      if (callsErr || !calls?.length) return new Map<string, { status: string; clientName: string }>()

      const userIds = [...new Set(calls.map((c) => c.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      const profileMap = new Map<string, string>()
      profiles?.forEach((p) => profileMap.set(p.id, p.full_name || ''))

      const result = new Map<string, { status: string; clientName: string }>()
      calls.forEach((c) => {
        result.set(c.id, {
          status: c.status,
          clientName: profileMap.get(c.user_id) || '',
        })
      })
      return result
    },
  })

  // ── Query: availability slots do dia selecionado ──
  const selectedDateStr = useMemo(() => {
    const y = dataSelect.getFullYear()
    const m = String(dataSelect.getMonth() + 1).padStart(2, '0')
    const d = String(dataSelect.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [dataSelect])

  const { data: availabilitySlots } = useQuery({
    queryKey: ['availability_slots_count', selectedDateStr],
    enabled: !!creator,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) return { total: 0, available: 0, purchased: 0, past: 0 }
      const { data: avail } = await supabase
        .from('creator_availability')
        .select('id')
        .eq('creator_id', userId)
        .eq('availability_date', selectedDateStr)
        .single()
      if (!avail) return { total: 0, available: 0, purchased: 0, past: 0 }
      const { data: slots } = await supabase
        .from('creator_availability_slots')
        .select('id, purchased, slot_time')
        .eq('availability_id', avail.id)
      if (!slots) return { total: 0, available: 0, purchased: 0, past: 0 }
      const purchased = slots.filter((s) => s.purchased).length
      const past = slots.filter((s) => !s.purchased && isSlotPast(selectedDateStr, s.slot_time)).length
      return {
        total: slots.length,
        available: slots.length - purchased - past,
        purchased,
        past,
      }
    },
  })

  // ── L3: Lazy status cleanup — mark past live_streams as 'finished' ──
  useLiveStreamCleanup(creator, refetchEventos)

  // Fechar FAB menu ao clicar fora
  useEffect(() => {
    if (!showFabMenu) return
    const handler = (e: MouseEvent) => {
      if (fabMenuRef.current && !fabMenuRef.current.contains(e.target as Node)) {
        setShowFabMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showFabMenu])

  const selectedKey = formatDMY(dataSelect)
  const listaEventos = eventos.filter((e) => {
    if (eventDateKey(e) !== selectedKey) return false
    if (filterType === 'live') return e.event_type === 'live'
    if (filterType === 'call') return e.event_type === 'call'
    return true
  })

  const handleRefresh = useCallback(() => {
    refetchEventos()
  }, [refetchEventos])

  const openDetalhes = useCallback((evento: VwCreatorEventRow) => {
    setDetalhesEvento(evento)
  }, [])

  return (
    <>
      <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 80 }}>
        {/* Header */}
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--color-foreground)',
            margin: '0 0 16px',
          }}
        >
          {t('schedule.title')}
        </h1>

        {/* Tabs Dia / Semana / Mês */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {([
            { key: 'day' as const, label: t('schedule.day') },
            { key: 'week' as const, label: t('schedule.week') },
            { key: 'month' as const, label: t('schedule.month') },
          ]).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTabCalendarioSelect(key)
                if (key === 'day') setDataSelect(new Date())
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 4,
                border: 'none',
                background: tabCalendarioSelect === key ? 'var(--color-primary)' : 'var(--color-surface-2)',
                color: tabCalendarioSelect === key ? '#fff' : 'var(--color-foreground)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Calendar (hidden when day) */}
        {tabCalendarioSelect !== 'day' && (
          <div style={{ marginBottom: 16 }}>
            <CalendarioEventos
              typeCalendario={tabCalendarioSelect === 'month' ? 'Mês' : 'Semana'}
              selectedDate={dataSelect}
              onDateSelected={setDataSelect}
              height={tabCalendarioSelect === 'month' ? 400 : 150}
              datesWithEvents={[...new Set(eventos.map(eventDateKey).filter(Boolean))]}
            />
          </div>
        )}

        {/* Selected date + link Disponibilidade */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--color-foreground)', fontSize: 14 }}>
            {formatDDMMY(dataSelect)}
          </span>
          <Link
            href={`/schedule/availability?date=${dataSelect.getFullYear()}-${String(dataSelect.getMonth() + 1).padStart(2, '0')}-${String(dataSelect.getDate()).padStart(2, '0')}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--color-primary)',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <EditIcon />
            {t('schedule.details')}
          </Link>
        </div>

        {/* Filtro por tipo */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {([
            { key: 'all' as const, label: t('schedule.filterAll'), bg: 'var(--color-surface-2)', activeBg: 'var(--color-primary)' },
            { key: 'live' as const, label: t('schedule.filterLives'), bg: 'var(--color-surface-2)', activeBg: '#6E8BFF' },
            { key: 'call' as const, label: t('schedule.filterCalls'), bg: 'var(--color-surface-2)', activeBg: '#FFDF6E' },
          ]).map(({ key, label, activeBg }) => {
            const active = filterType === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilterType(key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: 'none',
                  background: active ? activeBg : 'var(--color-surface-2)',
                  color: active ? (key === 'call' ? '#1a1a1a' : '#fff') : 'var(--color-muted)',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Indicador de disponibilidade para videochamadas */}
        {availabilitySlots && availabilitySlots.total > 0 && (filterType === 'all' || filterType === 'call') && (
          <Link
            href={`/schedule/availability?date=${selectedDateStr}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              marginBottom: 16,
              borderRadius: 12,
              background: 'rgba(255, 223, 110, 0.08)',
              border: '1px solid rgba(255, 223, 110, 0.2)',
              textDecoration: 'none',
              transition: 'background 150ms',
            }}
          >
            <span style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 223, 110, 0.15)',
              color: '#FFDF6E',
              flexShrink: 0,
            }}>
              <VideoIcon />
            </span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)' }}>
                {availabilitySlots.available} {t('schedule.slotsAvailable')}
              </span>
              {availabilitySlots.purchased > 0 && (
                <span style={{ display: 'block', color: 'var(--color-muted)', fontSize: 11, marginTop: 2 }}>
                  {availabilitySlots.purchased} {t('schedule.slotsPurchased')}
                </span>
              )}
              {availabilitySlots.past > 0 && (
                <span style={{ display: 'block', color: 'var(--color-muted)', fontSize: 11, marginTop: 2 }}>
                  {availabilitySlots.past} {t('schedule.slotsExpired')}
                </span>
              )}
              <span style={{ display: 'block', color: 'var(--color-muted)', fontSize: 11, marginTop: 2 }}>
                {t('schedule.awaitingBookings')}
              </span>
            </div>
            <EditIcon />
          </Link>
        )}

        {/* Lista de eventos do dia */}
        {eventosLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {listaEventos.length === 0 ? (
              <div style={{ padding: '24px 0' }}>
                {filterType === 'call' && availabilitySlots && availabilitySlots.total > 0 ? (
                  <p style={{ color: 'var(--color-muted)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                    {t('schedule.noCallsYet')}
                  </p>
                ) : (
                  <p style={{ color: 'var(--color-muted)', fontSize: 14, margin: 0 }}>
                    {t('schedule.noEvents')}
                  </p>
                )}
              </div>
            ) : (
              listaEventos.map((ev) => {
                const callInfo = ev.event_type === 'call' && ev.event_id ? callInfoMap.get(ev.event_id) : undefined
                return (
                  <CardEventoAgenda
                    key={ev.event_id ?? ev.title ?? ''}
                    title={ev.title ?? ev.event_name ?? '-'}
                    time={formatTimeLocal(eventTimeISO(ev) || undefined, getLocaleBcp47(locale))}
                    typeEvent={(ev.event_type ?? 'call') as 'live' | 'call'}
                    duration={String(ev.duration_min ?? '-')}
                    count={ev.attendee_count ?? undefined}
                    callStatus={callInfo?.status}
                    clientName={callInfo?.clientName}
                    onTap={() => openDetalhes(ev)}
                  />
                )
              })
            )}
          </div>
        )}
      </div>

      {/* FAB + Menu */}
      <div ref={fabMenuRef} style={{ position: 'fixed', bottom: 88, right: 20, zIndex: 40 }}>
        {/* Menu popover */}
        {showFabMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: 64,
              right: 0,
              background: 'var(--color-surface)',
              borderRadius: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
              padding: 8,
              minWidth: 240,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              animation: 'detalhesModalIn 180ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowFabMenu(false)
                setModalNovoOpen(true)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                color: 'var(--color-foreground)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ display: 'flex', color: '#6E8BFF' }}><LiveIcon /></span>
              {t('events.createLive')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowFabMenu(false)
                const dateStr = `${dataSelect.getFullYear()}-${String(dataSelect.getMonth() + 1).padStart(2, '0')}-${String(dataSelect.getDate()).padStart(2, '0')}`
                router.push(`/schedule/availability?date=${dateStr}`)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                color: 'var(--color-foreground)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ display: 'flex', color: '#FFDF6E' }}><VideoIcon /></span>
              {t('events.manageAvailability')}
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowFabMenu((v) => !v)}
          aria-label={t('events.newEvent')}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'transform 200ms',
            transform: showFabMenu ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          <AddIcon />
        </button>
      </div>

      <NovoEventoModal
        isOpen={modalNovoOpen}
        onClose={() => setModalNovoOpen(false)}
        onRefresh={handleRefresh}
        initialDate={dataSelect}
      />

      {detalhesEvento && (() => {
        const detCallInfo = detalhesEvento.event_type === 'call' && detalhesEvento.event_id
          ? callInfoMap.get(detalhesEvento.event_id)
          : undefined
        return (
          <DetalhesAgendamentoModal
            isOpen={!!detalhesEvento}
            onClose={() => setDetalhesEvento(null)}
            title={detalhesEvento.title ?? detalhesEvento.event_name ?? '-'}
            clientName={detCallInfo?.clientName || detalhesEvento.event_name || '-'}
            duration={`${detalhesEvento.duration_min ?? '-'} min`}
            value={detalhesEvento.ticket_price ?? undefined}
            date={formatDDMMY(new Date(detalhesEvento.start_date ?? ''))}
            time={formatTimeLocal(eventTimeISO(detalhesEvento) || undefined, getLocaleBcp47(locale))}
            typeEvent={(detalhesEvento.event_type ?? 'call') as 'live' | 'call'}
            eventId={detalhesEvento.event_id}
            status={deriveEventStatus(detalhesEvento)}
            callStatus={detCallInfo?.status}
            scheduledStartTime={eventTimeISO(detalhesEvento) || undefined}
            scheduledDurationMinutes={detalhesEvento.duration_min ?? undefined}
            onCancel={() => {
              setDetalhesEvento(null)
              refetchEventos()
            }}
          />
        )
      })()}
    </>
  )
}
