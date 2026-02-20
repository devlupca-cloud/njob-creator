'use client'

import { useState, useRef, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import SelectField from '@/components/ui/SelectField'
import StepProgress from '@/components/ui/StepProgress'
import PageHeader from '@/components/ui/PageHeader'
import DicasFotosModal from '@/components/ui/DicasFotosModal'
import { signUp } from '@/lib/supabase/auth'
import { checkCreatorPayoutStatus, getCreatorInfo } from '@/lib/supabase/creator'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'

// ─── Currency helpers ────────────────────────────────────────────

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

// ─── Phone mask ──────────────────────────────────────────────────

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}

// ─── CPF mask ────────────────────────────────────────────────────

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

// ─── Constants ──────────────────────────────────────────────────

const TOTAL_STEPS = 5

const GENDER_OPTIONS = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Feminino', label: 'Feminino' },
  { value: 'Não-binário', label: 'Não-binário' },
  { value: 'Gênero fluido', label: 'Gênero fluido' },
  { value: 'Prefiro não dizer', label: 'Prefiro não dizer' },
]

const SEXUALITY_OPTIONS = [
  { value: 'Heterossexual', label: 'Heterossexual' },
  { value: 'Homossexual', label: 'Homossexual' },
  { value: 'Bissexual', label: 'Bissexual' },
  { value: 'Pansexual', label: 'Pansexual' },
  { value: 'Assexual', label: 'Assexual' },
  { value: 'Prefiro não dizer', label: 'Prefiro não dizer' },
]

const LANGUAGE_OPTIONS = [
  { value: 'Português', label: 'Português' },
  { value: 'Inglês', label: 'Inglês' },
  { value: 'Espanhol', label: 'Espanhol' },
]

const EU_SOU_OPTIONS = [
  { value: 'Creator', label: 'Creator' },
  { value: 'Influencer', label: 'Influencer' },
  { value: 'Artista', label: 'Artista' },
  { value: 'Streamer', label: 'Streamer' },
  { value: 'Modelo', label: 'Modelo' },
]

const POR_OPTIONS = [
  { value: 'conteúdo exclusivo', label: 'conteúdo exclusivo' },
  { value: 'lives interativas', label: 'lives interativas' },
  { value: 'videochamadas', label: 'videochamadas' },
  { value: 'encontros', label: 'encontros' },
]

const ME_CONSIDERO_OPTIONS = [
  { value: 'divertida', label: 'divertida' },
  { value: 'carismática', label: 'carismática' },
  { value: 'criativa', label: 'criativa' },
  { value: 'empolgante', label: 'empolgante' },
  { value: 'misteriosa', label: 'misteriosa' },
]

const ADORO_OPTIONS = [
  { value: 'dançar', label: 'dançar' },
  { value: 'cozinhar', label: 'cozinhar' },
  { value: 'viajar', label: 'viajar' },
  { value: 'jogar', label: 'jogar' },
  { value: 'ler', label: 'ler' },
]

const PESSOAS_QUE_OPTIONS = [
  { value: 'curtem entretenimento', label: 'curtem entretenimento' },
  { value: 'buscam conexão', label: 'buscam conexão' },
  { value: 'valorizam exclusividade', label: 'valorizam exclusividade' },
  { value: 'amam novidades', label: 'amam novidades' },
]

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'CPF', label: 'CPF' },
  { value: 'Identidade', label: 'Identidade' },
  { value: 'Passaporte', label: 'Passaporte' },
]

// ─── Form Data ──────────────────────────────────────────────────

interface FormData {
  // Step 0
  nome: string
  dataNascimento: string
  genero: string
  sexualidade: string
  cep: string
  cidade: string
  idioma: string
  email: string
  senha: string
  // Step 1
  euSou: string
  por: string
  meConsidero: string
  adoro: string
  pessoasQue: string
  // Step 2
  vendeConteudo: boolean
  fazVideochamada: boolean
  valor30min: string
  valor1hora: string
  fazEncontro: boolean
  whatsapp: string
  // Step 3 (handled via refs)
  // Step 4
  documentoTipo: string
  documentoNumero: string
}

