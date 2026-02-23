'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useCreator, useAppStore, useIsGuest } from '@/lib/store/app-store'
import type { Database } from '@/lib/types/database'
import { useGuestGuard } from '@/lib/hooks/useGuestGuard'
import { useTranslation } from '@/lib/i18n'
import GuestAuthModal from '@/components/ui/GuestAuthModal'
import Spinner from '@/components/ui/Spinner'

import ToggleOnline from '@/components/home/ToggleOnline'
import CardEvento, { type TipoEvento } from '@/components/home/CardEvento'
import CardMetricas from '@/components/home/CardMetricas'
import NovoEventoModal from '@/components/home/NovoEventoModal'
import {
  getTodayLocalYYYYMMDD,
  getTomorrowLocalYYYYMMDD,
  eventStartDateLocal,
} from '@/lib/utils/datetime'
import { useLiveStreamCleanup } from '@/lib/hooks/useLiveStreamCleanup'

// ─── Tipos vindos do schema ────────────────────────────────────────
type VwCreatorEventRow = Database['public']['Views']['vw_creator_events']['Row']

interface CreatorMetrics {
  visitas_30d: number
  curtidas_30d: number
  faturamento_30d: number
}

// ─── Ícones inline ────────────────────────────────────────────────

const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const DollarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const AddIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────────

/** Mantido por compatibilidade; preferir getTodayLocalYYYYMMDD de @/lib/utils/datetime */
function getTodayISO(): string {
  return getTodayLocalYYYYMMDD()
}

/** Retorna o timestamp (ms) UTC do evento a partir de start_date + time da view. */
function eventTimestamp(row: VwCreatorEventRow): number {
  if (!row.start_date || !row.time) return 0
  const timePart = String(row.time).slice(0, 5)
  return new Date(`${row.start_date}T${timePart}:00.000Z`).getTime()
}

/** Verifica se o evento já terminou (horário de início + duração < agora). */
function isEventFinished(row: VwCreatorEventRow): boolean {
  const ts = eventTimestamp(row)
  if (!ts) return false
  const durationMin = row.duration_min ?? 60
  const eventEnd = ts + durationMin * 60 * 1000
  return Date.now() > eventEnd
}

/**
 * Retorna a rota interna do creator web para o evento.
 */
function buildEventRoute(event: VwCreatorEventRow): string {
  if (event.event_type === 'live') {
    return `/live/${event.event_id}`
  }
  return `/video-call/${event.event_id}`
}

// ─── Page ─────────────────────────────────────────────────────────

