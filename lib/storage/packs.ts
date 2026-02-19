/**
 * Pack assets upload — bucket "images", paths packs/{packId}/...
 */

import { createClient } from '@/lib/supabase/client'

const BUCKET = 'images'

export async function uploadPackCover(packId: string, file: File): Promise<string> {
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
  const supabase = createClient()
  const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg')
  const path = `packs/${packId}/items/${index}-${type}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return publicUrl
}
