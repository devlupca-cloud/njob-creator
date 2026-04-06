'use client'

import { ChevronRight, Plus } from 'lucide-react'

import CardEvento, { type TipoEvento } from '@/components/home/CardEvento'
import Spinner from '@/components/ui/Spinner'
import { useTranslation } from '@/lib/i18n'
import type { Database } from '@/lib/types/database'

type VwCreatorEventRow = Database['public']['Views']['vw_creator_events']['Row']

interface TodayEventsProps {
  eventos: VwCreatorEventRow[]
  isLoading: boolean
  homeCallInfoMap: Map<string, { status: string; clientName: string }>
  onOpenEvent: (event: VwCreatorEventRow) => void
  onCreateEvent: () => void
  onViewAll: () => void
}

export function TodayEvents({
  eventos,
  isLoading,
  homeCallInfoMap,
  onOpenEvent,
  onCreateEvent,
  onViewAll,
}: TodayEventsProps) {
  const { t } = useTranslation()

  return (
    <section className="mb-6">
      {/* Cabeçalho da seção */}
      <div className="flex flex-row items-center mb-3 gap-3">
        {/* Badge com contagem */}
        <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold leading-none">
            {eventos.length}
          </span>
        </div>

        <span className="text-[var(--color-foreground)] text-base font-semibold">
          {t('home.todayEvents')}
        </span>
      </div>

      {/* Lista de eventos */}
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Spinner size="lg" />
        </div>
      ) : eventos.length === 0 ? (
        /* Estado vazio */
        <div className="h-[100px] flex items-end justify-center pb-3">
          <p className="text-[var(--color-muted)] text-sm text-center m-0">
            {t('home.noEventsToday')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {eventos.slice(0, 3).map((evento) => {
            const textBTN = evento.event_type === 'live'
              ? t('home.joinLive')
              : t('home.joinVideoCall')

            // Monta ISO (UTC) a partir de start_date + time da view; data/hora exibidas no fuso local
            const timeISO =
              evento.start_date && evento.time
                ? `${evento.start_date}T${evento.time.slice(0, 5)}:00.000Z`
                : new Date().toISOString()

            // Enriquece título da call com nome do cliente
            const callInfo = evento.event_type === 'call' && evento.event_id
              ? homeCallInfoMap.get(evento.event_id)
              : undefined
            const displayTitle = callInfo?.clientName
              ? `${evento.title ?? evento.event_name ?? 'Evento'} — ${callInfo.clientName}`
              : (evento.title ?? evento.event_name ?? 'Evento')

            return (
              <CardEvento
                key={evento.event_id ?? evento.event_name}
                typeEvento={(evento.event_type ?? 'call') as TipoEvento}
                title={displayTitle}
                time={timeISO}
                duration={`${evento.duration_min ?? '-'}m`}
                textBTN={textBTN}
                users={evento.attendee_count ?? 0}
                eventId={evento.event_id ?? ''}
                date={timeISO}
                ticketPrice={evento.ticket_price}
                onTapBTN={() => onOpenEvent(evento)}
              />
            )
          })}
        </div>
      )}

      {/* Link "Ver todos" — aparece quando há 3 ou mais eventos */}
      {eventos.length >= 3 && (
        <button
          onClick={onViewAll}
          className="flex flex-row items-center gap-1.5 bg-transparent border-none cursor-pointer text-[var(--color-foreground)] text-xs mt-2 ml-auto p-0"
        >
          {t('common.viewAll')}
          <ChevronRight width={14} height={14} />
        </button>
      )}

      {/* Botão "Criar evento" — gradient igual ao Flutter */}
      <button
        onClick={onCreateEvent}
        className="w-full h-11 rounded-3xl border-none cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold text-white mt-3 shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-opacity duration-150 hover:opacity-[0.88] bg-[linear-gradient(to_right,#651693_0%,#AE32C3_100%)]"
      >
        <Plus width={20} height={20} strokeWidth={2.5} />
        {t('home.createEvent')}
      </button>
    </section>
  )
}
