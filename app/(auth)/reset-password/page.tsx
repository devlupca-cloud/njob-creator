'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/ui/PageHeader'
import { sendPasswordResetOtp } from '@/lib/supabase/auth'
import { useTranslation } from '@/lib/i18n'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setEmailError('')

    if (!email) {
      setEmailError(t('auth.emailRequired'))
      return
    }

    setLoading(true)

    await sendPasswordResetOtp(email, {
      onSuccess: () => {
        toast.success(t('resetPassword.emailSent'))
        router.push(`/reset-password/verify?email=${encodeURIComponent(email)}`)
      },
      onInvalidEmail: () => {
        setEmailError(t('auth.invalidEmail'))
        setLoading(false)
      },
      onError: (msg) => {
        toast.error(msg)
        setLoading(false)
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('resetPassword.title')} />

      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        {t('resetPassword.subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t('auth.email')}
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
          error={emailError}
          autoComplete="email"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!email}
          className="mt-2"
        >
          {t('resetPassword.recoverAccess')}
        </Button>
      </form>

      <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
        {t('resetPassword.rememberPassword')}{' '}
        <Link
          href="/login"
          className="font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('auth.doLogin')}
        </Link>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  return (
    <Suspense fallback={<div style={{ color: 'var(--color-muted)' }} className="text-center py-8">{t('common.loading')}</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
