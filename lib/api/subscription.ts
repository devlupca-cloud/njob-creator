/**
 * Subscription checkout — Edge Function create-checkout-subscription-stripe.
 * Replaces Flutter callSubscriptionCheckout custom action.
 */

const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL!

export async function createSubscriptionCheckout(
  priceId: string,
  accessToken: string
): Promise<{ url?: string; error?: string }> {
  const res = await fetch(`${base()}/functions/v1/create-checkout-subscription-stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ price_id: priceId }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { error: data?.message ?? data?.error ?? `HTTP ${res.status}` }
  return { url: data?.url }
}
