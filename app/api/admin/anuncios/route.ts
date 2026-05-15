import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  if (!await isAdminAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25')))
  const tipo   = searchParams.get('tipo') ?? 'todos'
  const album  = searchParams.get('album') ?? ''
  const user   = searchParams.get('user') ?? ''  // filter by user nome
  const offset = (page - 1) * limit

  const sb = createAdminClient()

  // If filtering by user name, find matching user IDs first
  let userIds: string[] | null = null
  if (user) {
    const { data: matchProfiles } = await sb.from('profiles')
      .select('id').ilike('nome', `%${user}%`).limit(100)
    userIds = (matchProfiles ?? []).map(p => p.id)
    if (userIds.length === 0) {
      return NextResponse.json({ anuncios: [], total: 0, page, totalPages: 0 })
    }
  }

  let query = sb.from('anuncios').select('*', { count: 'exact' })
  if (tipo !== 'todos') query = query.eq('tipo', tipo)
  if (album) query = query.ilike('album_id', `%${album}%`)
  if (userIds) query = query.in('user_id', userIds)
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data: anuncios, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get user names for current page
  const ids = [...new Set((anuncios ?? []).map(a => a.user_id))]
  const { data: profiles } = ids.length > 0
    ? await sb.from('profiles').select('id, nome').in('id', ids)
    : { data: [] }
  const nameMap = new Map((profiles ?? []).map(p => [p.id, p.nome ?? '']))

  const result = (anuncios ?? []).map(a => ({
    ...a,
    user_nome: nameMap.get(a.user_id) ?? '',
  }))

  const total = count ?? 0
  return NextResponse.json({ anuncios: result, total, page, totalPages: Math.ceil(total / limit) })
}

export async function DELETE(request: Request) {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { anuncioId } = await request.json()
  if (!anuncioId) return NextResponse.json({ error: 'anuncioId obrigatório' }, { status: 400 })

  const sb = createAdminClient()

  const { error } = await sb.from('anuncios').delete().eq('id', anuncioId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await sb.from('admin_logs').insert({
    action: 'delete_anuncio',
    target_id: String(anuncioId),
    details: 'Anúncio deletado pelo admin',
  })

  return NextResponse.json({ ok: true })
}
