'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getPackWithItems, updatePackWithItems, deletePack } from '@/lib/api/content'
import { uploadPackCover, uploadPackItem } from '@/lib/storage/packs'
import PackVideoPlayer from '@/components/content/PackVideoPlayer'
import { toast } from 'sonner'

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
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [items, setItems] = useState<PackItem[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

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
        setPrice((pack.price != null ? Number(pack.price) : 0).toFixed(2))
        setDescription((pack.description as string) ?? '')
        setCoverImageUrl((pack.cover_image_url as string) ?? null)
        const rawItems = (pack.items ?? pack.pack_items) as unknown[]
        setItems(Array.isArray(rawItems) ? rawItems.map((it) => normItem(it as Parameters<typeof normItem>[0])) : [])
      } catch {
        toast.error('Pacote não encontrado')
        router.push('/content')
      } finally {
        setFetching(false)
      }
    })()
  }, [id, supabase, router])

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
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const removePhoto = (i: number) => setPhotoFiles((prev) => prev.filter((_, idx) => idx !== i))
  const removeVideo = (i: number) => setVideoFiles((prev) => prev.filter((_, idx) => idx !== i))

  const submit = async () => {
    const t = title.trim()
    const p = parseFloat(price.replace(/\D/g, '').replace(',', '.') || '0') / 100
    if (!t) {
      toast.error('Título é obrigatório')
      return
    }
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) {
      toast.error('Sessão expirada')
      return
    }
    setLoading(true)
    try {
      let coverUrl = coverImageUrl
      if (coverFile) {
        coverUrl = await uploadPackCover(id, coverFile)
      }
      const newItems: PackItem[] = [...items]
      let idx = items.length
      for (const file of photoFiles) {
        const url = await uploadPackItem(id, file, 'photo', idx++)
        newItems.push({ url, type: 'photo' })
      }
      for (const file of videoFiles) {
        const url = await uploadPackItem(id, file, 'video', idx++)
        newItems.push({ url, type: 'video' })
      }
      await updatePackWithItems(
        { pack_id: id, title: t, price: p, currency: 'BRL', description: description.trim() || null, cover_image_url: coverUrl ?? null, items: newItems },
        token
      )
      toast.success('Pacote atualizado')
      router.push('/content')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) return
    setDeleting(true)
    try {
      await deletePack(id, token)
      toast.success('Pacote excluído')
      router.push('/content')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir')
    } finally {
      setDeleting(false)
      setDeleteModalOpen(false)
    }
  }

  if (!id) return null
  if (fetching) return <div style={{ padding: 32, textAlign: 'center' }}>Carregando...</div>

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
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Editar pacote</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Capa
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverChange} className="sr-only" id="cover-upload" />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              style={{ ...slotStyle, cursor: 'pointer', padding: 0 }}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Capa" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} />
              ) : coverImageUrl ? (
                <img src={coverImageUrl} alt="Capa" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>+ Capa</span>
              )}
            </button>
            {coverFile && <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{coverFile.name}</span>}
          </div>
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Fotos e vídeos
          <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {items.map((it, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {it.type === 'photo' ? (
                  <img src={it.url} alt="" style={{ ...slotStyle, width: 80, height: 80 }} />
                ) : (
                  <button
                    type="button"
                    onClick={() => setVideoModalUrl(it.url)}
                    style={{ ...slotStyle, width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-muted)', cursor: 'pointer' }}
                    title="Reproduzir vídeo"
                  >
                    ▶ Vídeo
                  </button>
                )}
                <button type="button" onClick={() => removeItem(i)} aria-label="Remover" style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'var(--color-error)', color: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
              </div>
            ))}
            <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={onPhotosChange} className="sr-only" id="photos-upload" />
            <input ref={videoInputRef} type="file" accept="video/*" multiple onChange={onVideosChange} className="sr-only" id="videos-upload" />
            <button type="button" onClick={() => photoInputRef.current?.click()} style={{ ...slotStyle, cursor: 'pointer', fontSize: 12, color: 'var(--color-muted)' }}>+ Foto</button>
            <button type="button" onClick={() => videoInputRef.current?.click()} style={{ ...slotStyle, cursor: 'pointer', fontSize: 12, color: 'var(--color-muted)' }}>+ Vídeo</button>
            {photoFiles.map((f, i) => (
              <span key={`p-${i}`} style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {f.name}
                <button type="button" onClick={() => removePhoto(i)} aria-label="Remover" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>×</button>
              </span>
            ))}
            {videoFiles.map((f, i) => (
              <span key={`v-${i}`} style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {f.name}
                <button type="button" onClick={() => removeVideo(i)} aria-label="Remover" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>×</button>
              </span>
            ))}
          </div>
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Título
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Descrição (opcional)
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={inputStyle} placeholder="Descreva o pacote" />
        </label>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Preço (R$)
          <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} />
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>Voltar</button>
          <button type="button" onClick={submit} disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14 }}>{loading ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" onClick={() => setDeleteModalOpen(true)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-error)', background: 'transparent', color: 'var(--color-error)', cursor: 'pointer', fontSize: 14 }}>Excluir pacote</button>
        </div>
      </div>
      {deleteModalOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => !deleting && setDeleteModalOpen(false)}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 24, maxWidth: 360, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Excluir pacote?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-muted)' }}>Tem certeza? Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDeleteModalOpen(false)} disabled={deleting} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
              <button type="button" onClick={handleDelete} disabled={deleting} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--color-error)', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 14 }}>{deleting ? 'Excluindo...' : 'Excluir'}</button>
            </div>
          </div>
        </div>
      )}
      {videoModalUrl && <PackVideoPlayer src={videoModalUrl} onClose={() => setVideoModalUrl(null)} />}
    </div>
  )
}
