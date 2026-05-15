import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/completar-cadastro',
          '/checkout',
          '/pagamento',
          '/conta',
          '/notificacoes',
          '/propostas',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
