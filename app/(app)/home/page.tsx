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
import NovoEventoModal from '@/components/home/NovoEventoModal'
import {
  getTodayLocalYYYYMMDD,
  getTomorrowLocalYYYYMMDD,
  eventStartDateLocal,
} from '@/lib/utils/datetime'
import { useLiveStreamCleanup } from '@/lib/hooks/useLiveStreamCleanup'

import { HomeHeader } from './_components/HomeHeader'
import { TodayEvents } from './_components/TodayEvents'
import { MetricsCards } from './_components/MetricsCards'

// ─── Tipos vindos do schema ────────────────────────────────────────
type VwCreatorEventRow = Database['public']['Views']['vw_creator_events']['Row']

interface CreatorMetrics {
  visitas_30d: number
  curtidas_30d: number
  faturamento_30d: number
}

// ─── Helpers ──────────────────────────────────────────────────────

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

/** Retorna a rota interna do creator web para o evento. */
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

  const todayISO = getTodayLocalYYYYMMDD()
  const tomorrowISO = getTomorrowLocalYYYYMMDD()

  const {
    data: eventosRaw = [],
    isLoading: eventosLoading,
    refetch: refetchEventos,
  } = useQuery<VwCreatorEventRow[]>({
    queryKey: ['vw_creator_events', 'today', creator?.profile.username, todayISO],
    enabled: !!creator,
    retry: 1,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id
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

  // ─── Query: notificações não lidas ──────────────────────────────

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['notifications-unread-count', creator?.profile.username],
    enabled: !!creator,
    refetchInterval: 30_000, // polling a cada 30s para atualizar badge
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) return 0
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      if (error) return 0
      return count ?? 0
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
    retry: 1,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id
      if (!userId) return { visitas_30d: 0, curtidas_30d: 0, faturamento_30d: 0 }

      const { data: session } = await supabase.auth.getSession()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_creator_metrics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${session.session?.access_token ?? ''}`,
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
  }, [creator, router, requireAuth, t])

  const handleRefreshAfterCreate = useCallback(() => {
    refetchEventos()
    refetchMetricas()
  }, [refetchEventos, refetchMetricas])

  const handleOnlineChange = useCallback(
    async (isActive: boolean) => {
      if (!requireAuth()) return
      if (!creator) return
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id
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
    [creator, supabase, setCreator, requireAuth, t]
  )

  const handleCreateEvent = useCallback(() => {
    if (!requireAuth()) return
    setModalOpen(true)
  }, [requireAuth])

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
      <div className="max-w-[720px] mx-auto">

        <HomeHeader
          greeting={greeting}
          avatarUrl={avatarUrl}
          userName={userName}
          isOnline={creator?.profile?.is_active ?? true}
          onlineUpdating={onlineUpdating}
          unreadCount={unreadCount}
          onOnlineChange={handleOnlineChange}
          onNotificationsClick={() => router.push('/notifications')}
          onViewProfileClick={() => router.push('/profile')}
        />

        <TodayEvents
          eventos={eventos}
          isLoading={eventosLoading}
          homeCallInfoMap={homeCallInfoMap}
          onOpenEvent={handleOpenEvent}
          onCreateEvent={handleCreateEvent}
          onViewAll={() => router.push('/schedule')}
        />

        <section>
          <MetricsCards metricas={metricas} isLoading={metricasLoading} />
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
