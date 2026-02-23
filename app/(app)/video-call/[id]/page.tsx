'use client'

import { useEffect, useRef, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import { useTranslation } from '@/lib/i18n'

type Status = 'loading' | 'error' | 'too-early' | 'joined'

export default function VideoCallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const creator = useCreator()

  const { t } = useTranslation()

  const containerRef = useRef<HTMLDivElement>(null)
  const zegoRef = useRef<unknown>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [earlyTime, setEarlyTime] = useState('')

  useEffect(() => {
    if (!creator || !id || !containerRef.current) return

    let cancelled = false

    async function initCall() {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) {
        setStatus('error')
        return
      }

      // Busca dados da chamada
      const { data: call } = await supabase
        .from('one_on_one_calls')
        .select('id, creator_id, scheduled_start_time, scheduled_duration_minutes')
        .eq('id', id)
        .single()

      if (!call || call.creator_id !== userId) {
        setStatus('error')
        return
      }

      // Validação de janela de tempo: permitir 5 min antes
      const startTime = new Date(call.scheduled_start_time).getTime()
      const now = Date.now()
      const fiveMinBefore = startTime - 5 * 60 * 1000
      const durationMs = (call.scheduled_duration_minutes ?? 60) * 60 * 1000
      const endTime = startTime + durationMs

      if (now < fiveMinBefore) {
        const startDate = new Date(call.scheduled_start_time)
        setEarlyTime(startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        setStatus('too-early')
        return
      }

      if (now > endTime) {
        setStatus('error')
        return
      }

      if (cancelled) return

      // Import dinâmico para evitar SSR
      const { generateKitToken, ZegoUIKitPrebuilt } = await import('@/lib/zegocloud')

      const userName = creator!.profile.full_name || 'Creator'
      const kitToken = generateKitToken(id, userId, userName)

      const zp = ZegoUIKitPrebuilt.create(kitToken)
      zegoRef.current = zp

      zp.joinRoom({
        container: containerRef.current!,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
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

      setStatus('joined')
    }

    initCall().catch(() => {
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
      {/* Too early overlay */}
      {status === 'too-early' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--color-background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
            {t('videoCall.tooEarly', { time: earlyTime })}
          </p>
          <button onClick={() => router.push('/home')} style={{ padding: '8px 24px', borderRadius: 12, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {t('common.back')}
          </button>
        </div>
      )}

      {/* Error overlay */}
      {status === 'error' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--color-background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{t('videoCall.errorLoad')}</p>
          <button onClick={() => router.push('/home')} style={{ padding: '8px 24px', borderRadius: 12, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {t('common.back')}
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {status === 'loading' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--color-background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(101,22,147,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#651693" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{t('videoCall.connecting')}</p>
        </div>
      )}

      {/* Container persistente do ZegoCloud */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#000' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </>
  )
}
