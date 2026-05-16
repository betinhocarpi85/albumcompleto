import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: 'Meu Álbum de Figurinhas — Completando',
  description: 'Controle suas figurinhas coladas e faltando. Marque as repetidas para trocar ou vender. Copa do Mundo FIFA 2026, Brasileirão Masculino e Feminino 2026.',
  keywords: [
    'álbum figurinhas copa 2026', 'marcar figurinhas coladas', 'figurinhas faltando copa',
    'controlar álbum figurinhas', 'checklist figurinhas copa do mundo',
  ],
  alternates: { canonical: `${APP_URL}/album` },
  openGraph: {
    title: 'Meu Álbum — Completando',
    description: 'Controle suas figurinhas e descubra o que falta para completar seu álbum.',
    url: `${APP_URL}/album`,
  },
}

export default function AlbumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