export default function HomePage() {
  const { t } = useTranslation()
  const supabase = createClient()
  const creator = useCreator()
  const isGuest = useIsGuest()
  const setCreator = useAppStore((s) => s.setCreator)
  const router = useRouter()
  const { requireAuth, showGuestModal, setShowGuestModal } = useGuestGuard()

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [onlineUpdating, setOnlineUpdating] = useState(false)

  // ─── Query: eventos do dia ──────────────────────────────────────

  const todayISO = getTodayISO()
  const tomorrowISO = getTomorrowLocalYYYYMMDD()

  const {
    data: eventosRaw = [],
    isLoading: eventosLoading,
    refetch: refetchEventos,
  } = useQuery<VwCreatorEventRow[]>({
    queryKey: ['vw_creator_events', 'today', creator?.profile.username, todayISO],
    enabled: !!creator,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) return []

      // Busca hoje e amanhã (por start_date UTC) para incluir eventos tipo "hoje 23h" que viram dia seguinte em UTC
      const { data, error } = await supabase
        .from('vw_creator_events')
        .select('*')
        .eq('creator_id', userId)
        .in('start_date', [todayISO, tomorrowISO])
        .limit(10)

      if (error) {
        console.error('[HomePage] vw_creator_events error:', error)
        return []
      }
      return data ?? []
    },
  })

  // ── L3: Lazy status cleanup — mark past live_streams as 'finished' ──
  useLiveStreamCleanup(creator, refetchEventos)

  // Filtra só os que caem no "hoje" no fuso local, remove finalizados
  // e ordena pelo mais próximo do horário atual
  const eventos = eventosRaw
    .filter((e) => eventStartDateLocal(e.start_date, e.time) === todayISO)
    .filter((e) => !isEventFinished(e))
    .sort((a, b) => {
      const now = Date.now()
      const diffA = Math.abs(eventTimestamp(a) - now)
      const diffB = Math.abs(eventTimestamp(b) - now)
      return diffA - diffB
    })
    .slice(0, 3)

  // ── Query suplementar: detalhes das calls (status + nome do cliente) ──
  const callEventIds = useMemo(
    () => eventos.filter((e) => e.event_type === 'call' && e.event_id).map((e) => e.event_id!),
    [eventos],
  )

  const { data: homeCallInfoMap = new Map<string, { status: string; clientName: string }>() } = useQuery({
    queryKey: ['home_call_details', callEventIds],
    enabled: callEventIds.length > 0,
    queryFn: async () => {
      const { data: calls, error: callsErr } = await supabase
        .from('one_on_one_calls')
        .select('id, status, user_id')
        .in('id', callEventIds)
        .in('status', ['requested', 'confirmed'])
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

  // ─── Query: métricas ───────────────────────────────────────────

  const {
    data: metricas,
    isLoading: metricasLoading,
    refetch: refetchMetricas,
  } = useQuery<CreatorMetrics>({
    queryKey: ['get_creator_metrics', creator?.profile.username],
    enabled: !!creator,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) return { visitas_30d: 0, curtidas_30d: 0, faturamento_30d: 0 }

      // Chama a RPC via fetch direto para evitar conflito com os tipos Database.Functions.
      // No Flutter isso era chamado como Edge Function (SupabaseFunctionsGroup.gETMetricasHomeCall).
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_creator_metrics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ p_profile_id: userId }),
        }
      )

      if (!response.ok) {
        console.error('[HomePage] get_creator_metrics HTTP error:', response.status)
        return { visitas_30d: 0, curtidas_30d: 0, faturamento_30d: 0 }
      }

      const raw: unknown = await response.json()
      const result = Array.isArray(raw) ? (raw[0] as Record<string, number> | undefined) : (raw as Record<string, number> | undefined)
      return {
        visitas_30d: result?.visitas_30d ?? 0,
        curtidas_30d: result?.curtidas_30d ?? 0,
        faturamento_30d: result?.faturamento_30d ?? 0,
      }
    },
  })

  // ─── Handlers ──────────────────────────────────────────────────

  const handleOpenEvent = useCallback(async (event: VwCreatorEventRow) => {
    if (!requireAuth()) return
    if (!creator) return

    // Verificar câmera/áudio antes de navegar
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        stream.getTracks().forEach((t) => t.stop())
      } catch (err) {
        const name = err instanceof Error ? err.name : ''
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          toast.error(t('home.cameraRequired'))
          return
        }
        toast.warning(t('home.cameraWarning'))
      }
    }

    router.push(buildEventRoute(event))
  }, [creator, router])

  const handleRefreshAfterCreate = useCallback(() => {
    refetchEventos()
    refetchMetricas()
  }, [refetchEventos, refetchMetricas])

  const handleOnlineChange = useCallback(
    async (isActive: boolean) => {
      if (!requireAuth()) return
      if (!creator) return
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) return
      setOnlineUpdating(true)
      try {
        const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId)
        if (error) {
          toast.error(t('home.errorUpdateOnline'))
          return
        }
        setCreator({ ...creator, profile: { ...creator.profile, is_active: isActive } })
      } catch {
        toast.error(t('home.errorUpdateStatus'))
      } finally {
        setOnlineUpdating(false)
      }
    },
    [creator, supabase, setCreator]
  )

  // ─── Render ────────────────────────────────────────────────────

  const userName = creator?.profile?.full_name?.trim() || null
  const avatarUrl = creator?.profile?.avatar_url
  const greeting = isGuest
    ? t('home.greetingGuest')
    : userName
      ? t('home.greetingName', { name: userName })
      : t('home.greetingDefault')

  return (
    <>
      {/* Conteúdo da Home */}
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* ─── Header: avatar + nome + toggle ───────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          {/* Esquerda: avatar + nome */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Avatar circular */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--color-surface-2)',
                flexShrink: 0,
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={userName || 'Avatar'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                  }}
                >
                  {(userName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <span
              style={{
                color: 'var(--color-foreground)',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {greeting}
            </span>
          </div>

          {/* Direita: label "Online" + toggle + sino */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  color: 'var(--color-foreground)',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {t('common.online')}
              </span>
              <ToggleOnline
                value={creator?.profile?.is_active ?? true}
                onChange={handleOnlineChange}
                disabled={onlineUpdating}
              />
            </div>

            {/* Notificações — oculto por enquanto */}
          </div>
        </div>

        {/* Link "Ver perfil" */}
        <button
          onClick={() => router.push('/profile')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-primary)',
            fontSize: 12,
            fontWeight: 600,
            padding: 0,
            marginBottom: 20,
            display: 'block',
          }}
        >
          {t('home.viewProfile')}
        </button>

        {/* ─── Seção: Eventos do Dia ─────────────────────────────────── */}
        <section style={{ marginBottom: 24 }}>

          {/* Cabeçalho da seção */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              gap: 12,
            }}
          >
            {/* Badge com contagem */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {eventos.length}
              </span>
            </div>

            <span
              style={{
                color: 'var(--color-foreground)',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {t('home.todayEvents')}
            </span>
          </div>

          {/* Lista de eventos */}
          {eventosLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <Spinner size="lg" />
            </div>
          ) : eventos.length === 0 ? (
            /* Estado vazio */
            <div
              style={{
                height: 100,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: 12,
              }}
            >
              <p
                style={{
                  color: 'var(--color-muted)',
                  fontSize: 14,
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                {t('home.noEventsToday')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    onTapBTN={() => handleOpenEvent(evento)}
                  />
                )
              })}
            </div>
          )}

          {/* Link "Ver todos" — aparece quando há 3 ou mais eventos */}
          {eventos.length >= 3 && (
            <button
              onClick={() => router.push('/schedule')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-foreground)',
                fontSize: 12,
                marginTop: 8,
                marginLeft: 'auto',
                padding: 0,
              }}
            >
              {t('common.viewAll')}
              <ArrowRightIcon />
            </button>
          )}

          {/* Botão "Criar evento" — gradient igual ao Flutter */}
          <button
            onClick={() => { if (!requireAuth()) return; setModalOpen(true) }}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 24,
              background: 'linear-gradient(to right, #651693 0%, #AE32C3 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              marginTop: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              transition: 'opacity 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <AddIcon />
            {t('home.createEvent')}
          </button>
        </section>

        {/* ─── Seção: Métricas ───────────────────────────────────────── */}
        <section>
          {metricasLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <Spinner size="lg" />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              {/* Card 1 — Visitas */}
              <CardMetricas
                fillColor="#F1E2FF"
                icon={<EyeIcon />}
                value={metricas?.visitas_30d ?? 0}
                title={t('home.visits')}
                subTitle={t('home.last30days')}
                showIcon={true}
                valueMoeda={false}
              />

              {/* Card 2 — Curtidas */}
              <CardMetricas
                fillColor="#E8CDFF"
                icon={<HeartIcon />}
                value={metricas?.curtidas_30d ?? 0}
                title={t('home.likes')}
                subTitle={t('home.last30days')}
                showIcon={true}
                valueMoeda={false}
              />

              {/* Card 3 — Faturamento */}
              <CardMetricas
                fillColor="#DEB8FF"
                icon={<DollarIcon />}
                value={Math.round(metricas?.faturamento_30d ?? 0)}
                title={t('home.revenue')}
                subTitle={t('home.last30days')}
                showIcon={false}
                valueMoeda={true}
              />
            </div>
          )}
        </section>

      </div>

      {/* Modal Novo Evento */}
      <NovoEventoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onRefresh={handleRefreshAfterCreate}
      />

      {/* Modal de autenticação para convidados */}
      <GuestAuthModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        message={t('modals.guestNeedAccountActions')}
      />
    </>
  )
}
