'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// O fluxo de agenda fixa foi substituído pelo modo "Online para Videochamada"
// (toggle manual no home + presence + idle timeout). Esta página existe só
// para não quebrar bookmarks e redireciona para /schedule.
export default function AvailabilityPageDeprecated() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/schedule'), 2500)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
          Agenda foi removida
        </h1>
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          A disponibilidade agora é controlada pelo botão &quot;Online para
          Videochamada&quot; na sua home. Você será redirecionado…
        </p>
      </div>
    </div>
  )
}
