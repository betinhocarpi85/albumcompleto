import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: 'Suporte e Perguntas Frequentes — Completando',
  description: 'Tire suas dúvidas sobre como trocar e vender figurinhas no Completando. FAQ completo sobre matches, anúncios, plano PRO, pagamentos e bancas parceiras.',
  keywords: ['suporte figurinhas', 'como trocar figurinhas', 'dúvidas álbum copa 2026', 'faq figurinhas', 'ajuda completando'],
  alternates: { canonical: `${APP_URL}/suporte` },
  openGraph: {
    title: 'Suporte — Completando',
    description: 'Perguntas frequentes sobre troca e venda de figurinhas.',
    url: `${APP_URL}/suporte`,
  },
}

export default function SuporteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
