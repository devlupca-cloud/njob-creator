'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { checkCreatorPayoutStatus, getCreatorInfo } from '@/lib/supabase/creator'
import { signOut } from '@/lib/supabase/auth'
import { useAppStore } from '@/lib/store/app-store'

function StripeSetupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const onboardingUrl = searchParams.get('url') ?? ''
  const [loading, setLoading] = useState(false)
  const setCreator = useAppStore((s) => s.setCreator)

  const handleVerify = async () => {
    setLoading(true)
    const supabase = createClient()

    await checkCreatorPayoutStatus(supabase, {
      isCreatorAndCompleted: async () => {
        const info = await getCreatorInfo(supabase)
        if (info) setCreator(info)
        router.push('/home')
      },
      isCreatorAndPending: () => {
        setLoading(false)
        toast.info('Cadastro ainda pendente. Finalize o processo no Stripe.')
      },
      isNotCreator: async () => {
        toast.error('Acesso não permitido.')
        await signOut()
        router.push('/login')
      },
      onError: async (msg) => {
        toast.error(msg)
        setLoading(false)
      },
    })
  }

  return (
    <div
      className="rounded-2xl p-8 flex flex-col gap-6"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Logo */}
      <div className="text-center">
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
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-foreground)' }}
        >
          Cadastro no Stripe
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
          Para receber pagamentos, você precisa completar seu cadastro no Stripe.
        </p>
      </div>

      {/* Instructions */}
      <div
        className="rounded-xl p-4 text-sm space-y-2"
        style={{
          background: 'var(--color-background)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-muted)',
        }}
      >
        <p>1. Clique no link abaixo para acessar o Stripe</p>
        <p>2. Preencha todas as informações solicitadas</p>
        <p>3. Volte aqui e clique em &quot;Verificar cadastro&quot;</p>
      </div>

      {/* Onboarding URL */}
      {onboardingUrl && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
            Link de cadastro Stripe:
          </p>
          <a
            href={onboardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg px-3 py-2.5 text-sm break-all transition-opacity hover:opacity-70"
            style={{
              background: 'var(--color-background)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {onboardingUrl}
          </a>
        </div>
      )}

      {/* Verify button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        onClick={handleVerify}
      >
        Verificar cadastro
      </Button>
    </div>
  )
}

export default function StripeSetupPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--color-muted)' }} className="text-center py-8">Carregando...</div>}>
      <StripeSetupContent />
    </Suspense>
  )
}
