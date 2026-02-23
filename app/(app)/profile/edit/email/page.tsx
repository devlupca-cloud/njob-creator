'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function AlterarEmailPage() {
  const router = useRouter()
  const { t } = useTranslation()

  const [currentEmail, setCurrentEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorCurrent, setErrorCurrent] = useState<string | undefined>()
  const [errorNew, setErrorNew] = useState<string | undefined>()

  const isDisabled = !currentEmail.trim() || !newEmail.trim()

  const handleConfirm = async () => {
    if (isDisabled) return

    setErrorCurrent(undefined)
    setErrorNew(undefined)

    if (!isValidEmail(currentEmail)) {
      setErrorCurrent(t('auth.invalidEmail'))
      return
    }
    if (!isValidEmail(newEmail)) {
      setErrorNew(t('auth.invalidEmail'))
      return
    }
    if (currentEmail === newEmail) {
      setErrorNew(t('profile.emailMustBeDifferent'))
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // Verify current session email matches what user typed
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error(t('profile.noSession'))

      if (session.user.email?.toLowerCase() !== currentEmail.toLowerCase()) {
        setErrorCurrent(t('profile.emailMismatch'))
        return
      }

      // Update email via Supabase Auth
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error

      toast.success(t('profile.emailConfirmSent'))
      router.back()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : t('profile.errorEditEmail')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
      <PageHeader title={t('profile.editEmail')} />

      <div className="flex-1 flex flex-col px-4 py-6">
        <div className="space-y-4">
          <Input
            label={t('profile.currentEmail')}
            type="email"
            value={currentEmail}
            onChange={(e) => {
              setCurrentEmail(e.target.value)
              setErrorCurrent(undefined)
            }}
            placeholder={t('profile.currentEmailPlaceholder')}
            error={errorCurrent}
            required
            autoFocus
            autoComplete="email"
          />

          <Input
            label={t('profile.newEmail')}
            type="email"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value)
              setErrorNew(undefined)
            }}
            placeholder={t('profile.newEmailPlaceholder')}
            error={errorNew}
            required
            autoComplete="email"
          />
        </div>

        <p className="mt-3 text-xs" style={{ color: 'var(--color-muted)' }}>
          {t('profile.emailConfirmNotice')}
        </p>

        <div className="flex-1" />

        <div className="pb-4">
          <Button
            fullWidth
            loading={loading}
            disabled={isDisabled}
            onClick={handleConfirm}
          >
            {t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
