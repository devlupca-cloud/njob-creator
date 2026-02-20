'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import { signIn, signOut } from '@/lib/supabase/auth'
import { checkCreatorPayoutStatus, getCreatorInfo } from '@/lib/supabase/creator'
import { createClient } from '@/lib/supabase/client'
import { useAppStore, useLogin } from '@/lib/store/app-store'

function setGuestCookie() {
  document.cookie = 'njob-guest=true; path=/; max-age=86400'
}

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

export default function LoginPage() {
  const router = useRouter()
  const loginState = useLogin()
  const setLogin = useAppStore((s) => s.setLogin)
  const setCreator = useAppStore((s) => s.setCreator)

  const [email, setEmail] = useState(loginState.email || '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(loginState.remember || false)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const runAuthGate = async () => {
    // Limpa estado de convidado caso existisse
    document.cookie = 'njob-guest=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
    useAppStore.getState().setGuest(false)

    const supabase = createClient()
    await checkCreatorPayoutStatus(supabase, {
      isCreatorAndCompleted: async () => {
        const info = await getCreatorInfo(supabase)
        if (info) setCreator(info)
        router.push('/home')
      },
      isCreatorAndPending: (url) => {
        router.push(`/stripe-setup?url=${encodeURIComponent(url)}`)
      },
      isNotCreator: async () => {
        toast.error('Você não tem acesso a esta plataforma.')
        await signOut()
        setLoading(false)
      },
      onError: async (msg) => {
        toast.error(msg)
        await signOut()
        setLoading(false)
      },
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setPasswordError('')

    if (!email) { setEmailError('E-mail obrigatório'); return }
    if (!password) { setPasswordError('Senha obrigatória'); return }

    setLoading(true)

    if (remember) {
      setLogin({ email, remember: true })
    } else {
      setLogin({ email: '', remember: false })
    }

    await signIn(email, password, {
      onSuccess: runAuthGate,
      onWrongPassword: () => {
        setPasswordError('Senha incorreta')
        setLoading(false)
      },
      onUserNotFound: () => {
        setEmailError('E-mail não encontrado')
        setLoading(false)
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

  const handleGuestLogin = () => {
    setGuestCookie()
    useAppStore.getState().setGuest(true)
    router.push('/home')
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Logo / Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/njob-logo.png"
            alt="NJob"
            width={160}
            height={64}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Bem-vindo de volta
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Faça login na sua conta
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
          error={emailError}
          iconLeft={<UserIcon />}
          autoComplete="email"
          required
        />

        <div className="flex flex-col gap-1">
          <PasswordInput
            label="Senha"
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordError('') }}
            error={passwordError}
            autoComplete="current-password"
          />
          <div className="flex justify-end">
            <Link
              href={`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-primary)' }}
            >
              Esqueci a senha
            </Link>
          </div>
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Lembrar de mim
          </span>
        </label>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!email || !password}
          className="mt-2"
        >
          Entrar
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>ou</span>
        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
      </div>

      {/* Secondary actions */}
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          fullWidth
          onClick={handleGuestLogin}
          disabled={loading}
        >
          Entrar como convidado
        </Button>

        <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
          Não tem conta?{' '}
          <Link
            href="/register"
            className="font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
          >
            Cadastro
          </Link>
        </p>
      </div>
    </div>
  )
}
