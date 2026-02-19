'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAppStore, useCreator } from '@/lib/store/app-store'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function AlterarNomePage() {
  const router = useRouter()
  const creator = useCreator()
  const setCreator = useAppStore((s) => s.setCreator)

  const [name, setName] = useState(creator?.profile.full_name ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const isDisabled = !name.trim() || name.trim() === (creator?.profile.full_name ?? '')

  const handleConfirm = async () => {
    if (!creator || isDisabled) return
    const trimmed = name.trim()

    if (trimmed.length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres')
      return
    }

    setError(undefined)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sem sessão')

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: trimmed })
        .eq('id', session.user.id)

      if (updateError) throw updateError

      setCreator({
        ...creator,
        profile: { ...creator.profile, full_name: trimmed },
      })

      toast.success('Nome alterado com sucesso')
      router.back()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao alterar nome. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
      <PageHeader title="Alterar nome" />

      <div className="flex-1 flex flex-col px-4 py-6">
        <div className="space-y-1">
          <Input
            label="Nome"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(undefined)
            }}
            placeholder="Nome completo"
            error={error}
            required
            autoFocus
          />
        </div>

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
