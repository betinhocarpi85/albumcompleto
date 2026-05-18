import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuth } from '@/lib/admin-auth'
import { processMapsUrl } from '@/lib/maps-utils'

function gerarSlug(nome: string, id: string) {
  const base = nome
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${id.slice(0, 6)}`
}

// ─── GET — retorna a banca do usuário logado ──────────────────────────────────
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createAdminClient()
  const { data } = await sb.from('bancas').select('*').eq('user_id', user.id).maybeSingle()
  return NextResponse.json({ banca: data ?? null })
}

// ─── POST — sugestão de banca (qualquer usuário logado) ──────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Faça login para sugerir uma banca.' }, { status: 401 })

  const sb = createAdminClient()

  const body = await request.json()
  const { nome, maps_url, telefone, horario, descricao, servicos } = body

  if (!nome?.trim())     return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })
  if (!maps_url?.trim()) return NextResponse.json({ error: 'Link do Google Maps é obrigatório.' }, { status: 400 })

  // Geocodifica primeiro para ter a cidade antes de checar duplicata
  const geo = await processMapsUrl(maps_url.trim())
  if (!geo) {
    return NextResponse.json({
      error: 'Não foi possível extrair as coordenadas deste link. Use "Compartilhar" → "Copiar link" no Google Maps.',
    }, { status: 422 })
  }

  // Verifica duplicata pelas coordenadas (mesmo link = mesmo local)
  const { data: existente } = await sb
    .from('bancas')
    .select('id, nome')
    .eq('lat', geo.lat)
    .eq('lng', geo.lng)
    .maybeSingle()

  if (existente) {
    return NextResponse.json({
      error: `Essa banca já está cadastrada (${existente.nome}). Use um link diferente se for outro local.`,
    }, { status: 409 })
  }

  const tempId = crypto.randomUUID()
  const slug   = gerarSlug(nome.trim(), tempId) // tempId garante slug único mesmo com nomes iguais

  const { data, error } = await sb.from('bancas').insert({
    id:           tempId,
    slug,
    user_id:      null,   // null evita conflito com unique constraint; autenticação já garante anti-spam
    nome:         nome.trim(),
    responsavel:  null,
    telefone:     telefone?.trim()  || null,
    email:        null,
    endereco:     geo.endereco,
    bairro:       geo.bairro,
    cidade:       geo.cidade,
    uf:           geo.uf,
    cep:          geo.cep,
    horario:      horario?.trim()   || null,
    descricao:    descricao?.trim() || null,
    servicos:     servicos          ?? [],
    lat:          geo.lat,
    lng:          geo.lng,
    ativa:        false,
    destaque:     false,
    total_trocas: 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ banca: data })
}

// ─── PATCH — atualiza banca (somente admin) ──────────────────────────────────
export async function PATCH(request: NextRequest) {
  if (!(await isAdminAuth())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const sb = createAdminClient()

  const body = await request.json()
  const { id: bancaId, nome, maps_url, telefone, horario, descricao, servicos } = body
  if (!bancaId) return NextResponse.json({ error: 'id da banca é obrigatório.' }, { status: 400 })

  const { data: banca } = await sb.from('bancas').select('id').eq('id', bancaId).maybeSingle()
  if (!banca) return NextResponse.json({ error: 'Banca não encontrada.' }, { status: 404 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (nome      !== undefined) update.nome      = nome?.trim()     || null
  if (telefone  !== undefined) update.telefone  = telefone?.trim() || null
  if (horario   !== undefined) update.horario   = horario?.trim()  || null
  if (descricao !== undefined) update.descricao = descricao?.trim()|| null
  if (servicos  !== undefined) update.servicos  = servicos

  if (maps_url?.trim()) {
    const geo = await processMapsUrl(maps_url.trim())
    if (!geo) return NextResponse.json({ error: 'Não foi possível extrair as coordenadas deste link.' }, { status: 422 })
    Object.assign(update, geo)
  }

  const { error } = await sb.from('bancas').update(update).eq('id', banca.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
