'use client'

import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
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

function ExpandableSection({
  title,
  slots,
  selected,
  onToggleSlot,
  onSelectAll,
  isAllSelected,
}: {
  title: string
  slots: string[]
  selected: Set<string>
  onToggleSlot: (s: string) => void
  onSelectAll: (v: boolean) => void
  isAllSelected: boolean
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
              const isSelected = selected.has(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onToggleSlot(s)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-2)',
                    color: isSelected ? '#fff' : 'var(--color-foreground)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {s}
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
            Selecionar todos
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
      const updater = (prev: string[]) =>
        prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
      if (period === 'Manhã') setManha(updater)
      else if (period === 'Tarde') setTarde(updater)
      else if (period === 'Noite') setNoite(updater)
      else setMadrugada(updater)
    },
    []
  )

  const selectAll = useCallback((period: PeriodKey, value: boolean) => {
    const slots = period === 'Manhã' ? slotsManha : period === 'Tarde' ? slotsTarde : period === 'Noite' ? slotsNoite : slotsMadrugada
    if (period === 'Manhã') setManha(value ? [...slots] : [])
    else if (period === 'Tarde') setTarde(value ? [...slots] : [])
    else if (period === 'Noite') setNoite(value ? [...slots] : [])
    else setMadrugada(value ? [...slots] : [])
  }, [slotsManha, slotsTarde, slotsNoite, slotsMadrugada])

  const handleSave = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user.id
    const token = session.session?.access_token
    if (!userId || !token) {
      toast.error('Sessão expirada. Faça login novamente.')
      return
    }
    setSaving(true)
    try {
      const payload = buildAvailabilityPayload(userId, selectedDate, manha, tarde, noite, madrugada)
      await saveCreatorAvailability(payload, token)
      toast.success('Disponibilidade salva')
      queryClient.invalidateQueries({ queryKey: ['get_creator_daily_slots'] })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar'
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
          aria-label="Voltar"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-foreground)' }}
        >
          <BackIcon />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-foreground)' }}>
          Editar disponibilidade
        </span>
        <button
          type="button"
          aria-label="Notificações"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-foreground)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <p style={{ fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 8 }}>{formatDDMMY(selectedDate)}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: 'var(--color-foreground)' }}>
              Selecione os horários conforme sua disponibilidade.
            </span>
            <HelpIcon />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <ExpandableSection
              title="Manhã"
              slots={slotsManha}
              selected={new Set(manha)}
              onToggleSlot={(s) => toggleSlot('Manhã', s)}
              onSelectAll={(v) => selectAll('Manhã', v)}
              isAllSelected={manha.length === slotsManha.length}
            />
            <ExpandableSection
              title="Tarde"
              slots={slotsTarde}
              selected={new Set(tarde)}
              onToggleSlot={(s) => toggleSlot('Tarde', s)}
              onSelectAll={(v) => selectAll('Tarde', v)}
              isAllSelected={tarde.length === slotsTarde.length}
            />
            <ExpandableSection
              title="Noite"
              slots={slotsNoite}
              selected={new Set(noite)}
              onToggleSlot={(s) => toggleSlot('Noite', s)}
              onSelectAll={(v) => selectAll('Noite', v)}
              isAllSelected={noite.length === slotsNoite.length}
            />
            <ExpandableSection
              title="Madrugada"
              slots={slotsMadrugada}
              selected={new Set(madrugada)}
              onToggleSlot={(s) => toggleSlot('Madrugada', s)}
              onSelectAll={(v) => selectAll('Madrugada', v)}
              isAllSelected={madrugada.length === slotsMadrugada.length}
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
            {saving ? 'Salvando...' : 'Salvar'}
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
