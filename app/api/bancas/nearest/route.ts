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

  // Busca lat/lng do usuário
  const { data: profile } = await sb
    .from('profiles')
    .select('lat, lng')
    .eq('id', user.id)
    .single()

  if (!profile?.lat || !profile?.lng) {
    return NextResponse.json({ banca: null, motivo: 'sem_localizacao' })
  }

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

  // Encontra a banca mais próxima via Haversine
  let nearest: BancaMaisProxima | null = null
  let menorDist = Infinity

  for (const b of bancas) {
    const dist = haversineKm(profile.lat, profile.lng, b.lat, b.lng)
    if (dist < menorDist) {
      menorDist = dist
      nearest = { ...b, distanciaKm: Math.round(dist * 10) / 10 }
    }
  }

  return NextResponse.json({ banca: nearest })
}
