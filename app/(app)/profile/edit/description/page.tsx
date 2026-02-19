'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAppStore, useCreator } from '@/lib/store/app-store'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import SelectField from '@/components/ui/SelectField'
import Button from '@/components/ui/Button'

// ─── Options ─────────────────────────────────────────────────────────────────

const EU_SOU_OPTIONS = [
  { value: 'apaixonada', label: 'apaixonada' },
  { value: 'louca', label: 'louca' },
  { value: 'fissurada', label: 'fissurada' },
  { value: 'explorador', label: 'explorador' },
  { value: 'conhecedor', label: 'conhecedor' },
]

const POR_OPTIONS = [
  { value: 'natureza', label: 'natureza' },
  { value: 'animais', label: 'animais' },
  { value: 'tecnologia', label: 'tecnologia' },
  { value: 'arte', label: 'arte' },
  { value: 'música', label: 'música' },
  { value: 'gastronomia', label: 'gastronomia' },
  { value: 'espiritualidade', label: 'espiritualidade' },
  { value: 'cinema', label: 'cinema' },
  { value: 'viagens', label: 'viagens' },
]

const ME_CONSIDERO_OPTIONS = [
  { value: 'inteligente', label: 'inteligente' },
  { value: 'divertida', label: 'divertida' },
  { value: 'simpática', label: 'simpática' },
  { value: 'engraçada', label: 'engraçada' },
  { value: 'carinhosa', label: 'carinhosa' },
  { value: 'determinada', label: 'determinada' },
  { value: 'sonhadora', label: 'sonhadora' },
  { value: 'aventureira', label: 'aventureira' },
  { value: 'tranquila', label: 'tranquila' },
]

const ADORO_OPTIONS = [
  { value: 'conversar', label: 'conversar' },
  { value: 'flertar', label: 'flertar' },
  { value: 'me exibir', label: 'me exibir' },
  { value: 'conhecer pessoas novas', label: 'conhecer pessoas novas' },
  { value: 'me divertir', label: 'me divertir' },
  { value: 'explorar novas culturas', label: 'explorar novas culturas' },
  { value: 'praticar esportes', label: 'praticar esportes' },
  { value: 'viajar', label: 'viajar' },
  { value: 'dançar', label: 'dançar' },
]

const PESSOAS_QUE_OPTIONS = [
  { value: 'têm bom humor', label: 'têm bom humor' },
  { value: 'sabem ouvir', label: 'sabem ouvir' },
  { value: 'são gentis com os outros', label: 'são gentis com os outros' },
  { value: 'sonham grande', label: 'sonham grande' },
  { value: 'vivem com intensidade', label: 'vivem com intensidade' },
  { value: 'gostam de conversar sobre tudo', label: 'gostam de conversar sobre tudo' },
  { value: 'transmitem boas energias', label: 'transmitem boas energias' },
  { value: 'são espontâneas', label: 'são espontâneas' },
  { value: 'gostam de aventuras', label: 'gostam de aventuras' },
  { value: 'são abertas a novas experiências', label: 'são abertas a novas experiências' },
  { value: 'não têm medo de ser quem são', label: 'não têm medo de ser quem são' },
]

// ─── Preview ─────────────────────────────────────────────────────────────────

interface PreviewProps {
  idade: number | null
  cidade: string | null
  euSou: string
  por: string
  meConsidero: string
  adoro: string
  pessoasQue: string
}

function DescricaoPreview({ idade, cidade, euSou, por, meConsidero, adoro, pessoasQue }: PreviewProps) {
  const parts = []
  if (idade) parts.push(`Tenho ${idade} anos`)
  if (cidade) parts.push(`moro em ${cidade}`)
  if (euSou && por) parts.push(`e sou ${euSou} por ${por}`)
  if (meConsidero) parts.push(`Me considero uma pessoa ${meConsidero}`)
  if (adoro) parts.push(`que adora ${adoro}`)
  if (pessoasQue) parts.push(`Gosto de pessoas que ${pessoasQue}`)

  if (!parts.length) return null

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
        Preview
      </p>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-foreground)' }}>
        {parts.join('. ')}.
      </p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AlterarDescricaoPage() {
  const router = useRouter()
  const creator = useCreator()
  const setCreator = useAppStore((s) => s.setCreator)

  const desc = creator?.creator_description

  const [euSou, setEuSou] = useState(desc?.eu_sou ?? '')
  const [por, setPor] = useState(desc?.por ?? '')
  const [meConsidero, setMeConsidero] = useState(desc?.me_considero ?? '')
  const [adoro, setAdoro] = useState(desc?.adoro ?? '')
  const [pessoasQue, setPessoasQue] = useState(desc?.pessoas_que ?? '')
  const [loading, setLoading] = useState(false)

  const isDisabled = !euSou || !por || !meConsidero || !adoro || !pessoasQue

  const handleConfirm = async () => {
    if (!creator || isDisabled) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sem sessão')

      const { error } = await supabase
        .from('creator_description')
        .update({
          eu_sou: euSou,
          por,
          me_considero: meConsidero,
          adoro,
          pessoas_que: pessoasQue,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', session.user.id)

      if (error) throw error

      setCreator({
        ...creator,
        creator_description: {
          ...(creator.creator_description ?? {
            idade: null,
            date_birth: null,
            cidade: null,
            gender: null,
            created_at: '',
            updated_at: '',
          }),
          eu_sou: euSou,
          por,
          me_considero: meConsidero,
          adoro,
          pessoas_que: pessoasQue,
          updated_at: new Date().toISOString(),
        },
      })

      toast.success('Descrição alterada com sucesso')
      router.back()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
      <PageHeader title="Alterar descrição" />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-4">

          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Preencha os campos abaixo para criar sua descrição personalizada.
          </p>

          <DescricaoPreview
            idade={desc?.idade ?? null}
            cidade={desc?.cidade ?? null}
            euSou={euSou}
            por={por}
            meConsidero={meConsidero}
            adoro={adoro}
            pessoasQue={pessoasQue}
          />

          <SelectField
            label="Eu sou"
            placeholder="Selecione..."
            value={euSou}
            onChange={(e) => setEuSou(e.target.value)}
            options={EU_SOU_OPTIONS}
            required
          />

          <SelectField
            label="Por"
            placeholder="Selecione..."
            value={por}
            onChange={(e) => setPor(e.target.value)}
            options={POR_OPTIONS}
            required
          />

          <SelectField
            label="Me considero uma pessoa"
            placeholder="Selecione..."
            value={meConsidero}
            onChange={(e) => setMeConsidero(e.target.value)}
            options={ME_CONSIDERO_OPTIONS}
            required
          />

          <SelectField
            label="Que adora"
            placeholder="Selecione..."
            value={adoro}
            onChange={(e) => setAdoro(e.target.value)}
            options={ADORO_OPTIONS}
            required
          />

          <SelectField
            label="Gosto de pessoas que"
            placeholder="Selecione..."
            value={pessoasQue}
            onChange={(e) => setPessoasQue(e.target.value)}
            options={PESSOAS_QUE_OPTIONS}
            required
          />

          <div className="pb-4 pt-4">
            <Button
              fullWidth
              loading={loading}
              disabled={isDisabled}
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
