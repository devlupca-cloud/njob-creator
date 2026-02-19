'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import PasswordInput from '@/components/ui/PasswordInput'
import PageHeader from '@/components/ui/PageHeader'
import { updatePassword, signOut } from '@/lib/supabase/auth'

function NewPasswordContent() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setNewPasswordError('')
    setConfirmError('')

    if (!newPassword) {
      setNewPasswordError('Nova senha obrigatória')
      return
    }
    if (newPassword.length < 6) {
      setNewPasswordError('Mínimo de 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setConfirmError('As senhas não coincidem')
      return
    }

    setLoading(true)

    await updatePassword(newPassword, {
      onSuccess: async () => {
        toast.success('Senha alterada com sucesso!')
        await signOut()
        router.push('/login')
      },
      onError: (msg) => {
        toast.error(msg)
        setLoading(false)
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nova senha" />

      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        Crie uma nova senha para sua conta.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordInput
          label="Nova senha"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setNewPasswordError('') }}
          error={newPasswordError}
          autoComplete="new-password"
          required
        />

        <PasswordInput
          label="Confirmar senha"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError('') }}
          error={confirmError}
          autoComplete="new-password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!newPassword || !confirmPassword}
          className="mt-2"
        >
          Confirmar
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordNewPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--color-muted)' }} className="text-center py-8">Carregando...</div>}>
      <NewPasswordContent />
    </Suspense>
  )
}
