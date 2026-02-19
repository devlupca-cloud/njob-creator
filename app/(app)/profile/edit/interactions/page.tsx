'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAppStore, useCreator } from '@/lib/store/app-store'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

// ─── Toggle ──────────────────────────────────────────────────────────────────

interface ToggleOptionProps {
  title: string
  value: boolean
  onChange: (value: boolean) => void
}

function ToggleOption({ title, value, onChange }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
        {title}
      </span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="relative w-12 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        style={{ background: value ? 'var(--color-primary)' : 'var(--color-border)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200"
          style={{
            background: '#fff',
            transform: value ? 'translateX(24px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  )
}

// ─── Currency input ───────────────────────────────────────────────────────────

function formatCurrency(value: string): string {
  const num = value.replace(/\D/g, '')
  if (!num) return ''
  const parsed = parseInt(num, 10) / 100
  return parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseCurrency(value: string): number {
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

interface CurrencyInputProps {
  label: string
  value: string
  onChange: (raw: string) => void
  error?: string
}

function CurrencyInput({ label, value, onChange, error }: CurrencyInputProps) {
  return (
    <Input
      label={label}
      value={value ? `R$ ${value}` : ''}
      onChange={(e) => {
        const raw = e.target.value.replace(/^R\$\s?/, '')
        onChange(formatCurrency(raw))
      }}
      placeholder="R$ 0,00"
      error={error}
      inputMode="numeric"
    />
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  children: React.ReactNode
}

function SectionCard({ children }: SectionCardProps) {
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {children}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AlterarInteracoesPage() {
  const router = useRouter()
  const creator = useCreator()
  const setCreator = useAppStore((s) => s.setCreator)

  const [vendePacks, setVendePacks] = useState(false)
  const [fazVideochamada, setFazVideochamada] = useState(false)
  const [valor30min, setValor30min] = useState('')
  const [valor1hora, setValor1hora] = useState('')
  const [fazEncontro, setFazEncontro] = useState(false)
  const [whatsapp, setWhatsapp] = useState(creator?.profile.whatsapp ?? '')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      if (!creator) {
        setInitialLoading(false)
        return
      }
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setInitialLoading(false)
          return
        }

        const { data } = await supabase
          .from('profile_settings')
          .select('*')
          .eq('profile_id', session.user.id)
          .single()

        if (data) {
          setVendePacks(data.sell_packs)
          setFazVideochamada(data.sell_calls)
          setFazEncontro(data.face_to_face_meeting)
          if (data.call_per_30_min) {
            setValor30min(formatCurrency(String(Math.round(data.call_per_30_min * 100))))
          }
          if (data.call_per_1_hr) {
            setValor1hora(formatCurrency(String(Math.round(data.call_per_1_hr * 100))))
          }
        }
      } catch {
        // Settings may not exist yet — silent failure, user can fill in
      } finally {
        setInitialLoading(false)
      }
    }

    loadSettings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConfirm = async () => {
    if (!creator) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sem sessao')

      // Update profile_settings
      const { error: settingsError } = await supabase
        .from('profile_settings')
        .update({
          sell_packs: vendePacks,
          sell_calls: fazVideochamada,
          face_to_face_meeting: fazEncontro,
          call_per_30_min: parseCurrency(valor30min),
          call_per_1_hr: parseCurrency(valor1hora),
        })
        .eq('profile_id', session.user.id)

      if (settingsError) throw settingsError

      // Update whatsapp in profiles
      if (whatsapp !== creator.profile.whatsapp) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ whatsapp })
          .eq('id', session.user.id)

        if (profileError) throw profileError

        setCreator({
          ...creator,
          profile: { ...creator.profile, whatsapp },
        })
      }

      toast.success('Interacoes alteradas com sucesso')
      router.back()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
        <PageHeader title="Alterar interacoes" />
        <div className="flex-1 flex items-center justify-center">
          <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
      <PageHeader title="Alterar interacoes" />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-4">

          {/* Vende conteudo */}
          <SectionCard>
            <ToggleOption
              title="Vende Conteudo?"
              value={vendePacks}
              onChange={setVendePacks}
            />
          </SectionCard>

          {/* Videochamada */}
          <SectionCard>
            <ToggleOption
              title="Faz videochamada individual?"
              value={fazVideochamada}
              onChange={setFazVideochamada}
            />
            {fazVideochamada && (
              <>
                <div style={{ height: '1px', background: 'var(--color-border)' }} />
                <CurrencyInput
                  label="Valor por 30 minutos de videochamada"
                  value={valor30min}
                  onChange={setValor30min}
                />
                <CurrencyInput
                  label="Valor por hora de videochamada"
                  value={valor1hora}
                  onChange={setValor1hora}
                />
              </>
            )}
          </SectionCard>

          {/* Encontro presencial */}
          <SectionCard>
            <ToggleOption
              title="Faz encontro presencial?"
              value={fazEncontro}
              onChange={setFazEncontro}
            />
            <div style={{ height: '1px', background: 'var(--color-border)' }} />
            <Input
              label="WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+55 (11) 9 0000-0000"
              type="tel"
            />
          </SectionCard>

          <div className="pb-4 pt-2">
            <Button
              fullWidth
              loading={loading}
              onClick={handleConfirm}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
