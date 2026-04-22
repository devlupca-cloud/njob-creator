import Link from 'next/link'
import { LegalDocument } from '@/components/legal/LegalDocument'
import { TERMS_OF_USE_MD } from '@/lib/legal/documents'

export const metadata = {
  title: 'Termos de Uso — NJOB',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link
          href="/"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          ← Voltar
        </Link>
        <div className="mt-6">
          <LegalDocument markdown={TERMS_OF_USE_MD} />
        </div>
      </div>
    </main>
  )
}
