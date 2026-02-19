'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

// Opcoes de duracao — espelham FFAppConstants.DURACAO do Flutter
const DURACAO_OPTIONS = ['1 hora', '30 minutos'] as const
type DuracaoOption = typeof DURACAO_OPTIONS[number]

const DURACAO_MINUTOS: Record<DuracaoOption, number> = {
  '1 hora': 60,
  '30 minutos': 30,
}

// ─── Ícones ───────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
)

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────────

function parseCurrencyBRL(raw: string): number {
  // Remove tudo que não é dígito ou vírgula/ponto
  const cleaned = raw.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

const MIN_VALOR_REAIS = 10

function formatCurrencyBRL(raw: string): string {
  // Mantém apenas dígitos (valor em centavos)
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10) / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(num)
}

/** Formata um número em reais para o placeholder/valor mínimo (R$ 10,00). */
function formatMinCurrency(): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(MIN_VALOR_REAIS)
}

// Mascara HH:MM
function maskTime(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function formatDateDisplay(d: Date | null): string {
  if (!d) return 'xx/xx/xxxx'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${d.getFullYear()}`
}

/** Hoje no fuso local (YYYY-MM-DD). Evita que "hoje" no Brasil seja bloqueado por min quando já é dia seguinte em UTC. */
function getTodayLocalYYYYMMDD(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─── Estilos compartilhados ───────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  padding: '10px 12px',
  color: 'var(--color-foreground)',
  fontSize: 14,
  outline: 'none',
}

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: 'var(--color-error)',
}

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-foreground)',
  marginBottom: 4,
  display: 'block',
}

// ─── Componente ───────────────────────────────────────────────────

interface NovoEventoModalProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
  /** Initial date for the event (e.g. selected date on Agenda). */
  initialDate?: Date | null
}

/**
 * NovoEventoModal
 * Replica do NovoEventoWidget Flutter (bottom sheet → modal no web).
 *
 * Campos:
 *  - Título (obrigatório)
 *  - Duração (select: '1 hora' | '30 minutos', obrigatório)
 *  - Valor do ingresso (BRL, mínimo R$10,00, obrigatório)
 *  - Dia do Evento (date picker, obrigatório)
 *  - Horário do evento (HH:MM, obrigatório)
 *
 * Submit: Edge Function create-stripe-live-ticket (igual ao Flutter).
 * Body: title, description, scheduled_start_time, ticket_price, estimated_duration_minutes.
 */
export default function NovoEventoModal({ isOpen, onClose, onRefresh, initialDate = null }: NovoEventoModalProps) {
  const supabase = createClient()

  // Form state
  const [titulo, setTitulo] = useState('')
  const [duracao, setDuracao] = useState<DuracaoOption>('1 hora')
  const [valorRaw, setValorRaw] = useState('')
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(initialDate ?? null)
  const [horario, setHorario] = useState('')

  // Erros
  const [erroTitulo, setErroTitulo] = useState(false)
  const [erroDuracao, setErroDuracao] = useState(false)
  const [erroValor, setErroValor] = useState(false)
  const [erroData, setErroData] = useState(false)
  const [erroHorario, setErroHorario] = useState(false)

  // Loading
  const [loading, setLoading] = useState(false)

  // Input oculto para date picker nativo
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

  // Sync initialDate when modal opens
  useEffect(() => {
    if (isOpen && initialDate) setDataSelecionada(initialDate)
  }, [isOpen, initialDate])

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setTitulo('')
      setDuracao('1 hora')
      setValorRaw('')
      setDataSelecionada(initialDate ?? null)
      setHorario('')
      setErroTitulo(false)
      setErroDuracao(false)
      setErroValor(false)
      setErroData(false)
      setErroHorario(false)
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  // ─── Handlers ───────────────────────────────────────────────────

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorRaw(formatCurrencyBRL(e.target.value))
    setErroValor(false)
  }

  const handleValorBlur = () => {
    const num = parseCurrencyBRL(valorRaw)
    if (num > 0 && num < MIN_VALOR_REAIS) {
      setValorRaw(formatMinCurrency())
    }
  }

  const handleHorarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHorario(maskTime(e.target.value))
    setErroHorario(false)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value // YYYY-MM-DD
    if (val) {
      // Cria a data no timezone local, sem deslocamento UTC
      const [year, month, day] = val.split('-').map(Number)
      setDataSelecionada(new Date(year, month - 1, day))
      setErroData(false)
    }
  }

  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.()
    dateInputRef.current?.click()
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

    if (hasError) return

    // Monta ISO da data+hora
    const [hh, mm] = horario.split(':').map(Number)
    const dataEvento = new Date(
      dataSelecionada!.getFullYear(),
      dataSelecionada!.getMonth(),
      dataSelecionada!.getDate(),
      hh,
      mm,
      0,
    )

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada')

      const { data, error } = await supabase.functions.invoke('create-stripe-live-ticket', {
        body: {
          title: titulo.trim(),
          description: duracao,
          scheduled_start_time: dataEvento.toISOString(),
          ticket_price: valorNum,
          estimated_duration_minutes: DURACAO_MINUTOS[duracao],
        },
      })

      if (error) {
        toast.error(error.message ?? 'Erro ao criar evento. Tente novamente.')
        return
      }

      if (data?.error) {
        toast.error(typeof data.error === 'string' ? data.error : 'Erro ao criar evento. Tente novamente.')
        return
      }

      toast.success('Live agendada com sucesso!')
      onClose()
      onRefresh()
    } catch (err) {
      console.error('[NovoEventoModal] erro:', err)
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 50,
        }}
      />

      {/* Modal — alinhado ao fundo, igual ao bottom sheet Flutter */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="novo-evento-titulo"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 51,
          background: 'var(--color-surface)',
          borderRadius: '4px 4px 0 0',
          padding: '0 16px 28px',
          maxHeight: '90vh',
          overflowY: 'auto',
          // Centraliza em telas largas
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        {/* Barra de fechar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-foreground)', padding: 4 }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Título */}
        <h2
          id="novo-evento-titulo"
          style={{
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--color-foreground)',
            margin: 0,
            marginBottom: 28,
          }}
        >
          Novo evento
        </h2>

        {/* Campos do formulário */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Título do evento */}
          <div>
            <label htmlFor="novo-evento-titulo-input" style={labelStyle}>
              Título
            </label>
            <input
              id="novo-evento-titulo-input"
              type="text"
              placeholder="Escreva um título para o seu evento"
              value={titulo}
              onChange={(e) => { setTitulo(e.target.value); setErroTitulo(false) }}
              style={erroTitulo ? inputErrorStyle : inputStyle}
            />
            {erroTitulo && (
              <span style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
                Campo obrigatório*
              </span>
            )}
          </div>

          {/* Duração */}
          <div>
            <label htmlFor="novo-evento-duracao" style={labelStyle}>
              Informe o tempo de duração do evento
            </label>
            <select
              id="novo-evento-duracao"
              value={duracao}
              onChange={(e) => { setDuracao(e.target.value as DuracaoOption); setErroDuracao(false) }}
              style={{
                ...(erroDuracao ? inputErrorStyle : inputStyle),
                cursor: 'pointer',
              }}
            >
              {DURACAO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {erroDuracao && (
              <span style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
                Campo obrigatório*
              </span>
            )}
          </div>

          {/* Valor do ingresso */}
          <div>
            <label htmlFor="novo-evento-valor" style={labelStyle}>
              Valor do ingresso
            </label>
            <input
              id="novo-evento-valor"
              type="text"
              inputMode="numeric"
              placeholder={formatMinCurrency()}
              value={valorRaw}
              onChange={handleValorChange}
              onBlur={handleValorBlur}
              style={erroValor ? inputErrorStyle : inputStyle}
            />
            {erroValor && (
              <span style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
                Valor mínimo de {formatMinCurrency()}*
              </span>
            )}
          </div>

          {/* Dia do Evento + Horário — layout em linha. Data/hora no fuso local do usuário; envio em UTC. */}
          <div style={{ display: 'flex', gap: 16 }}>

            {/* Dia do Evento */}
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Dia do Evento</label>

              {/* Input nativo invisível — acionado pelo clique no botão visível */}
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
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: erroData ? 'var(--color-error)' : 'var(--color-foreground)',
                }}
                aria-label="Selecionar data"
              >
                <CalendarIcon />
                <span style={{ fontSize: 14 }}>{formatDateDisplay(dataSelecionada)}</span>
              </button>

              {erroData && (
                <span style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
                  Campo obrigatório*
                </span>
              )}
            </div>

            {/* Horário — sempre no fuso local do navegador; ao salvar convertemos para UTC (toISOString). */}
            <div style={{ flex: 1 }}>
              <label htmlFor="novo-evento-horario" style={labelStyle}>
                Horário do evento
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockIcon />
                <input
                  id="novo-evento-horario"
                  type="text"
                  inputMode="numeric"
                  placeholder="00:00"
                  value={horario}
                  onChange={handleHorarioChange}
                  maxLength={5}
                  style={{
                    ...(erroHorario ? inputErrorStyle : inputStyle),
                    flex: 1,
                  }}
                />
              </div>
              {erroHorario && (
                <span style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
                  Horário inválido (HH:MM)*
                </span>
              )}
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 6, marginBottom: 0 }}>
            Data e horário no seu fuso local. Qualquer pessoa vê convertido para o fuso dela.
          </p>
        </div>

        {/* Botão Confirmar */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 8,
            background: loading ? 'var(--color-primary-dark)' : 'var(--color-primary)',
            color: '#ffffff',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 16,
            fontWeight: 600,
            marginTop: 28,
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'opacity 150ms',
          }}
        >
          {loading ? 'Criando...' : 'Confirmar'}
        </button>
      </div>
    </>
  )
}
