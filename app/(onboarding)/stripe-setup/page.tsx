'use client'

// STRIPE_DISABLED: Stripe setup page temporarily disabled.
// Redirects to /home since Stripe onboarding is not active.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StripeSetupPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/home')
  }, [router])

  return null
}
