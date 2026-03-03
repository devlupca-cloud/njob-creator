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
        ).catch(() => {})
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
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/creator-payout-update-link`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        ).catch(() => {})
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
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
        Configurar pagamentos
      </h1>
      <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 32 }}>
        Para receber pagamentos, você precisa completar o cadastro no Stripe.
      </p>

      {loading ? (
        <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>
          {t('common.loading')}
        </p>
      ) : verifying ? (
        <>
          <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 24 }}>
            Seu cadastro foi enviado com sucesso! O Stripe está verificando suas informações.
            Isso pode levar alguns minutos.
          </p>

          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            style={{
              padding: '14px 32px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: checking ? 'not-allowed' : 'pointer',
              fontSize: 15,
              width: '100%',
              opacity: checking ? 0.6 : 1,
            }}
          >
            {checking ? 'Verificando...' : 'Verificar novamente'}
          </button>
        </>
      ) : onboardingUrl ? (
        <>
          <button
            type="button"
            onClick={() => window.open(onboardingUrl, '_blank')}
            style={{
              padding: '14px 32px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 15,
              width: '100%',
              marginBottom: 12,
            }}
          >
            Abrir cadastro no Stripe
          </button>

          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            style={{
              padding: '14px 32px',
              borderRadius: 10,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-foreground)',
              fontWeight: 600,
              cursor: checking ? 'not-allowed' : 'pointer',
              fontSize: 15,
              width: '100%',
              opacity: checking ? 0.6 : 1,
            }}
          >
            {checking ? 'Verificando...' : 'Já completei o cadastro'}
          </button>
        </>
      ) : (
        <p style={{ color: 'var(--color-error)', fontSize: 14 }}>
          Não foi possível obter o link de cadastro. Tente novamente mais tarde.
        </p>
      )}

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
