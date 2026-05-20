import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuth } from '@/lib/admin-auth'
import { processMapsUrl } from '@/lib/maps-utils'
import crypto from 'crypto'

function gerarSlug(nome: string) {
  const base = nome
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const hash = crypto.randomBytes(3).toString('hex')
  return `${base}-${hash}`
}

// GET — lista pública de bancas ativas
export async function GET(request: NextRequest) {
  const sb  = createAdminClient()
  const { searchParams } = request.nextUrl
  const uf   = searchParams.get('uf')   ?? ''
  const cidade = searchParams.get('cidade') ?? ''
  const todas  = searchParams.get('todas') === '1' // admin: inclui inativas

  // todas=1 expõe bancas inativas — requer autenticação admin
  if (todas && !await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Para o admin: busca em batches de 1000 para superar o max_rows do PostgREST
  if (todas) {
    const BATCH = 1000
    let all: unknown[] = []
    let from = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data, error } = await sb
        .from('bancas')
        .select('*')
        .order('destaque', { ascending: false })
        .order('nome')
        .range(from, from + BATCH - 1)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      all = all.concat(data ?? [])
      if (!data || data.length < BATCH) break
      from += BATCH
    }
    return NextResponse.json({ bancas: all, total: all.length })
  }

  let query = sb.from('bancas').select('*').order('destaque', { ascending: false }).order('nome')
  query = query.eq('ativa', true)
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

  if (!body.nome?.trim())     return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })
  if (!body.maps_url?.trim()) return NextResponse.json({ error: 'Link do Google Maps é obrigatório.' }, { status: 400 })

  const geo = await processMapsUrl(body.maps_url.trim())
  if (!geo) return NextResponse.json({ error: 'Não foi possível extrair coordenadas deste link.' }, { status: 422 })

  // Verifica duplicata pelas coordenadas (mesmo link = mesmo local)
  const { data: existente } = await sb.from('bancas').select('id, nome').eq('lat', geo.lat).eq('lng', geo.lng).maybeSingle()
  if (existente) return NextResponse.json({ error: `Essa banca já está cadastrada (${existente.nome}).` }, { status: 409 })

  const slug = gerarSlug(body.nome.trim())

  const { data, error } = await sb.from('bancas').insert({
    slug,
    nome:        body.nome.trim(),
    responsavel: body.responsavel ?? null,
    telefone:    body.telefone    ?? null,
    email:       body.email       ?? null,
    endereco:    geo.endereco,
    bairro:      geo.bairro,
    cidade:      geo.cidade,
    uf:          geo.uf,
    cep:         geo.cep,
    lat:         geo.lat,
    lng:         geo.lng,
    horario:     body.horario     ?? null,
    descricao:   body.descricao   ?? null,
    ativa:       body.ativa       ?? true,
    destaque:    body.destaque    ?? false,
    total_trocas: 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ banca: data })
}
