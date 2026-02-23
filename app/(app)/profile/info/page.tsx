'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAppStore, useCreator } from '@/lib/store/app-store'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import { useTranslation, getLocaleBcp47 } from '@/lib/i18n'

// ─── Icons ───────────────────────────────────────────────────────────────────

const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
)

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

// ─── Row ─────────────────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string
  value: string | null | undefined
  href?: string
  navigable?: boolean
}

function InfoRow({ label, value, href, navigable = false }: InfoRowProps) {
  const showValue = value != null && value !== ''
  const content = (
    <div className="flex items-center justify-between py-3" style={{ minHeight: '44px' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
        {label}
      </span>
      <div className="flex items-center gap-1">
        {showValue && (
          <span className="text-sm truncate max-w-[180px] md:max-w-[240px]" style={{ color: 'var(--color-muted)' }}>
            {value}
          </span>
        )}
        {navigable && (
          <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}>
            <ChevronRightIcon />
          </span>
        )}
      </div>
    </div>
  )

  if (href && navigable) {
    return (
      <Link href={href} className="block hover:bg-surface rounded-lg px-1 transition-colors">
        {content}
      </Link>
    )
  }

  return <div className="px-1">{content}</div>
}

function Divider() {
  return <div style={{ height: '1px', background: 'var(--color-border)' }} />
}

// ─── Photo upload modal ───────────────────────────────────────────────────────

interface PhotoModalProps {
  currentUrl: string | null
  onClose: () => void
  onUpload: (file: File) => Promise<void>
  uploading: boolean
  labelTitle: string
  labelTakePhoto: string
  labelChooseFromGallery: string
  labelUploading: string
}

function PhotoModal({ currentUrl, onClose, onUpload, uploading, labelTitle, labelTakePhoto, labelChooseFromGallery, labelUploading }: PhotoModalProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await onUpload(file)
    onClose()
    e.target.value = ''
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl p-6 pb-10"
        style={{ background: 'var(--color-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
            {labelTitle}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--color-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {currentUrl && (
          <div className="flex justify-center mb-6">
            <img src={currentUrl} alt="Foto atual" className="w-24 h-24 rounded-full object-cover" />
          </div>
        )}

        <div className="flex flex-col gap-3">
          <label className="block w-full cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div
              className="w-full py-3 rounded-xl text-center text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {uploading ? labelUploading : labelTakePhoto}
            </div>
          </label>
          <label className="block w-full cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div
              className="w-full py-3 rounded-xl text-center text-sm font-medium transition-opacity hover:opacity-90 border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
            >
              {uploading ? labelUploading : labelChooseFromGallery}
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined, localeBcp47: string): string {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(localeBcp47)
  } catch {
    return '-'
  }
}

function getLanguageLabel(code: string): string {
  const map: Record<string, string> = {
    pt: 'Português (Brasil)',
    en: 'English',
    es: 'Español',
  }
  return map[code] ?? code
}

export default function InformacoesPessoaisPage() {
  const creator = useCreator()
  const setCreator = useAppStore((s) => s.setCreator)
  const { t, locale } = useTranslation()
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (!cancelled && session?.user?.email) setCurrentUserEmail(session.user.email)
      })
    return () => { cancelled = true }
  }, [])

  const handleAvatarUpload = async (file: File) => {
    if (!creator) return
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sem sessão')

      const ext = file.name.split('.').pop()
      const path = `profiles/${session.user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id)

      setCreator({
        ...creator,
        profile: { ...creator.profile, avatar_url: publicUrl },
      })
      toast.success(t('profile.photoUpdated'))
      setPhotoModalOpen(false)
    } catch (err) {
      console.error(err)
      toast.error(t('profile.photoError'))
    } finally {
      setUploading(false)
    }
  }

  if (!creator) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center">
        <p style={{ color: 'var(--color-muted)' }}>{t('common.loading')}</p>
      </div>
    )
  }

  const { profile, creator_description } = creator

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
      <PageHeader title={t('profile.info')} />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-6">

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setPhotoModalOpen(true)}
              className="relative w-20 h-20 rounded-full overflow-hidden transition-opacity hover:opacity-80"
              style={{ background: 'var(--color-surface-2)' }}
              aria-label={t('profile.changeProfilePhoto')}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--color-muted)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 flex items-end justify-center pb-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <EditIcon />
              </div>
            </button>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {t('profile.tapToChangePhoto')}
            </p>
          </div>

          {/* Card: Dados básicos */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{t('profile.basicData')}</p>
            </div>
            <div className="px-4">
              <InfoRow label={t('profile.name')} value={profile.full_name} href="/profile/edit/name" navigable />
              <Divider />
              <InfoRow label={t('profile.language')} value={getLanguageLabel(locale)} href="/profile/edit/language" navigable />
              <Divider />
              <InfoRow label={t('profile.birthDate')} value={formatDate(creator_description?.date_birth, getLocaleBcp47(locale))} />
            </div>
          </div>

          {/* Card: Acesso */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{t('profile.access')}</p>
            </div>
            <div className="px-4">
              <InfoRow label={t('profile.email')} value={currentUserEmail ?? undefined} href="/profile/edit/email" navigable />
              <Divider />
              <InfoRow label={t('profile.password')} value={undefined} href="/profile/edit/password" navigable />
            </div>
          </div>

          {/* Card: Personalização */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{t('profile.customization')}</p>
            </div>
            <div className="px-4">
              <InfoRow label={t('profile.description')} value={undefined} href="/profile/edit/description" navigable />
              <Divider />
              <InfoRow label={t('profile.interactions')} value={undefined} href="/profile/edit/interactions" navigable />
              <Divider />
              <InfoRow label={t('profile.photos')} value={undefined} href="/profile/edit/images" navigable />
            </div>
          </div>

        </div>
      </div>

      {photoModalOpen && (
        <PhotoModal
          currentUrl={profile.avatar_url}
          onClose={() => setPhotoModalOpen(false)}
          onUpload={handleAvatarUpload}
          uploading={uploading}
          labelTitle={t('profile.changeProfilePhoto')}
          labelTakePhoto={t('profile.takePhoto')}
          labelChooseFromGallery={t('profile.chooseFromGallery')}
          labelUploading={t('profile.uploading')}
        />
      )}
    </div>
  )
}
