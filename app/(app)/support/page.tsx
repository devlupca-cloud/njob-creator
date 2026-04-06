'use client'

import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { useTranslation } from '@/lib/i18n'

interface FaqItem {
  q: string
  a: string
}

const faqItems: FaqItem[] = [
  {
    q: 'Como configuro meus pagamentos?',
    a: 'A funcionalidade de pagamentos estará disponível em breve. Você será notificado quando puder configurar seus recebimentos.',
  },
  {
    q: 'Como funciona a comissão da plataforma?',
    a: 'A plataforma cobra 15% sobre cada venda (packs, ingressos de live, videochamadas). O restante é depositado diretamente na sua conta.',
  },
  {
    q: 'Como inicio uma live?',
    a: 'Crie um evento na página inicial selecionando "Live". Defina título, data/hora e preço do ingresso (ou deixe gratuito). Na hora agendada, entre na sala pela página de agenda.',
  },
  {
    q: 'Como funcionam as videochamadas?',
    a: 'Configure sua disponibilidade em Agenda > Disponibilidade. Os clientes podem comprar horários disponíveis. Você pode entrar na chamada 5 minutos antes do horário agendado.',
  },
  {
    q: 'Como crio pacotes de conteúdo?',
    a: 'Vá em Conteúdo > Criar pacote. Adicione fotos, vídeos ou áudios, defina um título, descrição e preço. O pacote ficará visível no seu perfil.',
  },
  {
    q: 'Quando recebo meus pagamentos?',
    a: 'Após uma venda, o valor fica disponível para saque em 2-7 dias úteis, dependendo do seu banco. A funcionalidade de saques estará disponível em breve.',
  },
  {
    q: 'Como altero meu perfil?',
    a: 'Acesse Perfil e toque em "Editar" nos campos que deseja alterar: nome, descrição, fotos, idiomas, tipos de interação e muito mais.',
  },
]

export default function SupportPage() {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-background)]">
      <PageHeader title={t('nav.support')} />

      {/* Contact section */}
      <div className="px-4 py-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-11 rounded-full bg-[rgba(101,22,147,0.1)] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#651693" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[var(--color-foreground)]">Precisa de ajuda?</p>
            <p className="text-[13px] text-[var(--color-muted)]">Entre em contato com nossa equipe</p>
          </div>
        </div>

        <a
          href="mailto:suporte@njob.com.br"
          className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold no-underline cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Enviar email
        </a>
      </div>

      {/* FAQ section */}
      <div className="px-4 py-6">
        <p className="text-[15px] font-semibold text-[var(--color-foreground)] mb-4">
          Perguntas frequentes
        </p>

        <div className="flex flex-col gap-2">
          {faqItems.map((item, i) => (
            <div
              key={i}
              className="rounded-xl bg-[var(--color-secondary)] overflow-hidden transition-all duration-150"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-transparent border-none cursor-pointer text-left"
              >
                <span className="text-[13px] font-semibold text-[var(--color-foreground)] flex-1 pr-3">
                  {item.q}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={[
                    'shrink-0 transition-transform duration-200',
                    openIndex === i ? 'rotate-180' : 'rotate-0',
                  ].join(' ')}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {openIndex === i && (
                <div className="px-4 pb-3.5">
                  <p className="text-[13px] text-[var(--color-muted)] leading-relaxed">
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
