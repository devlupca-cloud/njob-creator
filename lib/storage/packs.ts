/**
 * Pack assets upload — bucket "images", paths packs/{packId}/...
 */

import { createClient } from '@/lib/supabase/client'

const BUCKET = 'images'
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

function validateFile(file: File, allowedTypes: string[], maxSize: number) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.type}`)
  }
  if (file.size > maxSize) {
    throw new Error(`Arquivo muito grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`)
  }
}

export async function uploadPackCover(packId: string, file: File): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
  const supabase = createClient()
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `packs/${packId}/cover.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return publicUrl
}

export async function uploadPackItem(
  packId: string,
  file: File,
  type: 'photo' | 'video',
  index: number
): Promise<string> {
  validateFile(
    file,
    type === 'video' ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES,
    type === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE,
  )
  const supabase = createClient()
  const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg')
  const path = `packs/${packId}/items/${index}-${type}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return publicUrl
}
