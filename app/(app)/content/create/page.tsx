'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createPackWithItems, createStripePack, updatePackWithItems } from '@/lib/api/content'
import { uploadPackCover, uploadPackItem } from '@/lib/storage/packs'
import { toast } from 'sonner'

// ─── Currency helpers ──────────────────────────────────────────────

const MIN_PRICE = 10

function formatCurrencyBRL(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10) / 100
  return new Intl.NumberFormat('pt-BR', {
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
    const t = title.trim()
    const p = parseCurrencyBRL(price)
    if (!t) {
      toast.error('Título é obrigatório')
      return
    }
    if (p < MIN_PRICE) {
      setPriceError(true)
      toast.error(`Preço mínimo é R$ ${MIN_PRICE},00`)
      return
    }
    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user.id
    const token = session.session?.access_token
    if (!uid || !token) {
      toast.error('Sessão expirada')
      return
    }
    setLoading(true)
    try {
      const payload = { creator_id: uid, title: t, price: p, currency: 'BRL', description: description.trim() || '', photo_count: photoFiles.length, video_count: videoFiles.length }
      const result = await createPackWithItems(payload, token)
      const packId = result.pack_id
      if (!packId) {
        toast.success('Pacote criado')
        router.push('/content')
        return
      }
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
      if (coverImageUrl || items.length > 0) {
        await updatePackWithItems(
          { pack_id: packId, title: t, price: p, currency: 'BRL', description: description.trim() || '', cover_image_url: coverImageUrl ?? null, items },
          token
        )
      }
      try {
        await createStripePack({ ...payload, pack_id: packId, cover_image_url: coverImageUrl, items }, token)
      } catch (stripeErr) {
        console.warn('[ContentCreate] create-stripe-pack:', stripeErr)
        toast.info('Pacote criado. Sincronização com Stripe pode ser feita depois.')
      }
      toast.success('Pacote criado')
      router.push('/content')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar')
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
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Criar pacote</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Capa
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverChange} className="sr-only" id="cover-upload" />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              style={{ ...slotStyle, cursor: 'pointer', padding: 0 }}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Capa" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>+ Capa</span>
              )}
            </button>
            {coverFile && (
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{coverFile.name}</span>
            )}
          </div>
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Fotos
          <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={onPhotosChange} className="sr-only" id="photos-upload" />
            <button type="button" onClick={() => photoInputRef.current?.click()} style={{ ...slotStyle, cursor: 'pointer', fontSize: 12, color: 'var(--color-muted)' }}>
              + Foto
            </button>
            {photoFiles.map((f, i) => (
              <span key={i} style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {f.name}
                <button type="button" onClick={() => removePhoto(i)} aria-label="Remover" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>×</button>
              </span>
            ))}
          </div>
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Vídeos
          <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <input ref={videoInputRef} type="file" accept="video/*" multiple onChange={onVideosChange} className="sr-only" id="videos-upload" />
            <button type="button" onClick={() => videoInputRef.current?.click()} style={{ ...slotStyle, cursor: 'pointer', fontSize: 12, color: 'var(--color-muted)' }}>
              + Vídeo
            </button>
            {videoFiles.map((f, i) => (
              <span key={i} style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {f.name}
                <button type="button" onClick={() => removeVideo(i)} aria-label="Remover" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>×</button>
              </span>
            ))}
          </div>
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Título
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Descrição (opcional)
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={inputStyle} placeholder="Descreva o pacote" />
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Preço (R$)
          <input
            type="text"
            inputMode="numeric"
            value={price}
            onChange={(e) => { setPrice(formatCurrencyBRL(e.target.value)); setPriceError(false) }}
            onBlur={() => { if (price && parseCurrencyBRL(price) < MIN_PRICE) setPriceError(true) }}
            placeholder="R$ 0,00"
            style={{ ...inputStyle, borderColor: priceError ? 'var(--color-error)' : undefined }}
          />
          {priceError && (
            <span style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
              Valor mínimo de R$ {MIN_PRICE},00
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
            Voltar
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
            {loading ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}
