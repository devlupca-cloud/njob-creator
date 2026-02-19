import { createClient } from '@/lib/supabase/client'
import type { CreatorData, UserRole } from '@/lib/types/database'

type SupabaseClientType = ReturnType<typeof createClient>

interface PayoutStatusCallbacks {
  isCreatorAndCompleted: () => void
  isCreatorAndPending: (onboardingUrl: string) => void
  isNotCreator: () => void
  onError: (msg: string) => void
}

/**
 * Checks if the current user is a creator and their Stripe payout status.
 * Replaces Flutter's checkCreatorPayoutStatus custom action.
 */
export async function checkCreatorPayoutStatus(
  supabase: SupabaseClientType,
  callbacks: PayoutStatusCallbacks
): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      callbacks.onError('Usuário não autenticado')
      return
    }

    // Check role in profiles table
    const { data: profileRaw, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = profileRaw as { role: UserRole } | null

    if (profileError || !profile) {
      callbacks.onError('Perfil não encontrado')
      return
    }

    if (profile.role !== 'creator') {
      callbacks.isNotCreator()
      return
    }

    // Check payout status in creator_payout_info
    const { data: payoutRaw, error: payoutError } = await supabase
      .from('creator_payout_info')
      .select('status')
      .eq('creator_id', user.id)
      .single()

    const payoutInfo = payoutRaw as { status: string } | null

    if (payoutError || !payoutInfo) {
      // No payout info found — need to create Stripe account
      const result = await createStripeAccount(supabase)
      if ('url' in result) {
        callbacks.isCreatorAndPending(result.url)
      } else {
        callbacks.onError(result.error)
      }
      return
    }

    if (payoutInfo.status === 'COMPLETED') {
      callbacks.isCreatorAndCompleted()
    } else {
      // pending or suspended — re-fetch onboarding URL
      const result = await createStripeAccount(supabase)
      if ('url' in result) {
        callbacks.isCreatorAndPending(result.url)
      } else {
        callbacks.onError(result.error)
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    callbacks.onError(msg)
  }
}

/**
 * Fetches full creator info. Uses RPC get_profile_info (como no Flutter).
 * Fallback: monta CreatorData a partir das tabelas profiles, creator_description, profile_images.
 */
export async function getCreatorInfo(
  supabase: SupabaseClientType
): Promise<CreatorData | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return null

    const profileId = user.id

    // 1) Tentar RPC get_profile_info (igual ao Flutter)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_profile_info', {
      p_profile_id: profileId,
    })

    if (!rpcError && rpcData != null) {
      const raw = Array.isArray(rpcData) ? rpcData[0] : rpcData
      if (raw && typeof raw === 'object') {
        return normalizeCreatorData(raw as Record<string, unknown>)
      }
    }

    // 2) Fallback: buscar das tabelas
    const [profileRes, descRes, imagesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('creator_description').select('*').eq('profile_id', profileId).maybeSingle(),
      supabase.from('profile_images').select('image_url, highlight_image_url').eq('profile_id', profileId),
    ])

    const profileRow = profileRes.data as Record<string, unknown> | null
    if (profileRes.error || !profileRow) return null

    const profile = {
      username: (profileRow.username as string) ?? '',
      full_name: (profileRow.full_name as string) ?? '',
      avatar_url: (profileRow.avatar_url as string) ?? '',
      role: (profileRow.role as CreatorData['profile']['role']) ?? 'creator',
      is_active: profileRow.is_active !== false,
      created_at: (profileRow.created_at as string) ?? '',
      updated_at: (profileRow.updated_at as string) ?? '',
      whatsapp: (profileRow.whatsapp as string) ?? '',
    }

    const descRow = descRes.data as Record<string, unknown> | null
    const creator_description = descRow
      ? {
          idade: (descRow.idade as number) ?? null,
          date_birth: (descRow.date_birth as string) ?? null,
          cidade: (descRow.cidade as string) ?? null,
          eu_sou: (descRow.eu_sou as string) ?? null,
          por: (descRow.por as string) ?? null,
          me_considero: (descRow.me_considero as string) ?? null,
          adoro: (descRow.adoro as string) ?? null,
          pessoas_que: (descRow.pessoas_que as string) ?? null,
          gender: (descRow.gender as string) ?? null,
          created_at: (descRow.created_at as string) ?? '',
          updated_at: (descRow.updated_at as string) ?? '',
        }
      : null

    const imagesRows = (imagesRes.data ?? []) as Array<{ image_url: string; highlight_image_url: boolean }>
    const images = imagesRows.map((row) => ({
      highlight_image_url: Boolean(row.highlight_image_url),
      image_url: row.image_url ?? '',
    }))

    return {
      profile,
      creator_description,
      images,
      plan_name: null,
      has_active_plan: false,
      plan_stripe_id: null,
      account_details: null,
    }
  } catch (err) {
    console.error('getCreatorInfo exception:', err)
    return null
  }
}

function normalizeCreatorData(raw: Record<string, unknown>): CreatorData {
  const profileRaw = (raw.profile ?? raw) as Record<string, unknown>
  return {
    profile: {
      username: (profileRaw.username as string) ?? '',
      full_name: (profileRaw.full_name as string) ?? '',
      avatar_url: (profileRaw.avatar_url as string) ?? '',
      role: (profileRaw.role as CreatorData['profile']['role']) ?? 'creator',
      is_active: profileRaw.is_active !== false,
      created_at: (profileRaw.created_at as string) ?? '',
      updated_at: (profileRaw.updated_at as string) ?? '',
      whatsapp: (profileRaw.whatsapp as string) ?? '',
    },
    creator_description: (raw.creator_description as CreatorData['creator_description']) ?? null,
    images: Array.isArray(raw.images) ? (raw.images as CreatorData['images']) : [],
    plan_name: (raw.plan_name as string) ?? null,
    has_active_plan: Boolean(raw.has_active_plan),
    plan_stripe_id: (raw.plan_stripe_id as string) ?? null,
    account_details: (raw.account_details as CreatorData['account_details']) ?? null,
  }
}

/**
 * Calls the create-stripe-connected-account Edge Function.
 * Returns the Stripe onboarding URL or null on error.
 * Replaces Flutter's criarSubcontaSTRIPECall.
 */
export async function createStripeAccount(
  supabase: SupabaseClientType
): Promise<{ url: string } | { error: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'create-stripe-connected-account'
    )

    if (error) {
      const msg = error?.message ?? JSON.stringify(error)
      console.error('createStripeAccount error:', msg)
      return { error: msg }
    }

    if (!data) {
      console.error('createStripeAccount: data is null/undefined')
      return { error: 'Edge function retornou vazio' }
    }

    console.log('createStripeAccount data:', JSON.stringify(data))

    // Try common URL field names
    const url =
      (data as Record<string, unknown>).url ??
      (data as Record<string, unknown>).onboarding_url ??
      (typeof data === 'string' ? data : null)

    if (!url || typeof url !== 'string') {
      console.error('createStripeAccount: URL not found in response', data)
      return { error: `Resposta inesperada da edge function: ${JSON.stringify(data)}` }
    }

    return { url }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('createStripeAccount exception:', msg)
    return { error: msg }
  }
}