const initialFormData: FormData = {
  nome: '', dataNascimento: '', genero: '', sexualidade: '',
  cep: '', cidade: '', idioma: 'Português', email: '', senha: '',
  euSou: '', por: '', meConsidero: '', adoro: '', pessoasQue: '',
  vendeConteudo: false, fazVideochamada: false, valor30min: '', valor1hora: '',
  fazEncontro: false, whatsapp: '',
  documentoTipo: 'CPF', documentoNumero: '',
}

// ─── Helpers ────────────────────────────────────────────────────

function formatCEP(val: string) {
  return val.replace(/\D/g, '').slice(0, 8)
}

async function fetchCidade(cep: string): Promise<string> {
  if (cep.length !== 8) return ''
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await res.json()
    if (data.erro) return ''
    return data.localidade ?? ''
  } catch {
    return ''
  }
}

// ─── Component ──────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const setCreator = useAppStore((s) => s.setCreator)

  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [cepLoading, setCepLoading] = useState(false)

  // Image refs
  const profileImgRef = useRef<HTMLInputElement>(null)
  const additionalImgRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const bannerImgRef = useRef<HTMLInputElement>(null)

  // File state — armazena os arquivos selecionados para que sobrevivam à troca de step
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [additionalFiles, setAdditionalFiles] = useState<(File | null)[]>([null, null, null])
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [additionalPreviews, setAdditionalPreviews] = useState<(string | null)[]>([null, null, null])
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [dicasModalOpen, setDicasModalOpen] = useState(false)

  const update = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  // ─── CEP lookup ───────────────────────────────────────────────

  const handleCepBlur = async () => {
    if (formData.cep.length !== 8) return
    setCepLoading(true)
    const cidade = await fetchCidade(formData.cep)
    if (cidade) update('cidade', cidade)
    else toast.error('CEP não encontrado')
    setCepLoading(false)
  }

  // ─── Image previews ───────────────────────────────────────────

  const handleProfileImg = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProfileFile(file)
    setProfilePreview(URL.createObjectURL(file))
  }

  const handleAdditionalImg = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAdditionalFiles((prev) => prev.map((f, i) => (i === index ? file : f)))
    setAdditionalPreviews((prev) => prev.map((p, i) => (i === index ? URL.createObjectURL(file) : p)))
  }

  const handleBannerImg = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  // ─── Step validation ──────────────────────────────────────────

  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (step === 0) {
      if (!formData.nome) newErrors.nome = 'Nome obrigatório'
      if (!formData.dataNascimento) newErrors.dataNascimento = 'Data obrigatória'
      if (!formData.genero) newErrors.genero = 'Gênero obrigatório'
      if (!formData.sexualidade) newErrors.sexualidade = 'Sexualidade obrigatória'
      if (!formData.cep) newErrors.cep = 'CEP obrigatório'
      if (!formData.cidade) newErrors.cidade = 'Cidade obrigatória'
      if (!formData.email) newErrors.email = 'E-mail obrigatório'
      if (!formData.senha) newErrors.senha = 'Senha obrigatória'
      else if (formData.senha.length < 6) newErrors.senha = 'Mínimo de 6 caracteres'
    }

    if (step === 2) {
      if (formData.fazVideochamada) {
        const v30 = parseCurrency(formData.valor30min)
        const v1h = parseCurrency(formData.valor1hora)
        if (v30 < 10) newErrors.valor30min = 'Valor mínimo é R$ 10,00'
        if (v1h < 10) newErrors.valor1hora = 'Valor mínimo é R$ 10,00'
      }
    }

    if (step === 3) {
      if (!profileFile) {
        toast.error('Foto de perfil obrigatória')
        return false
      }
    }

    if (step === 4) {
      if (!formData.documentoNumero) newErrors.documentoNumero = 'Documento obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = async () => {
    if (!validateStep()) return

    // No step 0, verifica se o email já existe antes de avançar
    if (step === 0) {
      setLoading(true)
      try {
        const supabase = createClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('check_email_exists', {
          email_input: formData.email.toLowerCase(),
        })

        if (error) {
          console.error('Erro ao verificar email:', error)
          // Se a função RPC não existir, avança sem verificar
        } else if (data === true) {
          setErrors((prev) => ({ ...prev, email: 'Este e-mail já está cadastrado' }))
          toast.error('Este e-mail já está cadastrado. Tente fazer login.')
          setLoading(false)
          return
        }
      } catch {
        // Se falhar, avança sem verificar
      }
      setLoading(false)
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  const prevStep = () => setStep((s) => Math.max(s - 1, 0))

  // ─── Mapear gênero do form para o enum do banco ─────────────────

  const mapGenderToEnum = (genero: string): 'Homem' | 'Mulher' | 'Não binário' | null => {
    if (genero === 'Masculino') return 'Homem'
    if (genero === 'Feminino') return 'Mulher'
    if (genero) return 'Não binário'
    return null
  }

  const calcAge = (dataNascimento: string): number => {
    if (!dataNascimento) return 0
    const birth = new Date(dataNascimento)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  // ─── Criar perfil e dados no banco após signUp ─────────────────

  const createProfileData = async (supabase: ReturnType<typeof createClient>, userId: string) => {
    // 1) Inserir na tabela profiles
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      full_name: formData.nome,
      username: formData.nome,
      role: 'creator' as const,
      is_active: true,
      date_birth: formData.dataNascimento || null,
      whatsapp: formData.whatsapp || null,
    })

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      throw new Error('Erro ao criar perfil: ' + profileError.message)
    }

    // 2) Inserir na tabela creator_description (dados do step 1)
    if (formData.euSou || formData.cidade) {
      const { error: descError } = await supabase.from('creator_description').insert({
        profile_id: userId,
        cidade: formData.cidade,
        eu_sou: formData.euSou || '',
        por: formData.por || '',
        me_considero: formData.meConsidero || '',
        adoro: formData.adoro || '',
        pessoas_que: formData.pessoasQue || '',
        idade: calcAge(formData.dataNascimento),
        date_birth: formData.dataNascimento || null,
        gender: mapGenderToEnum(formData.genero),
      })

      if (descError) {
        console.error('Erro ao criar descrição:', descError)
      }
    }
  }

  // ─── Upload de imagens e salvar referências ─────────────────────

  const uploadImagesAndSave = async (supabase: ReturnType<typeof createClient>, userId: string) => {
    const ts = Date.now()
    const bucket = 'images'
    const prefix = 'profiles'

    // Foto de perfil (lê do estado, não da ref)
    if (profileFile) {
      const path = `${prefix}/${userId}/${ts}-profile-${profileFile.name}`
      const { error } = await supabase.storage.from(bucket).upload(path, profileFile, { upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
        // Salvar como avatar no perfil
        await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', userId)
        // Salvar na tabela profile_images
        await supabase.from('profile_images').insert({
          profile_id: userId,
          image_url: urlData.publicUrl,
          highlight_image_url: true,
          index: 0,
        })
      }
    }

    // Fotos adicionais (lê do estado, não das refs)
    for (let i = 0; i < additionalFiles.length; i++) {
      const file = additionalFiles[i]
      if (file) {
        const path = `${prefix}/${userId}/${ts}-additional-${i}-${file.name}`
        const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
        if (!error) {
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
          await supabase.from('profile_images').insert({
            profile_id: userId,
            image_url: urlData.publicUrl,
            highlight_image_url: false,
            index: i + 1,
          })
        }
      }
    }

    // Banner (lê do estado, não da ref)
    if (bannerFile) {
      const path = `${prefix}/${userId}/${ts}-banner-${bannerFile.name}`
      await supabase.storage.from(bucket).upload(path, bannerFile, { upsert: true })
    }
  }

  // ─── Final submission ──────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateStep()) return

    setLoading(true)

    await signUp(formData.email, formData.senha, formData.nome, {
      onSuccess: async () => {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()

          if (!user) {
            toast.error('Erro ao obter usuário após cadastro.')
            setLoading(false)
            return
          }

          // Criar perfil e descrição no banco
          await createProfileData(supabase, user.id)

          // Upload de imagens e salvar referências
          await uploadImagesAndSave(supabase, user.id)

          // Verificar status de creator/payout
          await checkCreatorPayoutStatus(supabase, {
            isCreatorAndCompleted: async () => {
              const info = await getCreatorInfo(supabase)
              if (info) setCreator(info)
              router.push('/home')
            },
            isCreatorAndPending: (url) => {
              router.push(`/stripe-setup?url=${encodeURIComponent(url)}`)
            },
            isNotCreator: () => {
              toast.error('Você não tem acesso a esta plataforma.')
              setLoading(false)
            },
            onError: (msg) => {
              toast.error(msg)
              setLoading(false)
            },
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erro ao finalizar cadastro'
          toast.error(msg)
          setLoading(false)
        }
      },
      onEmailAlreadyInUse: () => {
        toast.error('E-mail já cadastrado.')
        setStep(0)
        setErrors((prev) => ({ ...prev, email: 'Este e-mail já está cadastrado' }))
        setLoading(false)
      },
      onWeakPassword: () => {
        toast.error('Senha muito fraca.')
        setStep(0)
        setLoading(false)
      },
      onError: (msg) => {
        toast.error(msg)
        setLoading(false)
      },
    })
  }

  // ─── Render helpers ───────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case 0:
        return <Step0 formData={formData} errors={errors} update={update} cepLoading={cepLoading} onCepBlur={handleCepBlur} formatCEP={formatCEP} />
      case 1:
        return <Step1 formData={formData} update={update} onSkip={() => setStep(2)} />
      case 2:
        return <Step2 formData={formData} update={update} errors={errors} />
      case 3:
        return (
          <Step3
            profilePreview={profilePreview}
            additionalPreviews={additionalPreviews}
            bannerPreview={bannerPreview}
            profileImgRef={profileImgRef}
            additionalImgRefs={additionalImgRefs}
            bannerImgRef={bannerImgRef}
            onProfileImg={handleProfileImg}
            onAdditionalImg={handleAdditionalImg}
            onBannerImg={handleBannerImg}
            onOpenDicas={() => setDicasModalOpen(true)}
          />
        )
      case 4:
        return <Step4 formData={formData} errors={errors} update={update} />
      default:
        return null
    }
  }

  const stepTitles = [
    'Dados pessoais',
    'Descrição',
    'Interações',
    'Fotos',
    'Documento',
  ]

  return (
    <>
    <div className="flex flex-col">
      {step === 0 && (
        <div className="flex justify-center mb-4">
          <Image
            src="/njob-logo.png"
            alt="NJob"
            width={140}
            height={56}
            className="object-contain"
            priority
          />
        </div>
      )}
      <PageHeader
        title={stepTitles[step]}
        showBack={step > 0}
        onBack={prevStep}
      />

      <div className="mt-6">
        <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />
      </div>

      <form onSubmit={step === TOTAL_STEPS - 1 ? handleSubmit : async (e) => { e.preventDefault(); await nextStep() }}>
        <div className="flex flex-col gap-4">
          {renderStep()}
        </div>

        <div className="flex flex-col gap-3 mt-6">
          {step < TOTAL_STEPS - 1 ? (
            <Button type="submit" variant="primary" size="lg" fullWidth loading={step === 0 && loading}>
              Próxima etapa
            </Button>
          ) : (
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Confirmar
            </Button>
          )}

          {step === 0 && (
            <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
              Já tem conta?{' '}
              <Link
                href="/login"
                className="font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-primary)' }}
              >
                Fazer login
              </Link>
            </p>
          )}
        </div>
      </form>
    </div>
    {dicasModalOpen && <DicasFotosModal onClose={() => setDicasModalOpen(false)} />}
    </>
  )
}

