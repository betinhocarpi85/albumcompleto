import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuth } from '@/lib/admin-auth'

// GET — lista pública de bancas ativas
export async function GET(request: NextRequest) {
  const sb  = createAdminClient()
  const { searchParams } = request.nextUrl
  const uf   = searchParams.get('uf')   ?? ''
  const cidade = searchParams.get('cidade') ?? ''
  const todas  = searchParams.get('todas') === '1' // admin: inclui inativas

  let query = sb.from('bancas').select('*').order('destaque', { ascending: false }).order('nome')
  if (!todas) query = query.eq('ativa', true)
  if (uf)     query = query.eq('uf', uf)
  if (cidade) query = query.ilike('cidade', `%${cidade}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bancas: data ?? [] })
}

// POST — cria nova banca (admin)
export async function POST(request: NextRequest) {
  if (!await isAdminAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const sb   = createAdminClient()

  // Auto-geocode via Nominatim se lat/lng não fornecidos
  let { lat, lng } = body
  if ((!lat || !lng) && body.endereco && body.cidade) {
    try {
      const q   = encodeURIComponent(`${body.endereco}, ${body.cidade}, ${body.uf}, Brasil`)
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
        headers: { 'User-Agent': 'completando.com.br/1.0' }
      }).then(r => r.json())
      if (geo?.[0]) { lat = parseFloat(geo[0].lat); lng = parseFloat(geo[0].lon) }
    } catch { /* usa sem coords */ }
  }

  // Gera slug a partir do nome
  const slug = body.slug || body.nome
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data, error } = await sb.from('bancas').insert({
    slug, lat, lng,
    nome:        body.nome,
    responsavel: body.responsavel ?? null,
    telefone:    body.telefone    ?? null,
    email:       body.email       ?? null,
    endereco:    body.endereco,
    bairro:      body.bairro      ?? null,
    cidade:      body.cidade,
    uf:          body.uf,
    cep:         body.cep         ?? null,
    horario:     body.horario     ?? null,
    foto_url:    body.foto_url    ?? null,
    descricao:   body.descricao   ?? null,
    ativa:       body.ativa       ?? true,
    destaque:    body.destaque    ?? false,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ banca: data })
}
