import { NextRequest, NextResponse } from 'next/server'
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
  cep:      string | null
  lat:      number
  lng:      number
  distanciaKm: number   // distância máxima entre os dois (pior caso)
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const propostaId = request.nextUrl.searchParams.get('proposta_id')

  const sb = createAdminClient()

  // Busca coordenadas do usuário atual
  const { data: myProfile } = await sb
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

  // ── Estratégia 1: minimiza soma das distâncias dos DOIS usuários ──────────
  if (propostaId && myProfile?.lat && myProfile?.lng) {
    // Descobre quem é a contraparte
    const { data: proposta } = await sb
      .from('propostas')
      .select('de_user_id, para_user_id')
      .eq('id', propostaId)
      .single()

    if (proposta) {
      const outraParteId = proposta.de_user_id === user.id
        ? proposta.para_user_id
        : proposta.de_user_id

      const { data: outraProfile } = await sb
        .from('profiles')
        .select('lat, lng')
        .eq('id', outraParteId)
        .single()

      if (outraProfile?.lat && outraProfile?.lng) {
        // Minimiza a soma: banca mais acessível para os dois
        let melhor: BancaMaisProxima | null = null
        let menorSoma = Infinity

        for (const b of bancas) {
          const d1 = haversineKm(myProfile.lat,         myProfile.lng,         b.lat, b.lng)
          const d2 = haversineKm(outraProfile.lat, outraProfile.lng, b.lat, b.lng)
          const soma = d1 + d2
          if (soma < menorSoma) {
            menorSoma = soma
            melhor = {
              ...b,
              // Mostra a maior distância (pior caso) para dar expectativa realista
              distanciaKm: Math.round(Math.max(d1, d2) * 10) / 10,
            }
          }
        }

        if (melhor) return NextResponse.json({ banca: melhor, estrategia: 'dois_usuarios' })
      }
    }
  }

  // ── Estratégia 2: banca mais próxima do usuário atual ────────────────────
  if (myProfile?.lat && myProfile?.lng) {
    let nearest: BancaMaisProxima | null = null
    let menorDist = Infinity

    for (const b of bancas) {
      const dist = haversineKm(myProfile.lat, myProfile.lng, b.lat, b.lng)
      if (dist < menorDist) {
        menorDist = dist
        nearest = { ...b, distanciaKm: Math.round(dist * 10) / 10 }
      }
    }

    if (nearest) return NextResponse.json({ banca: nearest, estrategia: 'usuario_atual' })
  }

  // ── Estratégia 3: fallback por cidade/uf do perfil ───────────────────────
  if (myProfile?.cidade) {
    const cidadeLower = myProfile.cidade.trim().toLowerCase()
    const ufLower     = (myProfile.uf ?? '').trim().toLowerCase()

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