// ─── Step 0 — Dados pessoais ───────────────────────────────────

function Step0({
  formData, errors, update, cepLoading, onCepBlur, formatCEP,
}: {
  formData: FormData
  errors: Partial<Record<keyof FormData, string>>
  update: (field: keyof FormData, value: string | boolean) => void
  cepLoading: boolean
  onCepBlur: () => void
  formatCEP: (v: string) => string
}) {
  return (
    <>
      <Input
        label="Nome completo"
        placeholder="Seu nome"
        value={formData.nome}
        onChange={(e) => update('nome', e.target.value)}
        error={errors.nome}
        required
      />
      <Input
        label="Data de nascimento"
        type="date"
        value={formData.dataNascimento}
        onChange={(e) => update('dataNascimento', e.target.value)}
        error={errors.dataNascimento}
        required
      />
      <SelectField
        label="Gênero"
        options={GENDER_OPTIONS}
        value={formData.genero}
        onChange={(e) => update('genero', e.target.value)}
        error={errors.genero}
        placeholder="Selecione"
        required
      />
      <SelectField
        label="Sexualidade"
        options={SEXUALITY_OPTIONS}
        value={formData.sexualidade}
        onChange={(e) => update('sexualidade', e.target.value)}
        error={errors.sexualidade}
        placeholder="Selecione"
        required
      />
      <Input
        label="CEP"
        placeholder="00000000"
        value={formData.cep}
        onChange={(e) => update('cep', formatCEP(e.target.value))}
        onBlur={onCepBlur}
        error={errors.cep}
        inputMode="numeric"
        hint={cepLoading ? 'Buscando cidade...' : undefined}
        required
      />
      <Input
        label="Cidade"
        placeholder="Preenchido automaticamente"
        value={formData.cidade}
        onChange={(e) => update('cidade', e.target.value)}
        error={errors.cidade}
        readOnly={cepLoading}
        required
      />
      <SelectField
        label="Idioma"
        options={LANGUAGE_OPTIONS}
        value={formData.idioma}
        onChange={(e) => update('idioma', e.target.value)}
        required
      />
      <Input
        label="E-mail"
        type="email"
        placeholder="seu@email.com"
        value={formData.email}
        onChange={(e) => update('email', e.target.value)}
        error={errors.email}
        autoComplete="email"
        required
      />
      <PasswordInput
        label="Senha"
        placeholder="Mínimo 6 caracteres"
        value={formData.senha}
        onChange={(e) => update('senha', e.target.value)}
        error={errors.senha}
        autoComplete="new-password"
        required
      />
    </>
  )
}

