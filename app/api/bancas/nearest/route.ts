import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { haversineKm, geocodeCep } from '@/lib/maps-utils'

export interface BancaMaisProxima {
  id:       string
  slug:     string
  nome:     string
  endereco: string
  cidade:   string
  uf:       string
  cep:      string | null
  lat:      number
  lng:      number
  distanciaKm: number
}

/** Retorna lat/lng do perfil, ou tenta geocodificar o CEP se estiver vazio.
 *  Se bem-sucedido, salva no perfil para as próximas chamadas. */
async function resolveCoords(
  sb: ReturnType<typeof createAdminClient>,
  profile: { id?: string; lat?: number | null; lng?: number | null; cep?: string | null },
): Promise<{ lat: number; lng: number } | null> {
  if (profile.lat && profile.lng) return { lat: profile.lat, lng: profile.lng }
  if (!profile.cep) return null

  const coords = await geocodeCep(profile.cep).catch(() => null)
  if (!coords) return null

  // Salva para não repetir o geocode na próxima chamada
  if (profile.id) {
    sb.from('profiles')
      .update({ lat: coords.lat, lng: coords.lng })
      .eq('id', profile.id)
      .then(({ error }) => { if (error) console.error('[bancas/nearest] geocode save:', error.message) })
  }

  return coords
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const propostaId = request.nextUrl.searchParams.get('proposta_id')

  const sb = createAdminClient()

  // Busca perfil do usuário atual (com CEP para geocode on-the-fly)
  const { data: myProfileRaw } = await sb
    .from('profiles')
    .select('lat, lng, cidade, uf, cep')
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

  // Resolve lat/lng do usuário atual (tenta geocodificar CEP se necessário)
  const myCoords = myProfileRaw
    ? await resolveCoords(sb, { id: user.id, ...myProfileRaw })
    : null

  // ── Estratégia 1: minimiza soma das distâncias dos DOIS usuários ──────────
  if (propostaId && myCoords) {
    const { data: proposta } = await sb
      .from('propostas')
      .select('de_user_id, para_user_id')
      .eq('id', propostaId)
      .single()

    if (proposta) {
      const outraParteId = proposta.de_user_id === user.id
        ? proposta.para_user_id
        : proposta.de_user_id

      const { data: outraProfileRaw } = await sb
        .from('profiles')
        .select('lat, lng, cep')
        .eq('id', outraParteId)
        .single()

      const outraCoords = outraProfileRaw
        ? await resolveCoords(sb, { id: outraParteId, ...outraProfileRaw })
        : null

      if (outraCoords) {
        let melhor: BancaMaisProxima | null = null
        let menorSoma = Infinity

        for (const b of bancas) {
          const d1 = haversineKm(myCoords.lat,    myCoords.lng,    b.lat, b.lng)
          const d2 = haversineKm(outraCoords.lat, outraCoords.lng, b.lat, b.lng)
          const soma = d1 + d2
          if (soma < menorSoma) {
            menorSoma = soma
            melhor = {
              ...b,
              distanciaKm: Math.round(Math.max(d1, d2) * 10) / 10,
            }
          }
        }

        if (melhor) return NextResponse.json({ banca: melhor, estrategia: 'dois_usuarios' })
      }
    }
  }

  // ── Estratégia 2: banca mais próxima do usuário atual ────────────────────
  if (myCoords) {
    let nearest: BancaMaisProxima | null = null
    let menorDist = Infinity

    for (const b of bancas) {
      const dist = haversineKm(myCoords.lat, myCoords.lng, b.lat, b.lng)
      if (dist < menorDist) {
        menorDist = dist
        nearest = { ...b, distanciaKm: Math.round(dist * 10) / 10 }
      }
    }

    if (nearest) return NextResponse.json({ banca: nearest, estrategia: 'usuario_atual' })
  }

  // ── Estratégia 3: fallback por cidade/uf do perfil ───────────────────────
  if (myProfileRaw?.cidade) {
    const cidadeLower = myProfileRaw.cidade.trim().toLowerCase()
    const ufLower     = (myProfileRaw.uf ?? '').trim().toLowerCase()

    const porCidade = bancas.find(b =>
      b.cidade.trim().toLowerCase() === cidadeLower &&
      (!ufLower || b.uf.trim().toLowerCase() === ufLower)
    ) ?? bancas.find(b =>
      b.cidade.trim().toLowerCase() === cidadeLower
    )

    if (porCidade) {
      return NextResponse.json({
        banca: { ...porCidade, distanciaKm: 0 },
        estrategia: 'por_cidade',
      })
    }
  }

  return NextResponse.json({ banca: null, motivo: 'sem_localizacao' })
}
