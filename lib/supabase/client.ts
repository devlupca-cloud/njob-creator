import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

// Singleton — createBrowserClient reuses the same instance for the same URL+key,
// but we cache explicitly to make the intent clear and avoid re-creating the wrapper.
let cachedClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (!cachedClient) {
    cachedClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return cachedClient
}