// ─── Step 1 — Descrição ───────────────────────────────────────

function Step1({
  formData, update, onSkip,
}: {
  formData: FormData
  update: (field: keyof FormData, value: string | boolean) => void
  onSkip: () => void
}) {
  return (
    <>
      <p className="text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
        Complete a frase sobre você:
      </p>
      <div
        className="rounded-xl p-4 text-sm space-y-3"
        style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}
      >
        <p>
          Sou{' '}
          <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
            {formData.nome || 'seu nome'}
          </span>
          , moro em{' '}
          <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
            {formData.cidade || 'sua cidade'}
          </span>{' '}
          e sou{' '}
          <span style={{ color: 'var(--color-primary)' }}>{formData.euSou || '___'}</span>{' '}
          por{' '}
          <span style={{ color: 'var(--color-primary)' }}>{formData.por || '___'}</span>.{' '}
          Me considero uma pessoa{' '}
          <span style={{ color: 'var(--color-primary)' }}>{formData.meConsidero || '___'}</span>,{' '}
          <span style={{ color: 'var(--color-primary)' }}>{formData.pessoasQue || '___'}</span>{' '}
          que adora{' '}
          <span style={{ color: 'var(--color-primary)' }}>{formData.adoro || '___'}</span>.
        </p>
      </div>

      <SelectField
        label="Sou"
        options={EU_SOU_OPTIONS}
        value={formData.euSou}
        onChange={(e) => update('euSou', e.target.value)}
        placeholder="Selecione"
      />
      <SelectField
        label="Por"
        options={POR_OPTIONS}
        value={formData.por}
        onChange={(e) => update('por', e.target.value)}
        placeholder="Selecione"
      />
      <SelectField
        label="Me considero"
        options={ME_CONSIDERO_OPTIONS}
        value={formData.meConsidero}
        onChange={(e) => update('meConsidero', e.target.value)}
        placeholder="Selecione"
      />
      <SelectField
        label="Que adora"
        options={ADORO_OPTIONS}
        value={formData.adoro}
        onChange={(e) => update('adoro', e.target.value)}
        placeholder="Selecione"
      />
      <SelectField
        label="Pessoas que"
        options={PESSOAS_QUE_OPTIONS}
        value={formData.pessoasQue}
        onChange={(e) => update('pessoasQue', e.target.value)}
        placeholder="Selecione"
      />

      <button
        type="button"
        onClick={onSkip}
        className="text-sm font-medium text-center transition-opacity hover:opacity-70"
        style={{ color: 'var(--color-muted)' }}
      >
        Pular etapa
      </button>
    </>
  )
}

