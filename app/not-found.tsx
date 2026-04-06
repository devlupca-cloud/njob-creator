import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)] px-6 text-center gap-6">
      <div className="size-20 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
        <span className="text-[32px] font-bold text-[var(--color-muted)]">404</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold text-[var(--color-foreground)] m-0">
          Página não encontrada
        </h1>
        <p className="text-sm text-[var(--color-muted)] m-0 max-w-[300px]">
          A página que você procura não existe ou foi movida.
        </p>
      </div>

      <Link
        href="/home"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold no-underline"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
