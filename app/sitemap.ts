import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'
  const now  = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,                   lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/copa-2026`,                        lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/copa-2026/como-completar`,         lastModified: now, changeFrequency: 'weekly',  priority: 0.95 },
    { url: `${base}/copa-2026/brasil`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/copa-2026/argentina`,              lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/copa-2026/portugal`,               lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/copa-2026/franca`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${base}/copa-2026/alemanha`,               lastModified: now, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${base}/copa-2026/espanha`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${base}/copa-2026/inglaterra`,             lastModified: now, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${base}/copa-2026/uruguai`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/copa-2026/mexico`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/copa-2026/figurinhas-brilhantes`,  lastModified: now, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${base}/brasileirao-2026`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/como-trocar-figurinhas`,           lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/bancas/sao-paulo`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/bancas/rio-de-janeiro`,            lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/bancas/belo-horizonte`,            lastModified: now, changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${base}/bancas/curitiba`,                  lastModified: now, changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${base}/bancas/porto-alegre`,              lastModified: now, changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${base}/bancas/brasilia`,                  lastModified: now, changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${base}/bancas`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/anuncios`,    lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/matches`,     lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/album`,       lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/suporte`,     lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/cadastro`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.6 },
    { url: `${base}/entrar`,      lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${base}/termos`,      lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${base}/privacidade`, lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ]

  // Bancas dinâmicas
  try {
    const sb = createAdminClient()
    const { data } = await sb
      .from('bancas')
      .select('slug, updated_at')
      .eq('ativo', true)
      .order('destaque', { ascending: false })

    const bancaRoutes: MetadataRoute.Sitemap = (data ?? []).map(b => ({
      url:             `${base}/bancas/${b.slug}`,
      lastModified:    b.updated_at ? new Date(b.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority:        0.7,
    }))

    return [...staticRoutes, ...bancaRoutes]
  } catch {
    return staticRoutes
  }
}
