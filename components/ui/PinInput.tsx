'use client'

import { useRef, KeyboardEvent, ClipboardEvent } from 'react'

interface PinInputProps {
  value: string
  onChange: (v: string) => void
  error?: boolean
  length?: number
}

export default function PinInput({
  value,
  onChange,
  error = false,
  length = 6,
}: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const digits = value.padEnd(length, '').split('').slice(0, length)

  const focusNext = (index: number) => {
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const focusPrev = (index: number) => {
    if (index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    onChange(newDigits.join(''))
    if (digit) focusNext(index)
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits]
        newDigits[index] = ''
        onChange(newDigits.join(''))
      } else {
        focusPrev(index)
      }
    } else if (e.key === 'ArrowLeft') {
      focusPrev(index)
    } else if (e.key === 'ArrowRight') {
      focusNext(index)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted.padEnd(value.length > pasted.length ? value.length : pasted.length, '').slice(0, length))
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, length - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="w-12 h-14 text-center text-xl font-semibold rounded-xl outline-none transition-all focus:ring-2"
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-foreground)',
            border: `2px solid ${error ? 'var(--color-error)' : digits[i] ? 'var(--color-primary)' : 'var(--color-border)'}`,
            boxShadow: digits[i] ? '0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent)' : undefined,
          }}
          aria-label={`Dígito ${i + 1}`}
        />
      ))}
    </div>
  )
}
