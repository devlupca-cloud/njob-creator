'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import type { Database } from '@/lib/types/database'
import CalendarioEventos from '@/components/schedule/CalendarioEventos'
import CardEventoAgenda from '@/components/schedule/CardEventoAgenda'
import DetalhesAgendamentoModal from '@/components/schedule/DetalhesAgendamentoModal'
import NovoEventoModal from '@/components/home/NovoEventoModal'
import { formatTimeLocal, eventDateKeyLocal } from '@/lib/utils/datetime'

type VwCreatorEventRow = Database['public']['Views']['vw_creator_events']['Row']
type TabCalendario = 'Dia' | 'Semana' | 'Mês'

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

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <div
        style={{
          width: 50,
          height: 50,
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
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

export default function SchedulePage() {
  const supabase = createClient()
  const creator = useCreator()

  const [tabCalendarioSelect, setTabCalendarioSelect] = useState<TabCalendario>('Mês')
  const [dataSelect, setDataSelect] = useState<Date>(() => new Date())
  const [modalNovoOpen, setModalNovoOpen] = useState(false)
  const [detalhesEvento, setDetalhesEvento] = useState<VwCreatorEventRow | null>(null)

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

  const selectedKey = formatDMY(dataSelect)
  const listaEventos = eventos.filter((e) => eventDateKey(e) === selectedKey)

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
          Agenda
        </h1>

        {/* Tabs Dia / Semana / Mês */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['Dia', 'Semana', 'Mês'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setTabCalendarioSelect(tab)
                if (tab === 'Dia') setDataSelect(new Date())
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 4,
                border: 'none',
                background: tabCalendarioSelect === tab ? 'var(--color-primary)' : 'var(--color-surface-2)',
                color: tabCalendarioSelect === tab ? '#fff' : 'var(--color-foreground)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Calendar (hidden when Dia) */}
        {tabCalendarioSelect !== 'Dia' && (
          <div style={{ marginBottom: 16 }}>
            <CalendarioEventos
              typeCalendario={tabCalendarioSelect === 'Mês' ? 'Mês' : 'Semana'}
              selectedDate={dataSelect}
              onDateSelected={setDataSelect}
              height={tabCalendarioSelect === 'Mês' ? 400 : 150}
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
            Disponibilidade
          </Link>
        </div>

        {/* Lista de eventos do dia */}
        {eventosLoading ? (
          <Spinner />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {listaEventos.length === 0 ? (
              <p style={{ color: 'var(--color-muted)', fontSize: 14, margin: 0, padding: '24px 0' }}>
                Nenhum evento nesta data.
              </p>
            ) : (
              listaEventos.map((ev) => (
                <CardEventoAgenda
                  key={ev.event_id ?? ev.title ?? ''}
                  title={ev.title ?? ev.event_name ?? '-'}
                  time={formatTimeLocal(eventTimeISO(ev) || undefined, 'pt-BR')}
                  typeEvent={(ev.event_type ?? 'call') as 'live' | 'call'}
                  duration={String(ev.duration_min ?? '-')}
                  count={ev.attendee_count ?? undefined}
                  onTap={() => openDetalhes(ev)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <div style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 40 }}>
        <button
          type="button"
          onClick={() => setModalNovoOpen(true)}
          aria-label="Novo evento"
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

      {detalhesEvento && (
        <DetalhesAgendamentoModal
          isOpen={!!detalhesEvento}
          onClose={() => setDetalhesEvento(null)}
          title={detalhesEvento.title ?? detalhesEvento.event_name ?? '-'}
          clientName={detalhesEvento.event_name ?? '-'}
          duration={`${detalhesEvento.duration_min ?? '-'} min`}
          date={formatDDMMY(new Date(detalhesEvento.start_date ?? ''))}
          time={formatTimeLocal(eventTimeISO(detalhesEvento) || undefined, 'pt-BR')}
          typeEvent={(detalhesEvento.event_type ?? 'call') as 'live' | 'call'}
        />
      )}
    </>
  )
}