// ─── Step 2 — Interações ──────────────────────────────────────

function Step2({
  formData, update, errors,
}: {
  formData: FormData
  update: (field: keyof FormData, value: string | boolean) => void
  errors: Partial<Record<keyof FormData, string>>
}) {
  return (
    <>
      <p className="text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
        Defina o que você oferece:
      </p>

      <ToggleRow
        label="Vende conteúdo?"
        checked={formData.vendeConteudo}
        onChange={(v) => update('vendeConteudo', v)}
      />

      <ToggleRow
        label="Faz vídeochamada individual?"
        checked={formData.fazVideochamada}
        onChange={(v) => update('fazVideochamada', v)}
      />

      {formData.fazVideochamada && (
        <>
          <Input
            label="Valor por 30 minutos (R$)"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={formData.valor30min ? `R$ ${formData.valor30min}` : ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/^R\$\s?/, '')
              update('valor30min', formatCurrency(raw))
            }}
            error={errors.valor30min}
          />
          <Input
            label="Valor por 1 hora (R$)"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={formData.valor1hora ? `R$ ${formData.valor1hora}` : ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/^R\$\s?/, '')
              update('valor1hora', formatCurrency(raw))
            }}
            error={errors.valor1hora}
          />
        </>
      )}

      <ToggleRow
        label="Faz encontro presencial?"
        checked={formData.fazEncontro}
        onChange={(v) => update('fazEncontro', v)}
      />

      {formData.fazEncontro && (
        <Input
          label="WhatsApp"
          placeholder="(11) 9 9999-9999"
          value={formData.whatsapp}
          onChange={(e) => update('whatsapp', formatPhone(e.target.value))}
          inputMode="numeric"
          maxLength={16}
        />
      )}
    </>
  )
}

