'use client'

import { useState, useEffect } from 'react'

interface ToggleOnlineProps {
  /** Valor inicial quando não controlado */
  initialValue?: boolean
  /** Em modo controlado, usa value; caso contrário usa estado interno */
  value?: boolean
  onChange?: (value: boolean) => void
  /** Se true, desabilita o botão (ex.: durante save) */
  disabled?: boolean
}

/**
 * ToggleOnline
 * Replica do ToggleWidget Flutter — switch animado Online/Offline.
 * - Fundo primário quando ON, cinza quando OFF
 * - Suporta modo controlado (value + onChange) para persistir no backend
 */
export default function ToggleOnline({ initialValue = true, value, onChange, disabled = false }: ToggleOnlineProps) {
  const [internal, setInternal] = useState(initialValue)
  const isControlled = value !== undefined
  const isOnline = isControlled ? value : internal

  useEffect(() => {
    if (!isControlled) setInternal(initialValue)
  }, [isControlled, initialValue])

  const handleToggle = () => {
    if (disabled) return
    const next = !isOnline
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOnline}
      aria-label={isOnline ? 'Online' : 'Offline'}
      onClick={handleToggle}
      disabled={disabled}
      className="relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        width: 40,
        height: 20,
        borderRadius: 20,
        background: isOnline ? 'var(--color-primary)' : '#3a3a3a',
        transition: 'background 200ms ease-in-out',
        flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {/* Thumb */}
      <span
        style={{
          position: 'absolute',
          top: 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#ffffff',
          left: isOnline ? 'calc(100% - 18px)' : 2,
          transition: 'left 200ms ease-in-out',
        }}
      />
    </button>
  )
}
