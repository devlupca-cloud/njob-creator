import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must not run any other Supabase calls before this
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAuthRoute = pathname.startsWith('/(auth)') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/reset-password')

  const isAppRoute = pathname.startsWith('/(app)') ||
    pathname === '/home' ||
    pathname === '/profile' ||
    pathname === '/content' ||
    pathname === '/chat' ||
    pathname === '/schedule' ||
    pathname === '/financial' ||
    pathname === '/subscriptions' ||
    pathname === '/support' ||
    pathname === '/notifications' ||
    pathname === '/stripe-setup'

  // Redirect unauthenticated users away from protected routes
  if (!user && isAppRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth routes
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/home'
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect root to /home or /login
  if (pathname === '/') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = user ? '/home' : '/login'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
