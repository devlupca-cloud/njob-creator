'use client'

import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'
import {
  getCreatorDailySlots,
  saveCreatorAvailability,
  buildAvailabilityPayload,
  generateTimeSlots,
  type PeriodKey,
} from '@/lib/api/schedule'
import { useQuery, useQueryClient } from '@tanstack/react-query'

function formatDDMMY(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${d.getFullYear()}`
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
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

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)
const HelpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
)

/** Convert a UTC ISO timestamp + duration into local "HH:mm" slot strings */
function getBlockedSlotTimes(startTimeISO: string, durationMin: number): string[] {
  const start = new Date(startTimeISO)
  const slots: string[] = []
  const slotCount = Math.ceil(durationMin / 30)
  for (let i = 0; i < slotCount; i++) {
    const d = new Date(start.getTime() + i * 30 * 60 * 1000)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }
  return slots
}

function isSlotPast(dateStr: string, slotTime: string): boolean {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (dateStr !== todayStr) return false
  const [hh, mm] = slotTime.split(':').map(Number)
  const slotDate = new Date(now)
  slotDate.setHours(hh, mm, 0, 0)
  return now > slotDate
}

function ExpandableSection({
  title,
  slots,
  selected,
  purchasedSlots,
  purchasedLabels,
  liveBlockedSlots,
  purchasedLabel,
  liveBlockedLabel,
  dateStr,
  onToggleSlot,
  onSelectAll,
  isAllSelected,
  selectAllLabel,
}: {
  title: string
  slots: string[]
  selected: Set<string>
  purchasedSlots: Set<string>
  purchasedLabels?: Map<string, string>
  liveBlockedSlots: Set<string>
  purchasedLabel: string
  liveBlockedLabel: string
  dateStr: string
  onToggleSlot: (s: string) => void
  onSelectAll: (v: boolean) => void
  isAllSelected: boolean
  selectAllLabel: string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: '100%',
          padding: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-foreground)',
          fontSize: 14,
        }}
      >
        {title}
        <span style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {expanded && (
        <div style={{ padding: '0 10px 10px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {slots.map((s) => {
              const isPurchased = purchasedSlots.has(s)
              const isLiveBlocked = liveBlockedSlots.has(s)
              const isPast = isSlotPast(dateStr, s)
              const isBlocked = isPurchased || isLiveBlocked || isPast
              const isSelected = selected.has(s)

              let bg: string
              let border: string
              let color: string
              let label = s

              if (isPast) {
                bg = 'var(--color-surface-2)'
                border = 'var(--color-border)'
                color = 'var(--color-foreground)'
              } else if (isPurchased) {
                bg = '#f59e0b'
                border = '#d97706'
                color = '#fff'
                const range = purchasedLabels?.get(s)
                label = range ? range : `${s} - ${purchasedLabel}`
              } else if (isLiveBlocked) {
                bg = '#3b82f6'
                border = '#2563eb'
                color = '#fff'
                label = `${s} - ${liveBlockedLabel}`
              } else if (isSelected) {
                bg = 'var(--color-primary)'
                border = 'var(--color-primary)'
                color = '#fff'
              } else {
                bg = 'var(--color-surface-2)'
                border = 'var(--color-border)'
                color = 'var(--color-foreground)'
              }

              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => !isBlocked && onToggleSlot(s)}
                  title={isPurchased ? purchasedLabel : isLiveBlocked ? liveBlockedLabel : undefined}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: `1.5px solid ${border}`,
                    background: bg,
                    color,
                    fontSize: 12,
                    cursor: isBlocked ? 'not-allowed' : 'pointer',
                    opacity: isPast ? 0.35 : isBlocked ? 0.85 : 1,
                    textDecoration: isPast ? 'line-through' : 'none',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer', fontSize: 14 }}>
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
            />
            {selectAllLabel}
          </label>
        </div>
      )}
    </div>
  )
}

function ScheduleAvailabilityContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const creator = useCreator()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const dateParam = searchParams.get('date')
  const selectedDate = useMemo(() => {
    if (dateParam) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        const [y, m, d] = dateParam.split('-').map(Number)
        return new Date(y, m - 1, d)
      }
      const t = Number(dateParam)
      if (!isNaN(t)) return new Date(t)
    }
    return new Date()
  }, [dateParam])

  const dateStr = useMemo(
    () =>
      selectedDate.getFullYear() +
      '-' +
      String(selectedDate.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(selectedDate.getDate()).padStart(2, '0'),
    [selectedDate]
  )

  const [manha, setManha] = useState<string[]>([])
  const [tarde, setTarde] = useState<string[]>([])
  const [noite, setNoite] = useState<string[]>([])
  const [madrugada, setMadrugada] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const slotsManha = useMemo(() => generateTimeSlots('Manhã'), [])
  const slotsTarde = useMemo(() => generateTimeSlots('Tarde'), [])
  const slotsNoite = useMemo(() => generateTimeSlots('Noite'), [])
  const slotsMadrugada = useMemo(() => generateTimeSlots('Madrugada'), [])

  // ── Existing query: creator availability slots ──
  const { data: slotsData, isLoading } = useQuery({
    queryKey: ['get_creator_daily_slots', creator?.profile.username, dateStr],
    enabled: !!creator,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      const token = session.session?.access_token
      if (!userId || !token) throw new Error('Não autenticado')
      return getCreatorDailySlots(userId, dateStr, token)
    },
  })

  // ── New query: conflicts (purchased calls + scheduled lives) ──
  const { data: conflictsData } = useQuery({
    queryKey: ['availability_conflicts', creator?.profile.username, dateStr],
    enabled: !!creator,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) throw new Error('Não autenticado')

      // Day boundaries in UTC based on local date
      const dayStart = new Date(selectedDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(selectedDate)
      dayEnd.setHours(23, 59, 59, 999)
      const dayStartUTC = dayStart.toISOString()
      const dayEndUTC = dayEnd.toISOString()

      const [callsRes, livesRes] = await Promise.all([
        supabase
          .from('one_on_one_calls')
          .select('scheduled_start_time, scheduled_duration_minutes')
          .eq('creator_id', userId)
          .in('status', ['requested', 'confirmed'])
          .gte('scheduled_start_time', dayStartUTC)
          .lte('scheduled_start_time', dayEndUTC),
        supabase
          .from('live_streams')
          .select('scheduled_start_time, estimated_duration_minutes')
          .eq('creator_id', userId)
          .in('status', ['scheduled', 'live'])
          .gte('scheduled_start_time', dayStartUTC)
          .lte('scheduled_start_time', dayEndUTC),
      ])

      return {
        calls: callsRes.data ?? [],
        lives: livesRes.data ?? [],
      }
    },
  })

  // ── Derive blocked slot sets ──
  const { purchasedSlots, purchasedLabels } = useMemo(() => {
    const set = new Set<string>()
    const labels = new Map<string, string>()
    if (!conflictsData?.calls) return { purchasedSlots: set, purchasedLabels: labels }
    for (const call of conflictsData.calls) {
      if (!call.scheduled_start_time) continue
      const dur = call.scheduled_duration_minutes ?? 30
      const blockedSlots = getBlockedSlotTimes(call.scheduled_start_time, dur)
      // Compute range label (e.g. "00:30 - 01:30")
      const startTime = blockedSlots[0]
      const lastSlot = blockedSlots[blockedSlots.length - 1]
      const [lh, lm] = lastSlot.split(':').map(Number)
      const endMin = lh * 60 + lm + 30
      const endH = String(Math.floor(endMin / 60) % 24).padStart(2, '0')
      const endM = String(endMin % 60).padStart(2, '0')
      const rangeLabel = `${startTime} - ${endH}:${endM}`
      for (const slot of blockedSlots) {
        set.add(slot)
        labels.set(slot, rangeLabel)
      }
    }
    return { purchasedSlots: set, purchasedLabels: labels }
  }, [conflictsData?.calls])

  const liveBlockedSlots = useMemo(() => {
    const set = new Set<string>()
    if (!conflictsData?.lives) return set
    for (const live of conflictsData.lives) {
      if (!live.scheduled_start_time) continue
      const dur = live.estimated_duration_minutes ?? 30
      for (const slot of getBlockedSlotTimes(live.scheduled_start_time, dur)) {
        set.add(slot)
      }
    }
    return set
  }, [conflictsData?.lives])

  const appliedApiRef = useRef(false)
  useEffect(() => {
    if (!slotsData?.slots || appliedApiRef.current) return
    appliedApiRef.current = true
    const s = slotsData.slots
    setManha(s.manha ?? [])
    setTarde(s.tarde ?? [])
    setNoite(s.noite ?? [])
    setMadrugada(s.madrugada ?? [])
  }, [slotsData])
  useEffect(() => {
    appliedApiRef.current = false
  }, [dateStr])

  const toggleSlot = useCallback(
    (period: PeriodKey, slot: string) => {
      if (purchasedSlots.has(slot) || liveBlockedSlots.has(slot)) return
      const updater = (prev: string[]) =>
        prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
      if (period === 'Manhã') setManha(updater)
      else if (period === 'Tarde') setTarde(updater)
      else if (period === 'Noite') setNoite(updater)
      else setMadrugada(updater)
    },
    [purchasedSlots, liveBlockedSlots]
  )

  const selectAll = useCallback((period: PeriodKey, value: boolean) => {
    const allSlots = period === 'Manhã' ? slotsManha : period === 'Tarde' ? slotsTarde : period === 'Noite' ? slotsNoite : slotsMadrugada
    const setter = period === 'Manhã' ? setManha : period === 'Tarde' ? setTarde : period === 'Noite' ? setNoite : setMadrugada
    if (value) {
      const selectable = allSlots.filter(s => !liveBlockedSlots.has(s))
      setter([...selectable])
    } else {
      const mustKeep = allSlots.filter(s => purchasedSlots.has(s))
      setter([...mustKeep])
    }
  }, [slotsManha, slotsTarde, slotsNoite, slotsMadrugada, purchasedSlots, liveBlockedSlots])

  const handleSave = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user.id
    const token = session.session?.access_token
    if (!userId || !token) {
      toast.error(t('profile.sessionExpired'))
      return
    }
    setSaving(true)
    try {
      const payload = buildAvailabilityPayload(userId, selectedDate, manha, tarde, noite, madrugada)
      await saveCreatorAvailability(payload, token)

      // Auto-enable videochamada when creator has availability slots
      const totalSlots = manha.length + tarde.length + noite.length + madrugada.length
      if (totalSlots > 0) {
        await supabase
          .from('profile_settings')
          .upsert({ profile_id: userId, sell_calls: true }, { onConflict: 'profile_id' })
      }

      toast.success(t('schedule.availabilitySaved'))
      queryClient.invalidateQueries({ queryKey: ['get_creator_daily_slots'] })
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('schedule.errorSaveAvailability')
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }, [selectedDate, manha, tarde, noite, madrugada, supabase, queryClient])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 32 }}>
      {/* Header com voltar + título + ícone */}
      <div
        style={{
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t('common.back')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-foreground)' }}
        >
          <BackIcon />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-foreground)' }}>
          {t('schedule.editAvailability')}
        </span>
        <div style={{ width: 32 }} />
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <p style={{ fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 8 }}>{formatDDMMY(selectedDate)}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: 'var(--color-foreground)' }}>
              {t('schedule.availabilitySubtitle')}
            </span>
            <HelpIcon />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <ExpandableSection
              title="Manhã"
              slots={slotsManha}
              selected={new Set(manha)}
              purchasedSlots={purchasedSlots}
              purchasedLabels={purchasedLabels}
              liveBlockedSlots={liveBlockedSlots}
              purchasedLabel={t('schedule.slotPurchased')}
              liveBlockedLabel={t('schedule.slotBlockedByLive')}
              dateStr={dateStr}
              onToggleSlot={(s) => toggleSlot('Manhã', s)}
              onSelectAll={(v) => selectAll('Manhã', v)}
              isAllSelected={manha.length === slotsManha.length}
              selectAllLabel={t('schedule.selectAll')}
            />
            <ExpandableSection
              title="Tarde"
              slots={slotsTarde}
              selected={new Set(tarde)}
              purchasedSlots={purchasedSlots}
              purchasedLabels={purchasedLabels}
              liveBlockedSlots={liveBlockedSlots}
              purchasedLabel={t('schedule.slotPurchased')}
              liveBlockedLabel={t('schedule.slotBlockedByLive')}
              dateStr={dateStr}
              onToggleSlot={(s) => toggleSlot('Tarde', s)}
              onSelectAll={(v) => selectAll('Tarde', v)}
              isAllSelected={tarde.length === slotsTarde.length}
              selectAllLabel={t('schedule.selectAll')}
            />
            <ExpandableSection
              title="Noite"
              slots={slotsNoite}
              selected={new Set(noite)}
              purchasedSlots={purchasedSlots}
              purchasedLabels={purchasedLabels}
              liveBlockedSlots={liveBlockedSlots}
              purchasedLabel={t('schedule.slotPurchased')}
              liveBlockedLabel={t('schedule.slotBlockedByLive')}
              dateStr={dateStr}
              onToggleSlot={(s) => toggleSlot('Noite', s)}
              onSelectAll={(v) => selectAll('Noite', v)}
              isAllSelected={noite.length === slotsNoite.length}
              selectAllLabel={t('schedule.selectAll')}
            />
            <ExpandableSection
              title="Madrugada"
              slots={slotsMadrugada}
              selected={new Set(madrugada)}
              purchasedSlots={purchasedSlots}
              purchasedLabels={purchasedLabels}
              liveBlockedSlots={liveBlockedSlots}
              purchasedLabel={t('schedule.slotPurchased')}
              liveBlockedLabel={t('schedule.slotBlockedByLive')}
              dateStr={dateStr}
              onToggleSlot={(s) => toggleSlot('Madrugada', s)}
              onSelectAll={(v) => selectAll('Madrugada', v)}
              isAllSelected={madrugada.length === slotsMadrugada.length}
              selectAllLabel={t('schedule.selectAll')}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              marginTop: 24,
              height: 44,
              borderRadius: 8,
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? t('schedule.saving') : t('common.save')}
          </button>
        </>
      )}
    </div>
  )
}

export default function ScheduleAvailabilityPage() {
  return (
    <Suspense>
      <ScheduleAvailabilityContent />
    </Suspense>
  )
}
