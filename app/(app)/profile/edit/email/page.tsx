'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function AlterarEmailPage() {
  const router = useRouter()

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
      setErrorCurrent('E-mail inválido')
      return
    }
    if (!isValidEmail(newEmail)) {
      setErrorNew('E-mail inválido')
      return
    }
    if (currentEmail === newEmail) {
      setErrorNew('O novo e-mail deve ser diferente do atual')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // Verify current session email matches what user typed
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sem sessão')

      if (session.user.email?.toLowerCase() !== currentEmail.toLowerCase()) {
        setErrorCurrent('E-mail não corresponde ao e-mail atual da conta')
        return
      }

      // Update email via Supabase Auth
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error

      toast.success('E-mail de confirmação enviado. Verifique sua caixa de entrada.')
      router.back()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Erro ao alterar e-mail'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
      <PageHeader title="Alterar e-mail" />

      <div className="flex-1 flex flex-col px-4 py-6">
        <div className="space-y-4">
          <Input
            label="E-mail atual"
            type="email"
            value={currentEmail}
            onChange={(e) => {
              setCurrentEmail(e.target.value)
              setErrorCurrent(undefined)
            }}
            placeholder="Insira seu atual endereço de e-mail"
            error={errorCurrent}
            required
            autoFocus
            autoComplete="email"
          />

          <Input
            label="Novo e-mail"
            type="email"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value)
              setErrorNew(undefined)
            }}
            placeholder="Insira seu novo endereço de e-mail"
            error={errorNew}
            required
            autoComplete="email"
          />
        </div>

        <p className="mt-3 text-xs" style={{ color: 'var(--color-muted)' }}>
          Você receberá um e-mail de confirmação no novo endereço.
        </p>

        <div className="flex-1" />

        <div className="pb-4">
          <Button
            fullWidth
            loading={loading}
            disabled={isDisabled}
            onClick={handleConfirm}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  )
}
