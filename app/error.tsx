'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)] px-6 text-center gap-6">
      <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)] m-0">
          Algo deu errado
        </h2>
        <p className="text-sm text-[var(--color-muted)] m-0 max-w-[320px]">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
      </div>

      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold border-none cursor-pointer"
      >
        Tentar novamente
      </button>
    </div>
  )
}
