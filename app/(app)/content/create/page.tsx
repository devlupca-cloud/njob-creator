'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { createPackWithItems } from '@/lib/api/content'
import { uploadPackCover, uploadPackItem } from '@/lib/storage/packs'
import { toast } from 'sonner'
import { useTranslation, getLocaleBcp47 } from '@/lib/i18n'

// ─── Currency helpers ──────────────────────────────────────────────

const MIN_PRICE = 10

function formatCurrencyBRL(raw: string, bcp47 = 'pt-BR'): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10) / 100
  return new Intl.NumberFormat(bcp47, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(num)
}

function parseCurrencyBRL(raw: string): number {
  const cleaned = raw.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

// ────────────────────────────────────────────────────────────────────

type PackItem = { url: string; type: 'photo' | 'video' }

export default function ContentCreatePage() {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t: tFn, locale } = useTranslation()
  const bcp47 = getLocaleBcp47(locale)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [priceError, setPriceError] = useState(false)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const coverInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setCoverFile(f)
      setCoverPreview(URL.createObjectURL(f))
    }
  }
  const onPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    setPhotoFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }
  const onVideosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    setVideoFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }
  const removePhoto = (i: number) => setPhotoFiles((prev) => prev.filter((_, idx) => idx !== i))
  const removeVideo = (i: number) => setVideoFiles((prev) => prev.filter((_, idx) => idx !== i))

  const submit = async () => {
    const titleTrimmed = title.trim()
    const p = parseCurrencyBRL(price)
    if (!titleTrimmed) {
      toast.error(tFn('content.titleRequired'))
      return
    }
    if (p < MIN_PRICE) {
      setPriceError(true)
      toast.error(`${tFn('content.price')} mín. R$ ${MIN_PRICE},00`)
      return
    }
    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user.id
    const token = session.session?.access_token
    if (!uid || !token) {
      toast.error(tFn('profile.sessionExpired'))
      return
    }
    setLoading(true)
    try {
      // Gerar pack_id no cliente para upload de arquivos
      const packId = crypto.randomUUID()

      // Upload de arquivos
      let coverImageUrl: string | undefined
      const items: PackItem[] = []
      if (coverFile) {
        coverImageUrl = await uploadPackCover(packId, coverFile)
      }
      let idx = 0
      for (const file of photoFiles) {
        const url = await uploadPackItem(packId, file, 'photo', idx++)
        items.push({ url, type: 'photo' })
      }
      for (const file of videoFiles) {
        const url = await uploadPackItem(packId, file, 'video', idx++)
        items.push({ url, type: 'video' })
      }

      // STRIPE_DISABLED: Create pack in DB only (without Stripe product/price)
      const payload = {
        creator_id: uid,
        title: titleTrimmed,
        price: p,
        currency: 'BRL',
        description: description.trim() || '',
        photo_count: photoFiles.length,
        video_count: videoFiles.length,
        pack_id: packId,
        cover_image_url: coverImageUrl,
        items,
      }
      await createPackWithItems(payload, token)

      toast.success(tFn('content.contentSaved'))
      // Invalidar cache para a lista atualizar automaticamente
      await queryClient.invalidateQueries({ queryKey: ['get_packs_by_creator'] })
      router.push('/content')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tFn('content.errorSaving'))
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>{tFn('content.create')}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          {tFn('content.coverImage')}
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverChange} className="sr-only" id="cover-upload" />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              style={{ ...slotStyle, cursor: 'pointer', padding: 0 }}
            >
              {coverPreview ? (
                <img src={coverPreview} alt={tFn('content.coverImage')} style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>+ {tFn('content.coverImage')}</span>
              )}
            </button>
            {coverFile && (
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{coverFile.name}</span>
            )}
          </div>
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          {tFn('register.additionalPhotos').split(' ')[0]}
          <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={onPhotosChange} className="sr-only" id="photos-upload" />
            <button type="button" onClick={() => photoInputRef.current?.click()} style={{ ...slotStyle, cursor: 'pointer', fontSize: 12, color: 'var(--color-muted)' }}>
              +
            </button>
            {photoFiles.map((f, i) => (
              <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={tFn('common.delete')}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--color-error, #e53e3e)', color: '#fff',
                    border: 'none', cursor: 'pointer', fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>
            ))}
          </div>
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          {tFn('content.uploadMedia')}
          <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <input ref={videoInputRef} type="file" accept="video/*" multiple onChange={onVideosChange} className="sr-only" id="videos-upload" />
            <button type="button" onClick={() => videoInputRef.current?.click()} style={{ ...slotStyle, cursor: 'pointer', fontSize: 12, color: 'var(--color-muted)' }}>
              +
            </button>
            {videoFiles.map((f, i) => (
              <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                <video
                  src={URL.createObjectURL(f)}
                  style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => removeVideo(i)}
                  aria-label={tFn('common.delete')}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--color-error, #e53e3e)', color: '#fff',
                    border: 'none', cursor: 'pointer', fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>
            ))}
          </div>
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          {tFn('content.contentTitle')}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          {tFn('content.contentDescription')} ({tFn('common.optional')})
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={inputStyle} />
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          {tFn('content.price')} (R$)
          <input
            type="text"
            inputMode="numeric"
            value={price}
            onChange={(e) => { setPrice(formatCurrencyBRL(e.target.value, bcp47)); setPriceError(false) }}
            onBlur={() => { if (price && parseCurrencyBRL(price) < MIN_PRICE) setPriceError(true) }}
            placeholder={new Intl.NumberFormat(bcp47, { style: 'currency', currency: 'BRL' }).format(0)}
            style={{ ...inputStyle, borderColor: priceError ? 'var(--color-error)' : undefined }}
          />
          {priceError && (
            <span style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
              {tFn('register.minValue')}
            </span>
          )}
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {tFn('common.back')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            {loading ? tFn('events.creating') : tFn('content.publish')}
          </button>
        </div>
      </div>
    </div>
  )
}
