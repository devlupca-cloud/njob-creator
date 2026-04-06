'use client'

import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const TIP_KEYS: TranslationKey[] = [
  'photoTips.tip1',
  'photoTips.tip2',
  'photoTips.tip3',
  'photoTips.tip4',
  'photoTips.tip5',
]

interface DicasFotosModalProps {
  onClose: () => void
}

export default function DicasFotosModal({ onClose }: DicasFotosModalProps) {
  const { t } = useTranslation()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dicas-fotos-title"
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-surface)] rounded-xl p-6 max-w-[360px] w-full border border-[var(--color-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="dicas-fotos-title" className="text-base font-semibold text-[var(--color-foreground)]">
            {t('photoTips.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="bg-transparent border-none cursor-pointer p-1 text-[var(--color-muted)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="space-y-2">
          {TIP_KEYS.map((key, i) => (
            <li key={i} className="text-sm flex gap-2 text-[var(--color-foreground)]">
              <span className="text-[var(--color-primary)]">•</span>
              {t(key)}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white"
          >
            {t('common.understood')}
          </button>
        </div>
      </div>
    </div>
  )
}