function ToggleRow({
  label, checked, onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        style={{ background: checked ? 'var(--color-primary)' : 'var(--color-border)' }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(4px)' }}
        />
      </button>
    </div>
  )
}

// ─── Step 3 — Fotos ────────────────────────────────────────────

function Step3({
  profilePreview, additionalPreviews, bannerPreview,
  profileImgRef, additionalImgRefs, bannerImgRef,
  onProfileImg, onAdditionalImg, onBannerImg, onOpenDicas,
}: {
  profilePreview: string | null
  additionalPreviews: (string | null)[]
  bannerPreview: string | null
  profileImgRef: React.RefObject<HTMLInputElement | null>
  additionalImgRefs: React.RefObject<HTMLInputElement | null>[]
  bannerImgRef: React.RefObject<HTMLInputElement | null>
  onProfileImg: (e: ChangeEvent<HTMLInputElement>) => void
  onAdditionalImg: (index: number, e: ChangeEvent<HTMLInputElement>) => void
  onBannerImg: (e: ChangeEvent<HTMLInputElement>) => void
  onOpenDicas?: () => void
}) {
  return (
    <>
      <p className="text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
        Adicione suas fotos de perfil. A foto principal é obrigatória.
        {onOpenDicas && (
          <button type="button" onClick={onOpenDicas} className="ml-1 underline" style={{ color: 'var(--color-primary)' }}>Ver dicas de fotos</button>
        )}
      </p>

      {/* Profile photo */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
          Foto de perfil <span style={{ color: 'var(--color-primary)' }}>*</span>
        </label>
        <ImageUploadBox
          preview={profilePreview}
          onClick={() => profileImgRef.current?.click()}
          label="Foto principal"
        />
        <input
          ref={profileImgRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onProfileImg}
        />
      </div>

      {/* Additional photos */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
          Fotos complementares (até 3)
        </label>
        <div className="grid grid-cols-3 gap-3">
          {additionalImgRefs.map((ref, i) => (
            <div key={i}>
              <ImageUploadBox
                preview={additionalPreviews[i]}
                onClick={() => ref.current?.click()}
                label={`Foto ${i + 2}`}
                compact
              />
              <input
                ref={ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onAdditionalImg(i, e)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Banner photo */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
          Foto de capa
        </label>
        <ImageUploadBox
          preview={bannerPreview}
          onClick={() => bannerImgRef.current?.click()}
          label="Foto de capa"
          banner
        />
        <input
          ref={bannerImgRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onBannerImg}
        />
      </div>

      {onOpenDicas && (
        <button type="button" onClick={onOpenDicas} className="rounded-xl p-3 text-xs w-full text-left" style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
          💡 Ver dicas para as fotos
        </button>
      )}
    </>
  )
}

function ImageUploadBox({
  preview, onClick, label, compact = false, banner = false,
}: {
  preview: string | null
  onClick: () => void
  label: string
  compact?: boolean
  banner?: boolean
}) {
  const height = banner ? 'h-32' : compact ? 'h-24' : 'h-40'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full ${height} rounded-xl flex items-center justify-center overflow-hidden transition-opacity hover:opacity-80`}
      style={{
        background: preview ? 'transparent' : 'var(--color-surface)',
        border: `2px dashed ${preview ? 'var(--color-primary)' : 'var(--color-border)'}`,
      }}
    >
      {preview ? (
        <img src={preview} alt={label} className="w-full h-full object-cover rounded-xl" />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--color-muted)' }}>
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          {!compact && (
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {label}
            </span>
          )}
        </div>
      )}
    </button>
  )
}

// ─── Step 4 — Documento ───────────────────────────────────────

function Step4({
  formData, errors, update,
}: {
  formData: FormData
  errors: Partial<Record<keyof FormData, string>>
  update: (field: keyof FormData, value: string | boolean) => void
}) {
  const placeholder = formData.documentoTipo === 'Passaporte' ? 'AA1234567' : '000.000.000-00'

  return (
    <>
      <SelectField
        label="Tipo de documento"
        options={DOCUMENT_TYPE_OPTIONS}
        value={formData.documentoTipo}
        onChange={(e) => {
          update('documentoTipo', e.target.value)
          update('documentoNumero', '')
        }}
        required
      />
      <Input
        label={formData.documentoTipo}
        placeholder={placeholder}
        value={formData.documentoNumero}
        onChange={(e) => {
          const val = formData.documentoTipo === 'CPF'
            ? formatCPF(e.target.value)
            : e.target.value
          update('documentoNumero', val)
        }}
        inputMode={formData.documentoTipo === 'CPF' ? 'numeric' : undefined}
        maxLength={formData.documentoTipo === 'CPF' ? 14 : undefined}
        error={errors.documentoNumero}
        required
      />
    </>
  )
}
