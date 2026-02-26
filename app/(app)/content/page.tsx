'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCreator } from '@/lib/store/app-store'
import { useTranslation } from '@/lib/i18n'
import { getPacksByCreator, type PackListItem } from '@/lib/api/content'
import EmptyState from '@/components/ui/EmptyState'

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

interface AppliedFilters {
  hasPhoto: boolean | null
  hasVideo: boolean | null
  startDate: string
  endDate: string
}

const emptyFilters: AppliedFilters = { hasPhoto: null, hasVideo: null, startDate: '', endDate: '' }

function countActive(f: AppliedFilters): number {
  let n = 0
  if (f.hasPhoto === true) n++
  if (f.hasVideo === true) n++
  if (f.startDate) n++
  if (f.endDate) n++
  return n
}

export default function ContentPage() {
  const supabase = createClient()
  const creator = useCreator()
  const router = useRouter()
  const { t } = useTranslation()

  // Filtros aplicados (usados para filtrar a lista)
  const [applied, setApplied] = useState<AppliedFilters>(emptyFilters)

  // Filtros temporários (estado do modal enquanto o usuário seleciona)
  const [draft, setDraft] = useState<AppliedFilters>(emptyFilters)
  const [filterModalOpen, setFilterModalOpen] = useState(false)

  const { data: packs = [], isLoading } = useQuery({
    queryKey: [
      'get_packs_by_creator',
      creator?.profile?.username,
      applied.hasPhoto,
      applied.hasVideo,
      applied.startDate,
      applied.endDate,
    ],
    enabled: !!creator,
    retry: 1,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) return []
      return getPacksByCreator(user.id, token, {
        has_photo: applied.hasPhoto ?? undefined,
        has_video: applied.hasVideo ?? undefined,
        start_date: applied.startDate || undefined,
        end_date: applied.endDate || undefined,
      })
    },
  })

  const activeCount = countActive(applied)
  const hasActiveFilters = activeCount > 0

  // Abrir modal: copiar filtros aplicados para o draft
  const openFilterModal = () => {
    setDraft({ ...applied })
    setFilterModalOpen(true)
  }

  // Aplicar: copiar draft para applied e fechar
  const applyAndClose = () => {
    setApplied({ ...draft })
    setFilterModalOpen(false)
  }

  // Limpar: resetar draft e applied, fechar modal
  const clearFilters = () => {
    setDraft(emptyFilters)
    setApplied(emptyFilters)
    setFilterModalOpen(false)
  }

  // Limpar tudo (dentro do modal, sem fechar)
  const clearDraft = () => {
    setDraft(emptyFilters)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 80 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{t('content.salesTitle')}</h1>
        <button
          type="button"
          onClick={openFilterModal}
          style={{
            minHeight: 44,
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--color-foreground)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FilterIcon />
          <span>{t('content.filters')}</span>
          {hasActiveFilters && (
            <span
              style={{
                minWidth: 20,
                height: 20,
                padding: '0 6px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>
      {filterModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('content.contentFilters')}
          className="content-filters-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            padding: 24,
          }}
          onClick={() => setFilterModalOpen(false)}
        >
          <div
            className="content-filters-panel"
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{t('content.filters')}</h3>
              {countActive(draft) > 0 && (
                <button
                  type="button"
                  onClick={clearDraft}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-muted)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {t('content.clearAll')}
                </button>
              )}
            </div>

            <section style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('content.mediaType')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, hasPhoto: d.hasPhoto === true ? null : true }))}
                  style={{
                    minHeight: 44,
                    padding: '0 16px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)',
                    background: draft.hasPhoto === true ? 'var(--color-primary)' : 'var(--color-surface-2)',
                    color: draft.hasPhoto === true ? '#fff' : 'var(--color-foreground)',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {t('content.withPhoto')}
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, hasVideo: d.hasVideo === true ? null : true }))}
                  style={{
                    minHeight: 44,
                    padding: '0 16px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)',
                    background: draft.hasVideo === true ? 'var(--color-primary)' : 'var(--color-surface-2)',
                    color: draft.hasVideo === true ? '#fff' : 'var(--color-foreground)',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {t('content.withVideo')}
                </button>
              </div>
            </section>

            <section style={{ marginBottom: 24 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('financial.period')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-foreground)' }}>{t('content.from')}</span>
                  <input
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                    style={{
                      minHeight: 44,
                      padding: '0 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface-2)',
                      color: 'var(--color-foreground)',
                      fontSize: 14,
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-foreground)' }}>{t('content.until')}</span>
                  <input
                    type="date"
                    value={draft.endDate}
                    onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                    style={{
                      minHeight: 44,
                      padding: '0 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface-2)',
                      color: 'var(--color-foreground)',
                      fontSize: 14,
                    }}
                  />
                </label>
              </div>
            </section>

            <div
              style={{
                display: 'flex',
                gap: 12,
                paddingTop: 8,
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  minHeight: 48,
                  flex: 1,
                  padding: '0 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-foreground)',
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {t('content.clear')}
              </button>
              <button
                type="button"
                onClick={applyAndClose}
                style={{
                  minHeight: 48,
                  flex: 1,
                  padding: '0 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('content.apply')}
              </button>
            </div>
          </div>
        </div>
      )}
      {isLoading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)' }}>{t('common.loading')}</div>
      ) : packs.length === 0 ? (
        <EmptyState title={t('content.noPackages')} description={hasActiveFilters ? t('content.noFilterResults') : t('content.createFirstPackage')} icon="📦" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {(packs as PackListItem[]).map((p) => (
            <button
              key={p.pack_id}
              type="button"
              onClick={() => router.push(`/content/${p.pack_id}/edit`)}
              style={{
                textAlign: 'left',
                padding: 0,
                border: 'none',
                borderRadius: 8,
                overflow: 'hidden',
                background: 'var(--color-surface-2)',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ aspectRatio: '1', background: 'var(--color-border)', position: 'relative' }}>
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: 12 }}>
                    {t('content.noCover')}
                  </div>
                )}
              </div>
              <div style={{ padding: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  R$ {Number(p.price).toFixed(2)} · {p.photo_count ?? 0} {t('content.photos')} · {p.video_count ?? 0} {t('content.videos')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      <div style={{ position: 'fixed', bottom: 88, right: 20, zIndex: 40 }}>
        <button
          type="button"
          onClick={() => router.push('/content/create')}
          aria-label="Criar pacote"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 24,
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}
