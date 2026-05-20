import type { Metadata } from 'next'
import 'leaflet/dist/leaflet.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: 'Bancas de Jornal — Pontos de Troca de Figurinhas | Completando',
  description: 'Encontre bancas de jornal perto de você para trocar figurinhas com segurança. Locais públicos indicados pela comunidade para encontros de troca da Copa do Mundo 2026.',
  keywords: [
    'banca de jornal figurinhas', 'ponto de troca figurinhas', 'onde trocar figurinhas copa 2026',
    'figurinhas perto de mim', 'banca figurinhas são paulo', 'banca figurinhas rio de janeiro',
    'onde comprar figurinhas copa do mundo', 'trocar figurinhas presencialmente',
  ],
  alternates: { canonical: `${APP_URL}/bancas` },
  openGraph: {
    title: 'Bancas de Jornal — Pontos de Troca | Completando',
    description: 'Bancas de jornal indicadas pela comunidade como pontos seguros para trocar figurinhas perto de você.',
    url: `${APP_URL}/bancas`,
    images: [{ url: `${APP_URL}/logo-bg.png`, width: 1200, height: 630, alt: 'Completando' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${APP_URL}/logo-bg.png`],
  },
}

export default function BancasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
