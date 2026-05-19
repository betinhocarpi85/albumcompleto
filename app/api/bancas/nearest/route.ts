import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { haversineKm } from '@/lib/maps-utils'

export interface BancaMaisProxima {
  id:       string
  slug:     string
  nome:     string
  endereco: string
  cidade:   string
  uf:       string
  cep:      string | null   // URL do Maps (campo reutilizado)
  lat:      number
  lng:      number
  distanciaKm: number
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createAdminClient()

  // Busca dados do perfil
  const { data: profile } = await sb
    .from('profiles')
    .select('lat, lng, cidade, uf')
    .eq('id', user.id)
    .single()

  // Busca todas as bancas ativas com coordenadas
  const { data: bancas } = await sb
    .from('bancas')
    .select('id, slug, nome, endereco, cidade, uf, cep, lat, lng')
    .eq('ativa', true)
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (!bancas || bancas.length === 0) {
    return NextResponse.json({ banca: null, motivo: 'sem_bancas' })
  }

  // ── Estratégia 1: lat/lng exato (Haversine) ──────────────────────────────
  if (profile?.lat && profile?.lng) {
    let nearest: BancaMaisProxima | null = null
    let menorDist = Infinity

    for (const b of bancas) {
      const dist = haversineKm(profile.lat, profile.lng, b.lat, b.lng)
      if (dist < menorDist) {
        menorDist = dist
        nearest = { ...b, distanciaKm: Math.round(dist * 10) / 10 }
      }
    }

    if (nearest) return NextResponse.json({ banca: nearest })
  }

  // ── Estratégia 2: fallback por cidade/uf do perfil ───────────────────────
  if (profile?.cidade) {
    const cidadeLower = profile.cidade.trim().toLowerCase()
    const ufLower     = (profile.uf ?? '').trim().toLowerCase()

    // Tenta cidade + UF primeiro, depois só cidade
    const porCidade = bancas.find(b =>
      b.cidade.trim().toLowerCase() === cidadeLower &&
      (!ufLower || b.uf.trim().toLowerCase() === ufLower)
    ) ?? bancas.find(b =>
      b.cidade.trim().toLowerCase() === cidadeLower
    )

    if (porCidade) {
      return NextResponse.json({
        banca: { ...porCidade, distanciaKm: 0 },
        motivo: 'por_cidade',
      })
    }
  }

  return NextResponse.json({ banca: null, motivo: 'sem_localizacao' })
}
