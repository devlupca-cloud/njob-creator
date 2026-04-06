'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/ui/PageHeader'
import { sendPasswordResetEmail } from '@/lib/supabase/auth'
import { useTranslation } from '@/lib/i18n'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setEmailError('')

    if (!email) {
      setEmailError(t('auth.emailRequired'))
      return
    }

    setLoading(true)

    await sendPasswordResetEmail(email, {
      onSuccess: () => {
        setSent(true)
        toast.success(t('resetPassword.linkSent'))
        setLoading(false)
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

      <p className="text-sm text-[var(--color-muted)]">
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

        {sent && (
          <div className="rounded-xl px-4 py-3 text-sm bg-green-500/10 border border-green-500/30 text-green-400">
            {t('resetPassword.linkSent')}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!email || sent}
          className="mt-2"
        >
          {t('resetPassword.recoverAccess')}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted)]">
        {t('resetPassword.rememberPassword')}{' '}
        <Link
          href="/login"
          className="font-medium transition-opacity hover:opacity-70 text-[var(--color-primary)]"
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
    <Suspense fallback={<div className="text-center py-8 text-[var(--color-muted)]">{t('common.loading')}</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
