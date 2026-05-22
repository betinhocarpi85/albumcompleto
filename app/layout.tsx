import type { Metadata, Viewport } from 'next'
import { preconnect, prefetchDNS } from 'react-dom'
import Script from 'next/script'
import './globals.css'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import { Analytics } from '@vercel/analytics/next'
import ServiceWorker from '@/components/ServiceWorker'
import SplashScreen from '@/components/SplashScreen'
import OneSignalProvider from '@/components/OneSignalProvider'
// LazyPushPrompt: Client Component wrapper com ssr:false — sai do bundle inicial
import LazyPushPrompt from '@/components/LazyPushPrompt'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: {
    default:  'Completando — Troque e Venda Figurinhas',
    template: '%s | Completando',
  },
  description: 'A plataforma brasileira para trocar e vender figurinhas de álbuns colecionáveis. Match automático, combine diretamente. Copa do Mundo FIFA 2026, Brasileirão e mais.',
  keywords: [
    'trocar figurinhas', 'vender figurinhas', 'figurinhas repetidas',
    'álbum copa do mundo 2026', 'figurinhas copa 2026', 'completar álbum figurinhas',
    'match figurinhas automático', 'banca de figurinhas', 'figurinhas brasileirao 2026',
  ],
  metadataBase: new URL(APP_URL),
  alternates: { canonical: APP_URL },
  authors: [{ name: 'Completando', url: APP_URL }],
  creator: 'Completando',
  publisher: 'Completando',
  category: 'lifestyle',
  verification: {
    google: 'OLCNt_LnGqu7j1N7EvNU6PmExpj3fMhLuqCzwdHDsq8',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type:        'website',
    url:         APP_URL,
    siteName:    'Completando',
    title:       'Completando — Troque e Venda Figurinhas',
    description: 'Match automático para troca e venda de figurinhas. Copa do Mundo 2026 e mais.',
    images: [{ url: `${APP_URL}/logo-bg.png`, width: 1200, height: 630, alt: 'Completando — Troque e Venda Figurinhas' }],
    locale: 'pt_BR',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Completando — Troque e Venda Figurinhas',
    description: 'Match automático para troca e venda de figurinhas. Copa do Mundo 2026 e mais.',
    images:      [`${APP_URL}/logo-bg.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
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
  maximumScale: 5,   // Permite zoom — acessibilidade (WCAG 1.4.4)
  themeColor: '#22c55e',
  viewportFit: 'cover', // habilita env(safe-area-inset-*) para notch/home-bar
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Preconnect para Supabase — inicia TCP/TLS antes do JS carregar (React 19 resource API)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    preconnect(supabaseUrl)
    prefetchDNS(supabaseUrl)
  }
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        {/* Preconnect apenas para a origem mais crítica — Supabase (auth + DB) */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://lafonveklbmpffwladrd.supabase.co'} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://lafonveklbmpffwladrd.supabase.co'} />
      </head>
      <body className="min-h-full bg-slate-50">
        <SplashScreen />
        <Navbar />
        <main className="md:pt-16 main-content">
          {children}
        </main>
        <BottomNav />
        <Analytics />
        <ServiceWorker />
        <OneSignalProvider />
        <LazyPushPrompt />
        {/* Google Analytics — afterInteractive: só carrega após hydration, não bloqueia LCP/FCP */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y7NBYH69MP"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-Y7NBYH69MP');
        `}</Script>
      </body>
    </html>
  )
}
