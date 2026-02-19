'use client'

import { InputHTMLAttributes, ReactNode, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      required,
      iconLeft,
      iconRight,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium"
            style={{ color: 'var(--color-foreground)' }}
          >
            {label}
            {required && (
              <span className="ml-1" style={{ color: 'var(--color-primary)' }}>
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {iconLeft && (
            <span
              className="absolute left-3 flex items-center"
              style={{ color: 'var(--color-muted)' }}
            >
              {iconLeft}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full rounded-lg px-3 py-2.5 text-sm transition-colors outline-none',
              'placeholder:text-muted',
              'focus:ring-2 focus:ring-primary/40',
              iconLeft ? 'pl-10' : '',
              iconRight ? 'pr-10' : '',
              error
                ? 'border-error/60 focus:ring-error/30'
                : 'focus:border-primary/60',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-foreground)',
              border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
            }}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />

          {iconRight && (
            <span
              className="absolute right-3 flex items-center"
              style={{ color: 'var(--color-muted)' }}
            >
              {iconRight}
            </span>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs"
            style={{ color: 'var(--color-error)' }}
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="text-xs"
            style={{ color: 'var(--color-muted)' }}
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
