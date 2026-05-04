import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'Álbum Completo — Troque, Venda e Doe Figurinhas',
  description: 'A plataforma brasileira para troca, venda e doação de figurinhas de álbuns colecionáveis. Copa do Mundo 2026 e muito mais.',
  keywords: ['figurinhas', 'álbum', 'copa do mundo', 'troca', 'venda', 'doação', 'colecionáveis'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#22c55e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-slate-50">
        <Navbar />
        <main className="md:pt-16 main-content">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
