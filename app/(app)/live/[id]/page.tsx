'use client'

import { useEffect, useRef, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import { useTranslation } from '@/lib/i18n'

type Status = 'loading' | 'error' | 'not-owner' | 'joined'

export default function LiveHostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const creator = useCreator()

  const { t } = useTranslation()

  const containerRef = useRef<HTMLDivElement>(null)
  const zegoRef = useRef<unknown>(null)
  const [status, setStatus] = useState<Status>('loading')

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
