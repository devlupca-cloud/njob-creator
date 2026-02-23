'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import PinInput from '@/components/ui/PinInput'
import PageHeader from '@/components/ui/PageHeader'
import { verifyPasswordResetOtp, sendPasswordResetOtp } from '@/lib/supabase/auth'
import { useTranslation } from '@/lib/i18n'

const TIMER_SECONDS = 5 * 60 // 5 minutes

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function VerifyOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
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
        toast.error(t('resetPassword.invalidCode'))
        setLoading(false)
      },
      onExpiredOtp: () => {
        setPinError(true)
        toast.error(t('resetPassword.expiredCode'))
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
        toast.success(t('resetPassword.newCodeSent'))
        setTimeLeft(TIMER_SECONDS)
        setCanResend(false)
        setPin('')
        setPinError(false)
      },
      onError: (msg) => toast.error(msg),
    })
  }, [email, t])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('resetPassword.verifyCode')} />

      <div className="flex flex-col gap-1">
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {t('resetPassword.codeSentTo')}
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
            {t('resetPassword.requestNewIn')}{' '}
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
            {t('resetPassword.resend')}
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
        {t('common.confirm')}
      </Button>
    </div>
  )
}

export default function ResetPasswordVerifyPage() {
  const { t } = useTranslation()
  return (
    <Suspense fallback={<div style={{ color: 'var(--color-muted)' }} className="text-center py-8">{t('common.loading')}</div>}>
      <VerifyOtpContent />
    </Suspense>
  )
}
