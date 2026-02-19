'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  options: SelectOption[]
  error?: string
  placeholder?: string
  required?: boolean
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, error, placeholder, required, id, className = '', ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
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

        <select
          ref={ref}
          id={selectId}
          className={[
            'w-full rounded-lg px-3 py-2.5 text-sm transition-colors outline-none appearance-none',
            'focus:ring-2 focus:ring-primary/40',
            error ? 'border-error/60 focus:ring-error/30' : 'focus:border-primary/60',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-foreground)',
            border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239a9a9a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            paddingRight: '2.5rem',
          }}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}
              style={{ background: 'var(--color-surface)', color: 'var(--color-foreground)' }}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-xs" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        )}
      </div>
    )
  }
)

SelectField.displayName = 'SelectField'

export default SelectField
