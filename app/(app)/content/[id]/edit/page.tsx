'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getPackWithItems, updatePackWithItems, deletePack } from '@/lib/api/content'
import { uploadPackCover, uploadPackItem } from '@/lib/storage/packs'
import PackVideoPlayer from '@/components/content/PackVideoPlayer'
import { toast } from 'sonner'
import { useTranslation, getLocaleBcp47 } from '@/lib/i18n'

type PackItem = { url: string; type: 'photo' | 'video' }

function normItem(it: { file_url?: string; url?: string; item_type?: string; type?: string }): PackItem {
  const url = (it.file_url ?? it.url) ?? ''
  const type = ((it.item_type ?? it.type) ?? 'photo') as 'photo' | 'video'
  return { url, type: type === 'video' ? 'video' : 'photo' }
}

export default function ContentEditPage() {
  const params = useParams()
  const id = params?.id as string
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t, locale } = useTranslation()
  const bcp47 = getLocaleBcp47(locale)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceDisplay, setPriceDisplay] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null)
  const [newCoverPreview, setNewCoverPreview] = useState<string | null>(null)
  const [existingItems, setExistingItems] = useState<PackItem[]>([])
  const [removedItemUrls, setRemovedItemUrls] = useState<string[]>([])
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([])
  const [newVideoFiles, setNewVideoFiles] = useState<File[]>([])
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Load pack data
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

  // Cover handlers
  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setNewCoverFile(f)
      setNewCoverPreview(URL.createObjectURL(f))
    }
  }

  // Media handlers
  const onPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    setNewPhotoFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }
  const onVideosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    setNewVideoFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  const removeExistingItem = (url: string) => {
    setRemovedItemUrls((prev) => [...prev, url])
  }
  const undoRemoveItem = (url: string) => {
    setRemovedItemUrls((prev) => prev.filter((u) => u !== url))
  }
  const removeNewPhoto = (i: number) => setNewPhotoFiles((prev) => prev.filter((_, idx) => idx !== i))
  const removeNewVideo = (i: number) => setNewVideoFiles((prev) => prev.filter((_, idx) => idx !== i))

  // Delete handler
  const handleDelete = async () => {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) return
    setDeleting(true)
    try {
      await deletePack(id, token)
      toast.success(t('content.contentDeleted'))
      await queryClient.invalidateQueries({ queryKey: ['get_packs_by_creator'] })
      router.push('/content')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('content.errorDeleting'))
    } finally {
      setDeleting(false)
      setDeleteModalOpen(false)
    }
  }

  // Save handler
  const handleSave = async () => {
    const titleTrimmed = title.trim()
    if (!titleTrimmed) {
      toast.error(t('content.titleRequired'))
      return
    }

    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user.id
    const token = session.session?.access_token
    if (!uid || !token) {
      toast.error(t('profile.sessionExpired'))
      return
    }

    setLoading(true)
    try {
      // Upload new cover if changed
      let finalCoverUrl = coverImageUrl
      if (newCoverFile) {
        finalCoverUrl = await uploadPackCover(id, newCoverFile)
      }

      // Determine starting index for new items
      const keptItems = existingItems.filter((it) => !removedItemUrls.includes(it.url))
      let idx = keptItems.length

      // Upload new files
      const uploadedItems: PackItem[] = []
      for (const file of newPhotoFiles) {
        const url = await uploadPackItem(id, file, 'photo', idx++)
        uploadedItems.push({ url, type: 'photo' })
      }
      for (const file of newVideoFiles) {
        const url = await uploadPackItem(id, file, 'video', idx++)
        uploadedItems.push({ url, type: 'video' })
      }

      // Final items array
      const finalItems = [...keptItems, ...uploadedItems]

      const payload = {
        pack_id: id,
        title: titleTrimmed,
        description: description.trim(),
        cover_image_url: finalCoverUrl,
        items: finalItems,
      }

      await updatePackWithItems(payload, token)
      toast.success(t('content.contentSaved'))
      await queryClient.invalidateQueries({ queryKey: ['get_packs_by_creator'] })
      router.push('/content')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('content.errorSaving'))
    } finally {
      setLoading(false)
    }
  }

  if (!id) return null
  if (fetching) return <div style={{ padding: 32, textAlign: 'center' }}>{t('common.loading')}</div>

  const visibleExistingItems = existingItems.filter((it) => !removedItemUrls.includes(it.url))
  const removedItems = existingItems.filter((it) => removedItemUrls.includes(it.url))

  const inputStyle = {
    display: 'block' as const,
    width: '100%',
    marginTop: 4,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface-2)',
    fontSize: 14,
  }
  const slotStyle = {
    width: 80,
    height: 80,
    borderRadius: 8,
    objectFit: 'cover' as const,
    background: 'var(--color-surface-2)',
    border: '1px dashed var(--color-border)',
  }

  const displayCover = newCoverPreview ?? coverImageUrl

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>{t('content.edit')}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Capa */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{t('content.coverImage')}</p>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverChange} className="sr-only" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              style={{ ...slotStyle, width: 120, height: 120, cursor: 'pointer', padding: 0, position: 'relative', overflow: 'hidden' }}
            >
              {displayCover ? (
                <img src={displayCover} alt={t('content.coverImage')} style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>+ {t('content.coverImage')}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 12 }}
            >
              {t('content.changeCover')}
            </button>
          </div>
        </div>

        {/* Mídias existentes */}
        {visibleExistingItems.length > 0 && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{t('content.uploadMedia')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {visibleExistingItems.map((it, i) => (
                <div key={`existing-${i}`} style={{ position: 'relative' }}>
                  {it.type === 'photo' ? (
                    <img src={it.url} alt="" style={{ ...slotStyle, width: 80, height: 80, border: '1px solid var(--color-border)' }} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVideoModalUrl(it.url)}
                      style={{ ...slotStyle, width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-muted)', cursor: 'pointer', border: '1px solid var(--color-border)' }}
                    >
                      ▶ Video
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeExistingItem(it.url)}
                    title={t('content.removeItem')}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'var(--color-error)', color: '#fff',
                      border: 'none', cursor: 'pointer',
                      fontSize: 12, lineHeight: '20px', textAlign: 'center', padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items marcados para remoção (com opção de desfazer) */}
        {removedItems.length > 0 && (
          <div style={{ padding: 8, borderRadius: 8, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '0 0 4px' }}>
              {removedItems.length} item{removedItems.length !== 1 ? 's' : ''} marcado{removedItems.length !== 1 ? 's' : ''} para remoção
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {removedItems.map((it, i) => (
                <button
                  key={`removed-${i}`}
                  type="button"
                  onClick={() => undoRemoveItem(it.url)}
                  style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-muted)', textDecoration: 'line-through' }}
                >
                  {it.type === 'photo' ? '📷' : '🎬'} Desfazer
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Novos arquivos de foto */}
        {newPhotoFiles.length > 0 && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '0 0 4px' }}>{t('content.addPhotos')} ({newPhotoFiles.length})</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {newPhotoFiles.map((f, i) => (
                <span key={i} style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {f.name}
                  <button type="button" onClick={() => removeNewPhoto(i)} aria-label={t('content.removeItem')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--color-error)' }}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Novos arquivos de vídeo */}
        {newVideoFiles.length > 0 && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '0 0 4px' }}>{t('content.addVideos')} ({newVideoFiles.length})</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {newVideoFiles.map((f, i) => (
                <span key={i} style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {f.name}
                  <button type="button" onClick={() => removeNewVideo(i)} aria-label={t('content.removeItem')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--color-error)' }}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botões adicionar mídia */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={onPhotosChange} className="sr-only" />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px dashed var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--color-muted)' }}
          >
            + {t('content.addPhotos')}
          </button>
          <input ref={videoInputRef} type="file" accept="video/*" multiple onChange={onVideosChange} className="sr-only" />
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px dashed var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--color-muted)' }}
          >
            + {t('content.addVideos')}
          </button>
        </div>

        {/* Título */}
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          {t('content.contentTitle')}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </label>

        {/* Descrição */}
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          {t('content.contentDescription')} ({t('common.optional')})
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={inputStyle}
          />
        </label>

        {/* Preço (read-only) */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{t('content.price')}</p>
          <p style={{ fontSize: 14, margin: 0, color: 'var(--color-muted)' }}>R$ {priceDisplay}</p>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 14 }}
          >
            {t('common.back')}
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-error)', background: 'transparent', color: 'var(--color-error)', cursor: 'pointer', fontSize: 14 }}
          >
            {t('content.deleteContent')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'var(--color-primary)', color: '#fff', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14,
            }}
          >
            {loading ? t('content.saving') : t('content.saveChanges')}
          </button>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteModalOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => !deleting && setDeleteModalOpen(false)}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 24, maxWidth: 360, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>{t('content.deleteContent')}?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-muted)' }}>
              {t('content.deleteConfirm')}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDeleteModalOpen(false)} disabled={deleting} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>
                {t('common.cancel')}
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--color-error)', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 14 }}>
                {deleting ? `${t('common.delete')}...` : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {videoModalUrl && <PackVideoPlayer src={videoModalUrl} onClose={() => setVideoModalUrl(null)} />}
    </div>
  )
}
