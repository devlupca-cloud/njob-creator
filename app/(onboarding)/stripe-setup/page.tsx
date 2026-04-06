'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { createStripeAccount } from '@/lib/supabase/creator'
import { useTranslation } from '@/lib/i18n'

function StripeSetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(
    searchParams.get('url')
  )
  const [loading, setLoading] = useState(!searchParams.get('url'))
  const [checking, setChecking] = useState(false)
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // Ao montar, verificar se o Stripe já foi completado (ex: creator voltou do onboarding)
  useEffect(() => {
    const checkIfAlreadyCompleted = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setInitialCheckDone(true)
        return
      }

      // Sincronizar status com Stripe
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/creator-payout-update-link`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        ).catch(() => null)
      }

      const { data: payoutInfo } = await supabase
        .from('creator_payout_info')
        .select('status')
        .eq('creator_id', user.id)
        .maybeSingle()

      if (payoutInfo?.status === 'COMPLETED') {
        toast.success('Conta Stripe configurada com sucesso!')
        router.replace('/home')
        return
      }

      if (payoutInfo?.status === 'VERIFYING') {
        setVerifying(true)
        setLoading(false)
      }

      setInitialCheckDone(true)
    }
    checkIfAlreadyCompleted()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Só buscar URL de onboarding após verificar que NÃO está completo e NÃO está em verificação
  useEffect(() => {
    if (!initialCheckDone || onboardingUrl || verifying) return
    const fetchUrl = async () => {
      const supabase = createClient()
      const result = await createStripeAccount(supabase)
      if ('completed' in result) {
        toast.success('Conta Stripe configurada com sucesso!')
        router.replace('/home')
        return
      }
      if ('verifying' in result) {
        setVerifying(true)
        setLoading(false)
        return
      }
      if ('error' in result) {
        toast.error(result.error)
        setLoading(false)
        return
      }
      setOnboardingUrl(result.url)
      setLoading(false)
    }
    fetchUrl()
  }, [initialCheckDone, onboardingUrl, verifying, router])

  const handleCheckStatus = async () => {
    setChecking(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Sessão expirada. Faça login novamente.')
        router.replace('/login')
        return
      }

      // Chamar a Edge Function para sincronizar status do Stripe
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/creator-payout-update-link`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        ).catch(() => null)

        // Se a conta Stripe não existe, redirecionar para criação
        if (res && !res.ok) {
          const body = await res.json().catch(() => ({}))
          if (body?.status === 'NOT_FOUND') {
            toast.info('Conta Stripe não encontrada. Criando agora...')
            const result = await createStripeAccount(supabase)
            if ('completed' in result) {
              toast.success('Conta Stripe configurada com sucesso!')
              router.replace('/home')
            } else if ('verifying' in result) {
              setVerifying(true)
            } else if ('url' in result) {
              setOnboardingUrl(result.url)
              setVerifying(false)
            } else {
              toast.error(result.error)
            }
            return
          }
        }
      }

      // Verificar status atualizado
      const { data: payoutInfo } = await supabase
        .from('creator_payout_info')
        .select('status')
        .eq('creator_id', user.id)
        .maybeSingle()

      if (payoutInfo?.status === 'COMPLETED') {
        toast.success('Conta Stripe configurada com sucesso!')
        router.replace('/home')
      } else if (payoutInfo?.status === 'VERIFYING') {
        setVerifying(true)
        toast.info('Sua conta está em verificação pelo Stripe. Isso pode levar alguns minutos. Tente novamente em breve.')
      } else {
        toast.info('Cadastro ainda não foi concluído no Stripe. Complete todos os passos e tente novamente.')
      }
    } catch {
      toast.error('Erro ao verificar status. Tente novamente.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="max-w-[480px] mx-auto p-6 text-center">
      <h1 className="text-[22px] font-semibold mb-2">
        Configurar pagamentos
      </h1>
      <p className="text-[var(--color-muted)] text-sm mb-8">
        Para receber pagamentos, você precisa completar o cadastro no Stripe.
      </p>

      {loading ? (
        <p className="text-[var(--color-muted)] text-sm">
          {t('common.loading')}
        </p>
      ) : verifying ? (
        <>
          <p className="text-[var(--color-muted)] text-sm mb-6">
            Seu cadastro foi enviado com sucesso! O Stripe está verificando suas informações.
            Isso pode levar alguns minutos.
          </p>

          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className={[
              'px-8 py-3.5 rounded-[10px] border-none bg-[var(--color-primary)] text-white font-semibold text-[15px] w-full',
              checking ? 'cursor-not-allowed opacity-60' : 'cursor-pointer opacity-100',
            ].join(' ')}
          >
            {checking ? 'Verificando...' : 'Verificar novamente'}
          </button>
        </>
      ) : onboardingUrl ? (
        <>
          <button
            type="button"
            onClick={() => window.open(onboardingUrl, '_blank')}
            className="px-8 py-3.5 rounded-[10px] border-none bg-[var(--color-primary)] text-white font-semibold text-[15px] w-full mb-3 cursor-pointer"
          >
            Abrir cadastro no Stripe
          </button>

          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className={[
              'px-8 py-3.5 rounded-[10px] border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] font-semibold text-[15px] w-full',
              checking ? 'cursor-not-allowed opacity-60' : 'cursor-pointer opacity-100',
            ].join(' ')}
          >
            {checking ? 'Verificando...' : 'Já completei o cadastro'}
          </button>
        </>
      ) : (
        <p className="text-[var(--color-error)] text-sm">
          Não foi possível obter o link de cadastro. Tente novamente mais tarde.
        </p>
      )}

      {/* Logout */}
      <button
        type="button"
        onClick={async () => {
          const supabase = createClient()
          await supabase.auth.signOut()
          router.replace('/login')
        }}
        className="mt-8 px-6 py-3 rounded-[10px] border border-[var(--color-error,#ef4444)] bg-transparent text-[var(--color-error,#ef4444)] font-semibold cursor-pointer text-[15px] w-full"
      >
        Sair da conta
      </button>
    </div>
  )
}

export default function StripeSetupPage() {
  return (
    <Suspense>
      <StripeSetupContent />
    </Suspense>
  )
}
