import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuth } from '@/lib/admin-auth'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function POST() {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const sb = createAdminClient()

  // Busca todas as bancas sem coordenadas
  const { data: bancas, error } = await sb
    .from('bancas')
    .select('id, endereco, cidade, uf')
    .or('lat.is.null,lng.is.null')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!bancas || bancas.length === 0) {
    return NextResponse.json({ ok: true, atualizadas: 0, mensagem: 'Todas as bancas já têm coordenadas.' })
  }

  let atualizadas = 0
  const erros: string[] = []

  for (const b of bancas) {
    try {
      const q   = encodeURIComponent(`${b.endereco}, ${b.cidade}, ${b.uf}, Brasil`)
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        { headers: { 'User-Agent': 'completando.com.br/1.0' } }
      ).then(r => r.json())

      if (geo?.[0]) {
        await sb.from('bancas').update({
          lat: parseFloat(geo[0].lat),
          lng: parseFloat(geo[0].lon),
          updated_at: new Date().toISOString(),
        }).eq('id', b.id)
        atualizadas++
      } else {
        erros.push(`${b.endereco}, ${b.cidade} — não encontrado`)
      }
    } catch {
      erros.push(`${b.endereco}, ${b.cidade} — erro de rede`)
    }

    // Respeita o limite do Nominatim: 1 req/seg
    await sleep(1100)
  }

  return NextResponse.json({
    ok: true,
    total: bancas.length,
    atualizadas,
    erros,
  })
}
