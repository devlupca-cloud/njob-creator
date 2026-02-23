'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getPackWithItems } from '@/lib/api/content'
import PackVideoPlayer from '@/components/content/PackVideoPlayer'
import { toast } from 'sonner'
import { useTranslation, getLocaleBcp47 } from '@/lib/i18n'

type PackItem = { url: string; type: 'photo' | 'video' }

function normItem(it: { file_url?: string; url?: string; item_type?: string; type?: string }): PackItem {
  const url = (it.file_url ?? it.url) ?? ''
  const type = ((it.item_type ?? it.type) ?? 'photo') as 'photo' | 'video'
  return { url, type: type === 'video' ? 'video' : 'photo' }
}

export default function ContentViewPage() {
  const params = useParams()
  const id = params?.id as string
  const supabase = createClient()
  const router = useRouter()
  const { t, locale } = useTranslation()
  const bcp47 = getLocaleBcp47(locale)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceDisplay, setPriceDisplay] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [existingItems, setExistingItems] = useState<PackItem[]>([])
  const [fetching, setFetching] = useState(true)
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) {
        setFetching(false)
        return
      }
      try {
        const pack = await getPackWithItems(id, token)
        setTitle((pack.title as string) ?? '')
        setDescription((pack.description as string) ?? '')
        setPriceDisplay(
          new Intl.NumberFormat(bcp47, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .format(pack.price != null ? Number(pack.price) : 0)
        )
        setCoverImageUrl((pack.cover_image_url as string) ?? null)
        const rawItems = (pack.items ?? pack.pack_items) as unknown[]
        setExistingItems(Array.isArray(rawItems) ? rawItems.map((it) => normItem(it as Parameters<typeof normItem>[0])) : [])
      } catch {
        toast.error(t('content.noContent'))
        router.push('/content')
      } finally {
        setFetching(false)
      }
    })()
  }, [id, supabase, router])

  if (!id) return null
  if (fetching) return <div style={{ padding: 32, textAlign: 'center' }}>{t('common.loading')}</div>

  const slotStyle = {
    width: 80,
    height: 80,
    borderRadius: 8,
    objectFit: 'cover' as const,
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>{title}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Capa */}
        {coverImageUrl && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{t('content.coverImage')}</p>
            <div style={{ width: 120, height: 120, borderRadius: 8, overflow: 'hidden' }}>
              <img src={coverImageUrl} alt={t('content.coverImage')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        )}

        {/* Midias */}
        {existingItems.length > 0 && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{t('content.uploadMedia')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {existingItems.map((it, i) => (
                <div key={`item-${i}`}>
                  {it.type === 'photo' ? (
                    <img src={it.url} alt="" style={slotStyle} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVideoModalUrl(it.url)}
                      style={{ ...slotStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-muted)', cursor: 'pointer' }}
                    >
                      ▶ Video
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Titulo */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{t('content.contentTitle')}</p>
          <p style={{ fontSize: 14, margin: 0 }}>{title}</p>
        </div>

        {/* Descricao */}
        {description && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{t('content.contentDescription')}</p>
            <p style={{ fontSize: 14, margin: 0, color: 'var(--color-muted)' }}>{description}</p>
          </div>
        )}

        {/* Preco */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{t('content.price')}</p>
          <p style={{ fontSize: 14, margin: 0, color: 'var(--color-muted)' }}>R$ {priceDisplay}</p>
        </div>

        {/* Botao voltar */}
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 14 }}
          >
            {t('common.back')}
          </button>
        </div>
      </div>

      {videoModalUrl && <PackVideoPlayer src={videoModalUrl} onClose={() => setVideoModalUrl(null)} />}
    </div>
  )
}
