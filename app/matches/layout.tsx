import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: 'Meus Matches de Figurinhas — Completando',
  description: 'Veja seus matches automáticos com outros colecionadores. Encontre quem tem o que você precisa e precisa do que você tem para trocar figurinhas da Copa do Mundo 2026.',
  keywords: [
    'match figurinhas', 'troca figurinhas automática', 'encontrar figurinhas copa 2026',
    'match troca figurinhas', 'colecionador figurinhas perto',
  ],
  alternates: { canonical: `${APP_URL}/matches` },
  openGraph: {
    title: 'Matches de Figurinhas — Completando',
    description: 'Match automático com quem tem o que você precisa e precisa do que você tem.',
    url: `${APP_URL}/matches`,
  },
}

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
