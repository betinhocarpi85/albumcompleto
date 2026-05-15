import { NextResponse } from 'next/server'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Cache em memória (TTL 60 s) ────────────────────────────────────────────────
// Em Vercel serverless instâncias warm reutilizam o módulo; cold starts perdem o cache
// (comportamento aceitável — evita filas de COUNT(*) em 99% dos requests)
interface StatsData {
  totalUsers:       number
  totalPro:         number
  totalFree:        number
  bannedUsers:      number
  completeProfiles: number
  totalAnuncios:    number
  totalPropostas:   number
  totalColadas:     number
  totalPedidos:     number
  onlineHoje:       number
}

let cache: { data: StatsData; expiresAt: number } | null = null
const CACHE_TTL_MS = 60_000 // 60 segundos

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!await isAdminAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Serve do cache se ainda válido
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data)
  }

  const sb = createAdminClient()

  // 8 COUNTs paralelos — com os índices da migração, cada um é um index scan
  const [
    { count: totalUsers },
    { count: totalPro },
    { count: totalBanned },
    { count: totalComplete },
    { count: totalAnuncios },
    { count: totalPropostas },
    { count: totalColadas },
    { count: onlineHoje },
  ] = await Promise.all([
    sb.from('profiles').select('*', { count: 'exact', head: true }),

    sb.from('profiles').select('*', { count: 'exact', head: true })
      .in('plano', ['pro', 'anual', 'mensal'])
      .or(`plano_expira_em.is.null,plano_expira_em.gt.${new Date().toISOString()}`),

    sb.from('profiles').select('*', { count: 'exact', head: true })
      .eq('banned', true),

    sb.from('profiles').select('*', { count: 'exact', head: true })
      .not('telefone', 'is', null)
      .not('cep', 'is', null)
      .eq('aceitou_termos', true)
      .eq('aceitou_privacidade', true),

    sb.from('anuncios').select('*',  { count: 'exact', head: true }),
    sb.from('propostas').select('*', { count: 'exact', head: true }),
    sb.from('coladas').select('*',   { count: 'exact', head: true }),

    sb.from('profiles').select('*', { count: 'exact', head: true })
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ])

  const total = totalUsers ?? 0
  const pro   = totalPro   ?? 0

  const data: StatsData = {
    totalUsers:       total,
    totalPro:         pro,
    totalFree:        total - pro,
    bannedUsers:      totalBanned    ?? 0,
    completeProfiles: totalComplete  ?? 0,
    totalAnuncios:    totalAnuncios  ?? 0,
    totalPropostas:   totalPropostas ?? 0,
    totalColadas:     totalColadas   ?? 0,
    totalPedidos:     0,
    onlineHoje:       onlineHoje     ?? 0,
  }

  // Armazena no cache
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS }

  return NextResponse.json(data)
}
