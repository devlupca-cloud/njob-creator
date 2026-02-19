'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import PinInput from '@/components/ui/PinInput'
import PageHeader from '@/components/ui/PageHeader'
import { verifyPasswordResetOtp, sendPasswordResetOtp } from '@/lib/supabase/auth'

const TIMER_SECONDS = 5 * 60 // 5 minutes

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function VerifyOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true)
      return
    }
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id)
          setCanResend(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timeLeft])

  const handleConfirm = async () => {
    if (pin.length < 6) return
    setLoading(true)
    setPinError(false)

    await verifyPasswordResetOtp(email, pin, {
      onSuccess: () => {
        router.push(`/reset-password/new?email=${encodeURIComponent(email)}`)
      },
      onInvalidOtp: () => {
        setPinError(true)
        toast.error('Código inválido. Tente novamente.')
        setLoading(false)
      },
      onExpiredOtp: () => {
        setPinError(true)
        toast.error('Código expirado. Solicite um novo.')
        setLoading(false)
      },
      onError: (msg) => {
        toast.error(msg)
        setLoading(false)
      },
    })
  }

  const handleResend = useCallback(async () => {
    await sendPasswordResetOtp(email, {
      onSuccess: () => {
        toast.success('Novo código enviado!')
        setTimeLeft(TIMER_SECONDS)
        setCanResend(false)
        setPin('')
        setPinError(false)
      },
      onError: (msg) => toast.error(msg),
    })
  }, [email])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Verificar código" />

      <div className="flex flex-col gap-1">
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Enviamos um código de 6 dígitos para
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
          {email}
        </p>
      </div>

      <div className="flex flex-col gap-4 py-4">
        <PinInput
          value={pin}
          onChange={(v) => { setPin(v); setPinError(false) }}
          error={pinError}
        />

        {!canResend ? (
          <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
            Solicite novo código em{' '}
            <span className="font-mono font-medium" style={{ color: 'var(--color-foreground)' }}>
              {pad(minutes)}:{pad(seconds)}
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-center text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
          >
            Enviar novamente
          </button>
        )}
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={pin.length < 6}
        onClick={handleConfirm}
      >
        Confirmar
      </Button>
    </div>
  )
}

export default function ResetPasswordVerifyPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--color-muted)' }} className="text-center py-8">Carregando...</div>}>
      <VerifyOtpContent />
    </Suspense>
  )
}
