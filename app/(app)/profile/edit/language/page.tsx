'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store/app-store'
import { useTranslation } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'

// ─── Supported languages ──────────────────────────────────────────────────────

interface Language {
  code: Locale
  /** Native name — always shown in the language's own script, regardless of current locale */
  nativeLabel: string
  /** Translated name in the current UI locale (shown as subtitle when different) */
  translatedKey: 'profile.languagePt' | 'profile.languageEn' | 'profile.languageEs'
}

const LANGUAGES: Language[] = [
  { code: 'pt', nativeLabel: 'Português (Brasil)', translatedKey: 'profile.languagePt' },
  { code: 'en', nativeLabel: 'English',            translatedKey: 'profile.languageEn' },
  { code: 'es', nativeLabel: 'Español',            translatedKey: 'profile.languageEs' },
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
  const { t, locale } = useTranslation()
  const setLocale = useAppStore((s) => s.setLocale)

  const handleSelect = (code: Locale) => {
    setLocale(code)
    toast.success(t('profile.languageSaved'))
    router.back()
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
      <PageHeader title={t('profile.language')} />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
          {t('profile.selectLanguage')}
        </p>

        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {LANGUAGES.map((lang, index) => {
            const translatedLabel = t(lang.translatedKey)
            const showSubtitle = translatedLabel !== lang.nativeLabel
            return (
              <div key={lang.code}>
                {index > 0 && (
                  <div style={{ height: '1px', background: 'var(--color-border)' }} />
                )}
                <button
                  className="w-full flex items-center justify-between px-4 py-4 transition-colors hover:bg-surface-2"
                  onClick={() => handleSelect(lang.code)}
                  aria-label={lang.nativeLabel}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {lang.nativeLabel}
                    </p>
                    {showSubtitle && (
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {translatedLabel}
                      </p>
                    )}
                  </div>
                  {locale === lang.code && (
                    <span style={{ color: 'var(--color-primary)' }}>
                      <CheckIcon />
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
