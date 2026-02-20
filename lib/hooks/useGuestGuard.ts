'use client'

import { useState, useCallback } from 'react'
import { useIsGuest } from '@/lib/store/app-store'

/**
 * Hook para proteger ações de convidados.
 *
 * Retorna:
 * - `isGuest`: se o usuário é convidado
 * - `showGuestModal`: controla visibilidade do GuestAuthModal
 * - `setShowGuestModal`: setter direto
 * - `requireAuth`: função guard — retorna true se pode prosseguir, false se é guest (e abre modal)
 *
 * Uso:
 * ```tsx
 * const { requireAuth, showGuestModal, setShowGuestModal } = useGuestGuard()
 *
 * function handleBuyTicket() {
 *   if (!requireAuth()) return
 *   // ... lógica de compra
 * }
 *
 * return (
 *   <>
 *     <button onClick={handleBuyTicket}>Comprar</button>
 *     <GuestAuthModal
 *       open={showGuestModal}
 *       onClose={() => setShowGuestModal(false)}
 *       message="Você precisa de uma conta para comprar ingressos."
 *     />
 *   </>
 * )
 * ```
 */
export function useGuestGuard() {
  const isGuest = useIsGuest()
  const [showGuestModal, setShowGuestModal] = useState(false)

  const requireAuth = useCallback(() => {
    if (isGuest) {
      setShowGuestModal(true)
      return false
    }
    return true
  }, [isGuest])

  return { isGuest, showGuestModal, setShowGuestModal, requireAuth }
}
