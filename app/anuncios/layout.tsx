import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: 'Meus Anúncios de Figurinhas — Completando',
  description: 'Anuncie suas figurinhas repetidas para troca ou venda. Encontre matches automáticos com outros colecionadores da Copa do Mundo 2026 e Brasileirão.',
  keywords: [
    'anunciar figurinhas', 'vender figurinhas repetidas', 'trocar figurinhas online',
    'anúncio figurinhas copa 2026', 'figurinhas repetidas troca',
  ],
  alternates: { canonical: `${APP_URL}/anuncios` },
  openGraph: {
    title: 'Anúncios de Figurinhas — Completando',
    description: 'Anuncie suas repetidas e encontre matches automáticos para trocar ou vender.',
    url: `${APP_URL}/anuncios`,
  },
}

export default function AnunciosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
