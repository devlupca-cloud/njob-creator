'use client'

import PageHeader from '@/components/ui/PageHeader'

export default function SupportPage() {
  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
      <PageHeader title="Suporte" />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <p style={{ fontSize: 15, color: 'var(--color-foreground)', marginBottom: 8 }}>
          Central de ajuda e suporte
        </p>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', maxWidth: 320 }}>
          Em breve você poderá enviar dúvidas, reportar problemas e acompanhar suas solicitações por aqui.
        </p>
      </div>
    </div>
  )
}
