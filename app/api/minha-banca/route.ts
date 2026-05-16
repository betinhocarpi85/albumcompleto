import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function geocode(endereco: string, cidade: string, uf: string) {
  try {
    const q   = encodeURIComponent(`${endereco}, ${cidade}, ${uf}, Brasil`)
    const geo = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'completando.com.br/1.0' } }
    ).then(r => r.json())
    if (geo?.[0]) return { lat: parseFloat(geo[0].lat), lng: parseFloat(geo[0].lon) }
  } catch { /* sem coords */ }
  return { lat: null, lng: null }
}

function gerarSlug(nome: string, id: string) {
  const base = nome
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${id.slice(0, 6)}`
}

// GET — retorna a banca do usuário logado
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createAdminClient()
  const { data } = await sb.from('bancas').select('*').eq('user_id', user.id).maybeSingle()
  return NextResponse.json({ banca: data ?? null })
}

// POST — cria banca para o usuário logado
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createAdminClient()

  // Verifica se já tem banca
  const { data: existente } = await sb.from('bancas').select('id').eq('user_id', user.id).maybeSingle()
  if (existente) return NextResponse.json({ error: 'Você já tem uma banca cadastrada.' }, { status: 409 })

  const body = await request.json()
  const { nome, responsavel, telefone, email, endereco, numero, bairro, cidade, uf, cep, horario, descricao, servicos } = body

  if (!nome || !endereco || !cidade || !uf) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 })
  }

  const enderecoCompleto = numero ? `${endereco}, ${numero}` : endereco
  const { lat, lng } = await geocode(enderecoCompleto, cidade, uf)

  // Gera ID temporário para slug único
  const tempId = crypto.randomUUID()
  const slug = gerarSlug(nome, tempId)

  const { data, error } = await sb.from('bancas').insert({
    id:          tempId,
    slug,
    user_id:     user.id,
    nome,
    responsavel: responsavel ?? null,
    telefone:    telefone    ?? null,
    email:       email       ?? null,
    endereco:    enderecoCompleto,
    bairro:      bairro      ?? null,
    cidade,
    uf,
    cep:         cep         ?? null,
    horario:     horario     ?? null,
    descricao:   descricao   ?? null,
    servicos:    servicos     ?? [],
    lat,
    lng,
    ativa:       false, // aguarda aprovação admin
    destaque:    false,
    total_trocas: 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ banca: data })
}

// PATCH — atualiza banca do usuário logado
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createAdminClient()
  const { data: banca } = await sb.from('bancas').select('id, endereco, cidade, uf').eq('user_id', user.id).maybeSingle()
  if (!banca) return NextResponse.json({ error: 'Banca não encontrada.' }, { status: 404 })

  const body = await request.json()
  const { endereco, numero, cidade, uf } = body

  let lat: number | null = null
  let lng: number | null = null
  const enderecoCompleto = endereco ? (numero ? `${endereco}, ${numero}` : endereco) : undefined

  if (enderecoCompleto && cidade && uf) {
    const coords = await geocode(enderecoCompleto, cidade, uf)
    lat = coords.lat; lng = coords.lng
  }

  const updateData: Record<string, unknown> = {
    ...body,
    updated_at: new Date().toISOString(),
  }
  if (enderecoCompleto) updateData.endereco = enderecoCompleto
  if (lat !== null) { updateData.lat = lat; updateData.lng = lng }
  delete updateData.numero // não é coluna do banco

  const { error } = await sb.from('bancas').update(updateData).eq('id', banca.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
