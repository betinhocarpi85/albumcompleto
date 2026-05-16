import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: 'Bancas de Figurinhas Parceiras — Completando',
  description: 'Encontre bancas de jornal e pontos de troca de figurinhas perto de você em todo o Brasil. Compre, venda e troque figurinhas da Copa do Mundo 2026 com segurança.',
  keywords: [
    'banca de figurinhas', 'banca de jornal figurinhas', 'comprar figurinhas copa 2026',
    'pontos de troca figurinhas', 'figurinhas perto de mim', 'banca figurinhas são paulo',
    'banca figurinhas rio de janeiro', 'onde comprar figurinhas copa do mundo',
  ],
  alternates: { canonical: `${APP_URL}/bancas` },
  openGraph: {
    title: 'Bancas de Figurinhas — Completando',
    description: 'Encontre bancas parceiras para comprar, vender e trocar figurinhas perto de você.',
    url: `${APP_URL}/bancas`,
  },
}

export default function BancasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
