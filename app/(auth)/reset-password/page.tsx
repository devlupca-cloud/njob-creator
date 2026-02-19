'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/ui/PageHeader'
import { sendPasswordResetOtp } from '@/lib/supabase/auth'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setEmailError('')

    if (!email) {
      setEmailError('E-mail obrigatório')
      return
    }

    setLoading(true)

    await sendPasswordResetOtp(email, {
      onSuccess: () => {
        toast.success('E-mail enviado! Verifique sua caixa de entrada.')
        router.push(`/reset-password/verify?email=${encodeURIComponent(email)}`)
      },
      onInvalidEmail: () => {
        setEmailError('E-mail inválido')
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
      <PageHeader title="Recuperar senha" />

      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        Digite seu e-mail para receber um código de verificação.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
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
          Recuperar acesso
        </Button>
      </form>

      <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
        Lembrou a senha?{' '}
        <Link
          href="/login"
          className="font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-primary)' }}
        >
          Fazer login
        </Link>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--color-muted)' }} className="text-center py-8">Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
