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
    a: 'Acesse Financeiro > Pagamentos e conecte sua conta Stripe. Após a verificação, você poderá receber pagamentos e realizar saques.',
  },
  {
    q: 'Como funciona a comissão da plataforma?',
    a: 'A plataforma cobra 15% sobre cada venda (packs, ingressos de live, videochamadas). O restante é depositado diretamente na sua conta Stripe.',
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
    a: 'Os pagamentos são processados pelo Stripe. Após uma venda, o valor fica disponível para saque em 2-7 dias úteis, dependendo do seu banco.',
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
    <div className="flex flex-col min-h-full" style={{ background: 'var(--color-background)' }}>
      <PageHeader title={t('nav.support')} />

      {/* Contact section */}
      <div style={{ padding: '24px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(101,22,147,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#651693" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-foreground)' }}>Precisa de ajuda?</p>
            <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Entre em contato com nossa equipe</p>
          </div>
        </div>

        <a
          href="mailto:suporte@njob.com.br"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: '12px 24px',
            borderRadius: 12,
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Enviar email
        </a>
      </div>

      {/* FAQ section */}
      <div style={{ padding: '24px 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 16 }}>
          Perguntas frequentes
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqItems.map((item, i) => (
            <div
              key={i}
              style={{
                borderRadius: 12,
                background: 'var(--color-secondary)',
                overflow: 'hidden',
                transition: 'all 150ms',
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)', flex: 1, paddingRight: 12 }}>
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
                  style={{ transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms', flexShrink: 0 }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {openIndex === i && (
                <div style={{ padding: '0 16px 14px 16px' }}>
                  <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
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
