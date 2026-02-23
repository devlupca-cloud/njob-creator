'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAppStore, useCreator } from '@/lib/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import DicasFotosModal from '@/components/ui/DicasFotosModal'
import type { ImagesCreator } from '@/lib/types/database'

// ─── Icons ───────────────────────────────────────────────────────────────────

const PlusPhotoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
    <line x1="12" y1="5" x2="12" y2="11" />
    <line x1="9" y1="8" x2="15" y2="8" />
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

// ─── Image Slot ───────────────────────────────────────────────────────────────

interface ImageSlotProps {
  url: string | null
  uploading: boolean
  onSelect: () => void
  onRemove?: () => void
  width?: string
  height?: string
}

function ImageSlot({ url, uploading, onSelect, onRemove, width = '80px', height = '80px' }: ImageSlotProps) {
  return (
    <div className="relative" style={{ width, height }}>
      {url ? (
        <>
          <img
            src={url}
            alt="Foto"
            className="w-full h-full object-cover rounded-lg"
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-error)', color: '#fff' }}
              aria-label="Remover foto"
            >
              <TrashIcon />
            </button>
          )}
        </>
      ) : (
        <button
          onClick={onSelect}
          disabled={uploading}
          className="w-full h-full rounded-lg flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'var(--color-surface-2)', border: '1px dashed var(--color-border)', color: 'var(--color-muted)' }}
          aria-label="Adicionar foto"
        >
          {uploading ? (
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <PlusPhotoIcon />
          )}
        </button>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function uploadImage(file: File, userId: string, path: string): Promise<string> {
  const supabase = createClient()
  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError
  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
  return publicUrl
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AlterarImagensPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const creator = useCreator()
  const setCreator = useAppStore((s) => s.setCreator)

  const images = creator?.images ?? []

  // Highlight image (capa) = highlight_image_url: true
  const capaImage = images.find((img) => img.highlight_image_url)
  // Complementary images = highlight_image_url: false
  const complementares = images.filter((img) => !img.highlight_image_url)

  const [capaUrl, setCapaUrl] = useState<string | null>(capaImage?.image_url ?? null)
  const [comp1, setComp1] = useState<string | null>(complementares[0]?.image_url ?? null)
  const [comp2, setComp2] = useState<string | null>(complementares[1]?.image_url ?? null)
  const [comp3, setComp3] = useState<string | null>(complementares[2]?.image_url ?? null)

  const [uploadingCapa, setUploadingCapa] = useState(false)
  const [uploadingComp, setUploadingComp] = useState<[boolean, boolean, boolean]>([false, false, false])
  const [loading, setLoading] = useState(false)
  const [dicasModalOpen, setDicasModalOpen] = useState(false)

  const capaInputRef = useRef<HTMLInputElement>(null)
  const comp1InputRef = useRef<HTMLInputElement>(null)
  const comp2InputRef = useRef<HTMLInputElement>(null)
  const comp3InputRef = useRef<HTMLInputElement>(null)

  const handleUploadCapa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCapa(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sem sessão')
      const ext = file.name.split('.').pop()
      const url = await uploadImage(file, session.user.id, `profiles/${session.user.id}/capa.${ext}`)
      setCapaUrl(url)
    } catch {
      toast.error(t('profile.errorUploadCover'))
    } finally {
      setUploadingCapa(false)
    }
  }

  const handleUploadComp = (index: 0 | 1 | 2) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const setters = [setComp1, setComp2, setComp3]
    const setUploadingIndex = (val: boolean) => {
      setUploadingComp((prev) => {
        const next: [boolean, boolean, boolean] = [...prev] as [boolean, boolean, boolean]
        next[index] = val
        return next
      })
    }
    setUploadingIndex(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sem sessão')
      const ext = file.name.split('.').pop()
      const url = await uploadImage(file, session.user.id, `profiles/${session.user.id}/comp${index + 1}.${ext}`)
      setters[index](url)
    } catch {
      toast.error(t('profile.errorUploadPhoto'))
    } finally {
      setUploadingIndex(false)
    }
  }

  const handleConfirm = async () => {
    if (!creator) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sem sessão')

      // Build images array for both RPC and local state
      const newImages: ImagesCreator[] = []
      const p_images: Array<{ image_url: string; highlight_image_url: boolean; index: number }> = []

      if (capaUrl) {
        newImages.push({ highlight_image_url: true, image_url: capaUrl })
        p_images.push({ image_url: capaUrl, highlight_image_url: true, index: 0 })
      }

      const compUrls = [comp1, comp2, comp3].filter(Boolean) as string[]
      for (let i = 0; i < compUrls.length; i++) {
        newImages.push({ highlight_image_url: false, image_url: compUrls[i] })
        p_images.push({ image_url: compUrls[i], highlight_image_url: false, index: i })
      }

      const { error } = await supabase.rpc('upsert_profile_images', {
        p_images,
        p_profile_id: session.user.id,
      })
      if (error) throw error

      setCreator({ ...creator, images: newImages })
      toast.success(t('profile.savedSuccess'))
      router.back()
    } catch (err) {
      console.error(err)
      toast.error(t('profile.errorSavePhotos'))
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = Boolean(capaUrl || comp1 || comp2 || comp3)

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
      <PageHeader title={t('profile.editPhotos')} />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-6">

          <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
            {t('profile.editPhotosDesc')}
          </p>

          {/* Fotos complementares */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-foreground)' }}>
                {t('profile.complementaryPhotos')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                {t('profile.complementaryPhotosDesc')}
              </p>
            </div>

            <div className="flex gap-3">
              <ImageSlot
                url={comp1}
                uploading={uploadingComp[0]}
                onSelect={() => comp1InputRef.current?.click()}
                onRemove={comp1 ? () => setComp1(null) : undefined}
                width="80px"
                height="80px"
              />
              <ImageSlot
                url={comp2}
                uploading={uploadingComp[1]}
                onSelect={() => comp2InputRef.current?.click()}
                onRemove={comp2 ? () => setComp2(null) : undefined}
                width="80px"
                height="80px"
              />
              <ImageSlot
                url={comp3}
                uploading={uploadingComp[2]}
                onSelect={() => comp3InputRef.current?.click()}
                onRemove={comp3 ? () => setComp3(null) : undefined}
                width="80px"
                height="80px"
              />
            </div>

            <input ref={comp1InputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadComp(0)} />
            <input ref={comp2InputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadComp(1)} />
            <input ref={comp3InputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadComp(2)} />
          </div>

          {/* Foto de capa */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-foreground)' }}>
                {t('register.coverPhoto')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                {t('profile.coverPhotoDesc')}
              </p>
            </div>

            <ImageSlot
              url={capaUrl}
              uploading={uploadingCapa}
              onSelect={() => capaInputRef.current?.click()}
              onRemove={capaUrl ? () => setCapaUrl(null) : undefined}
              width="100%"
              height="120px"
            />
            <input ref={capaInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCapa} />
          </div>

          <button
            type="button"
            onClick={() => setDicasModalOpen(true)}
            className="rounded-xl p-3 text-xs w-full text-left"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
          >
            {t('register.photoTipsBtn')}
          </button>
          {dicasModalOpen && <DicasFotosModal onClose={() => setDicasModalOpen(false)} />}

          <div className="pb-4">
            <Button
              fullWidth
              loading={loading}
              onClick={handleConfirm}
            >
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
