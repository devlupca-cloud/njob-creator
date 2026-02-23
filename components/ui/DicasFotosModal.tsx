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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 360,
          width: '100%',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="dicas-fotos-title" className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
            {t('photoTips.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-muted)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="space-y-2">
          {TIP_KEYS.map((key, i) => (
            <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--color-foreground)' }}>
              <span style={{ color: 'var(--color-primary)' }}>•</span>
              {t(key)}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            {t('common.understood')}
          </button>
        </div>
      </div>
    </div>
  )
}
