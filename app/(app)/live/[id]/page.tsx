'use client'

import { useEffect, useRef, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import { useTranslation } from '@/lib/i18n'

type Status = 'loading' | 'error' | 'not-owner' | 'joined'

/** Mapa de traduções dos textos do ZegoCloud UIKit por idioma */
const ZEGO_TRANSLATIONS: Record<string, Record<string, string>> = {
  pt: {
    'Go Live': 'Iniciar Live',
    'End': 'Encerrar',
    'Leave': 'Sair',
    'Leave Room': 'Sair da Sala',
    'Cancel': 'Cancelar',
    'OK': 'OK',
    'Settings': 'Configurações',
    'Camera': 'Câmera',
    'Microphone': 'Microfone',
    'The host has left the room': 'O apresentador saiu da sala',
    'You are the host': 'Você é o apresentador',
    'No one else is here': 'Ninguém mais está aqui',
  },
  es: {
    'Go Live': 'Iniciar Live',
    'End': 'Finalizar',
    'Leave': 'Salir',
    'Leave Room': 'Salir de la Sala',
    'Cancel': 'Cancelar',
    'OK': 'OK',
    'Settings': 'Configuración',
    'Camera': 'Cámara',
    'Microphone': 'Micrófono',
    'The host has left the room': 'El presentador ha salido de la sala',
    'You are the host': 'Eres el presentador',
    'No one else is here': 'No hay nadie más aquí',
  },
}

export default function LiveHostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const creator = useCreator()

  const { t, locale } = useTranslation()

  const containerRef = useRef<HTMLDivElement>(null)
  const zegoRef = useRef<unknown>(null)
  const [status, setStatus] = useState<Status>('loading')

  // Traduz textos do ZegoCloud UIKit (SDK só suporta en/zh)
  useEffect(() => {
    if (!containerRef.current || locale === 'en') return
    const dict = ZEGO_TRANSLATIONS[locale]
    if (!dict) return

    const translateNode = () => {
      const els = containerRef.current?.querySelectorAll('button, [role="button"], div, span, p')
      els?.forEach((el) => {
        // Só traduz nós-folha (sem filhos com texto)
        if (el.children.length > 0) return
        const text = el.textContent?.trim()
        if (text && dict[text]) {
          el.textContent = dict[text]
        }
      })
    }

    const observer = new MutationObserver(translateNode)
    observer.observe(containerRef.current, { childList: true, subtree: true, characterData: true })

    // Traduz o que já estiver renderizado
    translateNode()

    return () => observer.disconnect()
  }, [locale])

  useEffect(() => {
    if (!creator || !id || !containerRef.current) return

    let cancelled = false

    async function initLive() {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) {
        setStatus('error')
        return
      }

      // Valida que o creator é dono do evento
      const { data: live } = await supabase
        .from('live_streams')
        .select('id, creator_id')
        .eq('id', id)
        .single()

      if (!live || live.creator_id !== userId) {
        setStatus('not-owner')
        return
      }

      if (cancelled) return

      // Import dinâmico para evitar SSR
      const { generateKitToken, ZegoUIKitPrebuilt } = await import('@/lib/zegocloud')

      const userName = creator!.profile.full_name || 'Host'
      console.log('[LIVE] Generating kit token for room:', id, 'user:', userId)
      const kitToken = generateKitToken(id, userId, userName)
      console.log('[LIVE] Kit token generated, length:', kitToken.length)

      console.log('[LIVE] Creating ZegoUIKitPrebuilt instance...')
      const zp = ZegoUIKitPrebuilt.create(kitToken)
      zegoRef.current = zp
      console.log('[LIVE] Instance created, joining room...')

      zp.joinRoom({
        container: containerRef.current!,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Host,
          },
        },
        showPreJoinView: false,
        showLeavingView: false,
        showRoomTimer: true,
        turnOnCameraWhenJoining: true,
        turnOnMicrophoneWhenJoining: true,
        onLeaveRoom: () => {
          router.push('/home')
        },
      })

      console.log('[LIVE] joinRoom called successfully')
      setStatus('joined')
    }

    initLive().catch((err) => {
      console.error('[LIVE] initLive error:', err)
      if (!cancelled) setStatus('error')
    })

    return () => {
      cancelled = true
      if (zegoRef.current) {
        (zegoRef.current as { destroy: () => void }).destroy()
        zegoRef.current = null
      }
    }
  }, [creator, id, supabase, router])

  return (
    <>
      {/* Error / not-owner overlay */}
      {(status === 'error' || status === 'not-owner') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--color-background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>
            {status === 'not-owner' ? t('live.notOwner') : t('live.errorLoad')}
          </p>
          <button
            onClick={() => router.push('/home')}
            style={{
              padding: '8px 24px',
              borderRadius: 12,
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {t('common.back')}
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {status === 'loading' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--color-background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="2" />
              <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
            </svg>
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{t('live.connecting')}</p>
        </div>
      )}

      {/* Container persistente do ZegoCloud — nunca é desmontado */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#000' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </>
  )
}
