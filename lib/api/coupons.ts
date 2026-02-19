const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface CouponItem {
  id: string
  code: string
  image_url?: string
  valid_from?: string
  valid_until?: string
  description?: string
  discount_type?: string
  discount_value?: number
  store_name?: string
}

export async function getAvailableCoupons(token: string): Promise<CouponItem[]> {
  const res = await fetch(`${base()}/rest/v1/rpc/get_available_coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon(),
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return Array.isArray(data) ? data : (data?.data ?? [])
}
