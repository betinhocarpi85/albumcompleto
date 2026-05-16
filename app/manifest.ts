import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'Completando — Troque e Venda Figurinhas',
    short_name:       'Completando',
    description:      'A plataforma brasileira para troca e venda de figurinhas. Match automático, combine diretamente.',
    start_url:        '/',
    display:          'standalone',
    background_color: '#ffffff',
    theme_color:      '#22c55e',
    orientation:      'portrait',
    icons: [
      { src: '/favicon.ico', sizes: '48x48',   type: 'image/x-icon' },
      { src: '/icon.png',    sizes: '96x96',   type: 'image/png' },
      { src: '/icon.png',    sizes: '192x192', type: 'image/png' },
      { src: '/icon.png',    sizes: '512x512', type: 'image/png' },
    ],
    categories: ['lifestyle', 'sports', 'entertainment'],
    lang: 'pt-BR',
  }
}
