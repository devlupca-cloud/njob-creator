'use client'

import { useEffect, useRef } from 'react'

const IDLE_EVENTS = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll']

/**
 * Chama `onIdle` depois de `timeoutMs` sem nenhuma interação na aba.
 * Só conta quando a aba está visível (document.visibilityState==='visible')
 * — evita falsos positivos de creator com várias abas abertas.
 */
export function useIdleTimeout(
  timeoutMs: number,
  enabled: boolean,
  onIdle: () => void,
) {
  const onIdleRef = useRef(onIdle)
  onIdleRef.current = onIdle

  useEffect(() => {
    if (!enabled) return

    let timer: ReturnType<typeof setTimeout> | null = null

    const fire = () => {
      onIdleRef.current()
    }

    const reset = () => {
      if (timer) clearTimeout(timer)
      if (document.visibilityState !== 'visible') return
      timer = setTimeout(fire, timeoutMs)
    }

    for (const ev of IDLE_EVENTS) {
      window.addEventListener(ev, reset, { passive: true })
    }
    document.addEventListener('visibilitychange', reset)

    reset()

    return () => {
      if (timer) clearTimeout(timer)
      for (const ev of IDLE_EVENTS) window.removeEventListener(ev, reset)
      document.removeEventListener('visibilitychange', reset)
    }
  }, [enabled, timeoutMs])
}
