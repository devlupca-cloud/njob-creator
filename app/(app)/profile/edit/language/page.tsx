'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import PageHeader from '@/components/ui/PageHeader'

// ─── Supported languages ──────────────────────────────────────────────────────

interface Language {
  code: string
  label: string
  nativeLabel: string
}

const LANGUAGES: Language[] = [
  { code: 'pt', label: 'Português', nativeLabel: 'Português (Brasil)' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Espanhol', nativeLabel: 'Español' },
]

// ─── Check icon ──────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m20 6-11 11-5-5" />
  </svg>
)

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AlterarIdiomaPage() {
  const router = useRouter()

  /**
   * Flutter: uses FFLocalizations.languageCode
   * Web: no global i18n library in use — defaulting to 'pt'.
   * In production this should integrate with next-intl or i18next.
   */
  const [selectedCode, setSelectedCode] = useState<string>('pt')

  const handleSelect = (code: string) => {
    setSelectedCode(code)
    // Persist language preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('njob_language', code)
    }
    toast.success(`Idioma alterado para ${LANGUAGES.find((l) => l.code === code)?.nativeLabel}`)
    router.back()
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
      <PageHeader title="Alterar idioma" />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
          Selecione o idioma de preferência da plataforma.
        </p>

        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {LANGUAGES.map((lang, index) => (
            <div key={lang.code}>
              {index > 0 && (
                <div style={{ height: '1px', background: 'var(--color-border)' }} />
              )}
              <button
                className="w-full flex items-center justify-between px-4 py-4 transition-colors hover:bg-surface-2"
                onClick={() => handleSelect(lang.code)}
                aria-label={`Selecionar ${lang.nativeLabel}`}
              >
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {lang.nativeLabel}
                  </p>
                  {lang.label !== lang.nativeLabel && (
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {lang.label}
                    </p>
                  )}
                </div>
                {selectedCode === lang.code && (
                  <span style={{ color: 'var(--color-primary)' }}>
                    <CheckIcon />
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
