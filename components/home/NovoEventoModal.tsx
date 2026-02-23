'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useTranslation, getLocaleBcp47 } from '@/lib/i18n'
import { getTodayLocalYYYYMMDD } from '@/lib/utils/datetime'

// Opcoes de duracao — espelham FFAppConstants.DURACAO do Flutter
type DuracaoOption = '1hora' | '30min'

const DURACAO_MINUTOS: Record<DuracaoOption, number> = {
  '1hora': 60,
  '30min': 30,
}

// Valor enviado ao backend (preserva o formato original da Edge Function)
const DURACAO_BACKEND_VALUE: Record<DuracaoOption, string> = {
  '1hora': '1 hora',
  '30min': '30 minutos',
}

// ─── Ícones ───────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
)

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const SpinnerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2a10 10 0 0 1 10 10" style={{ animation: 'novoEventoSpin 0.7s linear infinite' }} />
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────────

function parseCurrencyBRL(raw: string): number {
  const cleaned = raw.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

const MIN_VALOR_REAIS = 10

function formatCurrencyBRL(raw: string, bcp47 = 'pt-BR'): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10) / 100
  return new Intl.NumberFormat(bcp47, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(num)
}

function formatMinCurrency(bcp47 = 'pt-BR'): string {
  return new Intl.NumberFormat(bcp47, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(MIN_VALOR_REAIS)
}

function maskTime(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function formatDateDisplay(d: Date | null, selectDateLabel: string): string {
  if (!d) return selectDateLabel
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${d.getFullYear()}`
}

// ─── Keyframes ────────────────────────────────────────────────────

const modalKeyframes = `
@keyframes novoEventoOverlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes novoEventoModalIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
@keyframes novoEventoSpin {
  to { transform: rotate(360deg); }
}
@keyframes novoEventoShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
`

// ─── Estilos ──────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  padding: '11px 14px',
  color: 'var(--color-foreground)',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 150ms, box-shadow 150ms',
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-foreground)',
  marginBottom: 6,
  display: 'block',
}

// ─── Componente ───────────────────────────────────────────────────

interface NovoEventoModalProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
  initialDate?: Date | null
}

export default function NovoEventoModal({ isOpen, onClose, onRefresh, initialDate = null }: NovoEventoModalProps) {
  const supabase = createClient()
  const { t, locale } = useTranslation()
  const bcp47 = getLocaleBcp47(locale)

  const [titulo, setTitulo] = useState('')
  const [duracao, setDuracao] = useState<DuracaoOption>('1hora')
  const [valorRaw, setValorRaw] = useState('')
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(initialDate ?? null)
  const [horario, setHorario] = useState('')

  const [erroTitulo, setErroTitulo] = useState(false)
  const [erroDuracao, setErroDuracao] = useState(false)
  const [erroValor, setErroValor] = useState(false)
  const [erroData, setErroData] = useState(false)
  const [erroHorario, setErroHorario] = useState(false)
  const [shakeFields, setShakeFields] = useState(false)

  const [loading, setLoading] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Fecha com Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Ao abrir: sync data e preencher horário com a hora atual
  useEffect(() => {
    if (isOpen) {
      if (initialDate) setDataSelecionada(initialDate)
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      setHorario(`${hh}:${mm}`)
    }
  }, [isOpen, initialDate])

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setTitulo('')
      setDuracao('1hora')
      setValorRaw('')
      setDataSelecionada(initialDate ?? null)
      setHorario('')
      setErroTitulo(false)
      setErroDuracao(false)
      setErroValor(false)
      setErroData(false)
      setErroHorario(false)
      setShakeFields(false)
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  // ─── Handlers ───────────────────────────────────────────────────

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorRaw(formatCurrencyBRL(e.target.value, bcp47))
    setErroValor(false)
  }

  const handleValorBlur = () => {
    const num = parseCurrencyBRL(valorRaw)
    if (valorRaw && num < MIN_VALOR_REAIS) {
      setErroValor(true)
    }
  }

  const handleHorarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHorario(maskTime(e.target.value))
    setErroHorario(false)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val) {
      const [year, month, day] = val.split('-').map(Number)
      setDataSelecionada(new Date(year, month - 1, day))
      setErroData(false)
    }
  }

  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.()
    dateInputRef.current?.click()
  }

  const getInputStyle = (hasError: boolean): React.CSSProperties => ({
    ...inputBase,
    borderColor: hasError ? 'var(--color-error)' : 'var(--color-border)',
  })

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--color-primary)'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(174, 50, 195, 0.15)'
  }

  const handleBlurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, hasError: boolean) => {
    e.currentTarget.style.borderColor = hasError ? 'var(--color-error)' : 'var(--color-border)'
    e.currentTarget.style.boxShadow = 'none'
  }

  // ─── Submit ─────────────────────────────────────────────────────

  const handleSubmit = async () => {
    let hasError = false

    if (!titulo.trim()) { setErroTitulo(true); hasError = true }
    if (!duracao) { setErroDuracao(true); hasError = true }

    const valorNum = parseCurrencyBRL(valorRaw)
    if (valorNum < MIN_VALOR_REAIS) { setErroValor(true); hasError = true }

    if (!dataSelecionada) { setErroData(true); hasError = true }

    const horarioValido = /^\d{2}:\d{2}$/.test(horario)
    if (!horarioValido) { setErroHorario(true); hasError = true }

    if (hasError) {
      setShakeFields(true)
      setTimeout(() => setShakeFields(false), 350)
      return
    }

    // Monta timestamp UTC a partir da data/hora local selecionada pelo usuário
    const [hh, mm] = horario.split(':').map(Number)
    const localDate = new Date(
      dataSelecionada!.getFullYear(),
      dataSelecionada!.getMonth(),
      dataSelecionada!.getDate(),
      hh, mm, 0
    )
    const scheduledStartTime = localDate.toISOString()

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada')

      // Verificar conflito de horário antes de criar
      const durationMin = DURACAO_MINUTOS[duracao]
      const newStart = localDate.getTime()
      const newEnd = newStart + durationMin * 60 * 1000

      const dayStart = new Date(localDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(localDate)
      dayEnd.setHours(23, 59, 59, 999)

      const userId = session.user.id

      const [{ data: lives }, { data: calls }] = await Promise.all([
        supabase
          .from('live_streams')
          .select('scheduled_start_time, estimated_duration_minutes, title')
          .eq('creator_id', userId)
          .in('status', ['scheduled', 'live'])
          .gte('scheduled_start_time', dayStart.toISOString())
          .lte('scheduled_start_time', dayEnd.toISOString()),
        supabase
          .from('one_on_one_calls')
          .select('scheduled_start_time, scheduled_duration_minutes')
          .eq('creator_id', userId)
          .in('status', ['requested', 'confirmed'])
          .gte('scheduled_start_time', dayStart.toISOString())
          .lte('scheduled_start_time', dayEnd.toISOString()),
      ])

      for (const live of lives ?? []) {
        const existStart = new Date(live.scheduled_start_time).getTime()
        const existEnd = existStart + (live.estimated_duration_minutes ?? 60) * 60 * 1000
        if (newStart < existEnd && newEnd > existStart) {
          toast.error(t('events.timeConflictLive'))
          setLoading(false)
          return
        }
      }

      for (const call of calls ?? []) {
        const existStart = new Date(call.scheduled_start_time).getTime()
        const existEnd = existStart + (call.scheduled_duration_minutes ?? 60) * 60 * 1000
        if (newStart < existEnd && newEnd > existStart) {
          toast.error(t('events.timeConflictCall'))
          setLoading(false)
          return
        }
      }

      const { data, error } = await supabase.functions.invoke('create-stripe-live-ticket', {
        body: {
          title: titulo.trim(),
          description: DURACAO_BACKEND_VALUE[duracao],
          scheduled_start_time: scheduledStartTime,
          ticket_price: valorNum,
          estimated_duration_minutes: DURACAO_MINUTOS[duracao],
        },
      })

      if (error) {
        toast.error(error.message ?? t('events.errorCreating'))
        return
      }

      if (data?.error) {
        toast.error(typeof data.error === 'string' ? data.error : t('events.errorCreating'))
        return
      }

      toast.success(t('events.eventCreated'))
      onClose()
      onRefresh()
    } catch (err) {
      console.error('[NovoEventoModal] erro:', err)
      toast.error(t('events.errorCreating'))
    } finally {
      setLoading(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────

  const shakeStyle = shakeFields ? { animation: 'novoEventoShake 300ms ease' } : {}

  return (
    <>
      <style>{modalKeyframes}</style>

      <div
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          animation: 'novoEventoOverlayIn 180ms ease forwards',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          aria-labelledby="novo-evento-titulo"
          style={{
            background: 'var(--color-surface)',
            borderRadius: 20,
            maxHeight: '85vh',
            overflowY: 'auto',
            width: '100%',
            maxWidth: 460,
            animation: 'novoEventoModalIn 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
          }}
        >
          {/* Header com gradiente sutil */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(174, 50, 195, 0.1) 0%, rgba(101, 22, 147, 0.06) 100%)',
              borderRadius: '20px 20px 0 0',
              padding: '20px 24px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ width: 32 }} />
            <h2
              id="novo-evento-titulo"
              style={{
                textAlign: 'center',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--color-foreground)',
                margin: 0,
              }}
            >
              {t('events.newEvent')}
            </h2>
            <button
              onClick={onClose}
              aria-label={t('common.close')}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-muted)',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 150ms, background 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-foreground)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-muted)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Campos do formulário */}
          <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Título do evento */}
            <div style={shakeStyle}>
              <label htmlFor="novo-evento-titulo-input" style={labelStyle}>
                {t('events.eventName')}
              </label>
              <input
                id="novo-evento-titulo-input"
                type="text"
                placeholder={t('events.eventTitlePlaceholder')}
                value={titulo}
                onChange={(e) => { setTitulo(e.target.value); setErroTitulo(false) }}
                onFocus={handleFocus}
                onBlur={(e) => handleBlurStyle(e, erroTitulo)}
                style={getInputStyle(erroTitulo)}
              />
              {erroTitulo && (
                <span style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
                  {t('events.fieldRequired')}
                </span>
              )}
            </div>

            {/* Duração */}
            <div style={shakeStyle}>
              <label htmlFor="novo-evento-duracao" style={labelStyle}>
                {t('events.eventDuration')}
              </label>
              <select
                id="novo-evento-duracao"
                value={duracao}
                onChange={(e) => { setDuracao(e.target.value as DuracaoOption); setErroDuracao(false) }}
                onFocus={handleFocus as unknown as React.FocusEventHandler<HTMLSelectElement>}
                onBlur={(e) => handleBlurStyle(e, erroDuracao)}
                style={{
                  ...getInputStyle(erroDuracao),
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9a9a' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                  paddingRight: 36,
                }}
              >
                <option value="1hora">{t('events.duration1hour')}</option>
                <option value="30min">{t('events.duration30min')}</option>
              </select>
              {erroDuracao && (
                <span style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
                  {t('events.fieldRequired')}
                </span>
              )}
            </div>

            {/* Valor do ingresso */}
            <div style={shakeStyle}>
              <label htmlFor="novo-evento-valor" style={labelStyle}>
                {t('events.eventPrice')}
              </label>
              <input
                id="novo-evento-valor"
                type="text"
                inputMode="numeric"
                placeholder={formatMinCurrency(bcp47)}
                value={valorRaw}
                onChange={handleValorChange}
                onBlur={(e) => { handleValorBlur(); handleBlurStyle(e, erroValor) }}
                onFocus={handleFocus}
                style={getInputStyle(erroValor)}
              />
              {erroValor && (
                <span style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
                  {t('events.minPriceHint', { value: formatMinCurrency(bcp47) })}
                </span>
              )}
            </div>

            {/* Dia do Evento + Horário */}
            <div style={{ display: 'flex', gap: 12, ...shakeStyle }}>

              {/* Dia do Evento */}
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{t('events.eventDate')}</label>

                {/* Input nativo oculto */}
                <input
                  ref={dateInputRef}
                  type="date"
                  min={getTodayLocalYYYYMMDD()}
                  onChange={handleDateChange}
                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                  aria-hidden="true"
                  tabIndex={-1}
                />

                <button
                  type="button"
                  onClick={openDatePicker}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    background: 'var(--color-surface-2)',
                    border: `1px solid ${erroData ? 'var(--color-error)' : 'var(--color-border)'}`,
                    borderRadius: 10,
                    padding: '11px 14px',
                    cursor: 'pointer',
                    color: dataSelecionada ? 'var(--color-foreground)' : 'var(--color-muted)',
                    fontSize: 14,
                    transition: 'border-color 150ms, box-shadow 150ms',
                  }}
                  onMouseEnter={(e) => {
                    if (!erroData) {
                      e.currentTarget.style.borderColor = 'var(--color-primary)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(174, 50, 195, 0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = erroData ? 'var(--color-error)' : 'var(--color-border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  aria-label={t('events.selectDate')}
                >
                  <span style={{ color: 'var(--color-muted)', display: 'flex', flexShrink: 0 }}>
                    <CalendarIcon />
                  </span>
                  <span>{formatDateDisplay(dataSelecionada, t('events.selectDate'))}</span>
                </button>

                {erroData && (
                  <span style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
                    {t('events.fieldRequired')}
                  </span>
                )}
              </div>

              {/* Horário */}
              <div style={{ flex: 1 }}>
                <label htmlFor="novo-evento-horario" style={labelStyle}>
                  {t('events.eventTime')}
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-muted)',
                      display: 'flex',
                      pointerEvents: 'none',
                    }}
                  >
                    <ClockIcon />
                  </span>
                  <input
                    id="novo-evento-horario"
                    type="text"
                    inputMode="numeric"
                    placeholder="00:00"
                    value={horario}
                    onChange={handleHorarioChange}
                    onFocus={handleFocus}
                    onBlur={(e) => handleBlurStyle(e, erroHorario)}
                    maxLength={5}
                    style={{
                      ...getInputStyle(erroHorario),
                      paddingLeft: 40,
                    }}
                  />
                </div>
                {erroHorario && (
                  <span style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
                    {t('events.invalidTime')}
                  </span>
                )}
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>
              {t('events.localTimezoneHint')}
            </p>

            {/* Separador */}
            <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />

            {/* Botão Confirmar */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 12,
                background: loading
                  ? 'var(--color-primary-dark)'
                  : 'linear-gradient(135deg, #AE32C3, #651693)',
                color: '#ffffff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 15,
                fontWeight: 600,
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 150ms, transform 100ms',
              }}
              onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {loading && <SpinnerIcon />}
              {loading ? t('events.creating') : t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
