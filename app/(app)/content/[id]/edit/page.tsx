'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getPackWithItems, deletePack } from '@/lib/api/content'
import PackVideoPlayer from '@/components/content/PackVideoPlayer'
import { toast } from 'sonner'

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
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [items, setItems] = useState<PackItem[]>([])
  const [fetching, setFetching] = useState(true)
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
        setPrice(
          new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .format(pack.price != null ? Number(pack.price) : 0)
        )
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

  const handleDelete = async () => {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) return
    setDeleting(true)
    try {
      await deletePack(id, token)
      toast.success('Pacote excluído para novas compras')
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

  const photos = items.filter((it) => it.type === 'photo')
  const videos = items.filter((it) => it.type === 'video')

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
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Detalhes do pacote</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Capa */}
        {coverImageUrl && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Capa</p>
            <img src={coverImageUrl} alt="Capa" style={{ width: 120, height: 120, borderRadius: 8, objectFit: 'cover' }} />
          </div>
        )}

        {/* Fotos e Vídeos */}
        {items.length > 0 && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Fotos e vídeos</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {items.map((it, i) => (
                <div key={i}>
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
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '6px 0 0' }}>
              {photos.length} foto{photos.length !== 1 ? 's' : ''} · {videos.length} vídeo{videos.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Título */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Título</p>
          <p style={{ fontSize: 14, margin: 0 }}>{title}</p>
        </div>

        {/* Descrição */}
        {description && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Descrição</p>
            <p style={{ fontSize: 14, margin: 0, color: 'var(--color-muted)' }}>{description}</p>
          </div>
        )}

        {/* Preço */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Preço</p>
          <p style={{ fontSize: 14, margin: 0 }}>R$ {price}</p>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>
            Voltar
          </button>
          <button type="button" onClick={() => setDeleteModalOpen(true)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-error)', background: 'transparent', color: 'var(--color-error)', cursor: 'pointer', fontSize: 14 }}>
            Excluir pacote
          </button>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteModalOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => !deleting && setDeleteModalOpen(false)}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 24, maxWidth: 360, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Excluir pacote?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-muted)' }}>
              O pacote não ficará mais disponível para novas compras. Clientes que já compraram continuarão com acesso.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDeleteModalOpen(false)} disabled={deleting} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>
                Cancelar
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--color-error)', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 14 }}>
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {videoModalUrl && <PackVideoPlayer src={videoModalUrl} onClose={() => setVideoModalUrl(null)} />}
    </div>
  )
}
