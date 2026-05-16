import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import { Analytics } from '@vercel/analytics/next'
import ServiceWorker from '@/components/ServiceWorker'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title:       'Completando — Troque e Venda Figurinhas',
  description: 'A plataforma brasileira para troca e venda de figurinhas de álbuns colecionáveis. Match automático, combine diretamente. Copa do Mundo 2026 e mais.',
  keywords:    ['figurinhas', 'álbum', 'copa do mundo', 'troca', 'venda', 'colecionáveis'],
  metadataBase: new URL(APP_URL),
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png', sizes: '96x96' },
    ],
    apple: '/icon.png',
  },
  openGraph: {
    type:        'website',
    url:         APP_URL,
    siteName:    'Completando',
    title:       'Completando — Troque e Venda Figurinhas',
    description: 'Match automático para troca e venda de figurinhas. Copa do Mundo 2026 e mais.',
    images: [{ url: '/logo-bg.png', width: 1200, height: 630, alt: 'Completando' }],
    locale: 'pt_BR',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Completando — Troque e Venda Figurinhas',
    description: 'Match automático para troca e venda de figurinhas.',
    images:      ['/logo-bg.png'],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Completando',
  },
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
        <Analytics />
        <ServiceWorker />
      </body>
    </html>
  )
}
