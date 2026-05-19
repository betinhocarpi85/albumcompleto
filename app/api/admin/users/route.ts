import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  if (!await isAdminAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25')))
  const search   = searchParams.get('search')   ?? ''
  const plano    = searchParams.get('plano')    ?? 'todos'   // 'todos'|'pro'|'free'
  const uf       = searchParams.get('uf')       ?? ''
  const complete = searchParams.get('complete') ?? 'todos'   // 'todos'|'completo'|'incompleto'
  const banned   = searchParams.get('banned')   ?? 'todos'   // 'todos'|'ativos'|'banidos'
  const sortBy   = searchParams.get('sortBy')   ?? 'updated_at'
  const sortDir  = searchParams.get('sortDir')  ?? 'desc'

  const sb     = createAdminClient()
  const offset = (page - 1) * limit

  // ── Query na tabela profiles ────────────────────────────────────────────────
  // email/last_sign_in_at/provider são desnormalizados via trigger (sem getUserById)
  // Usamos select('*') para manter compatibilidade com o tipo gerado pelo Supabase;
  // as colunas novas existem em runtime após a migration e são acessadas via cast.
  let query = sb.from('profiles').select('*', { count: 'exact' })

  // Filtros
  if (uf)                   query = query.eq('uf', uf)
  if (banned === 'banidos') query = query.eq('banned', true)
  if (banned === 'ativos')  query = query.eq('banned', false)
  if (complete === 'completo')
    query = query.not('telefone', 'is', null).not('cep', 'is', null)
      .eq('aceitou_termos', true).eq('aceitou_privacidade', true)
  if (complete === 'incompleto')
    query = query.or('telefone.is.null,cep.is.null')
  if (plano === 'pro')
    query = query.in('plano', ['pro', 'anual', 'mensal'])
  if (plano === 'free')
    query = query.or('plano.eq.free,plano.is.null')

  // Busca textual — usa índices trigram (nome, email, cidade, bairro)
  if (search) {
    query = query.or(
      `nome.ilike.%${search}%,email.ilike.%${search}%,` +
      `cidade.ilike.%${search}%,bairro.ilike.%${search}%`
    )
  }

  // Ordenação
  const validSorts = ['nome', 'email', 'cidade', 'plano', 'updated_at', 'created_at', 'last_sign_in_at']
  const dbSort = validSorts.includes(sortBy) ? sortBy : 'updated_at'
  query = query
    .order(dbSort, { ascending: sortDir === 'asc' })
    .range(offset, offset + limit - 1)

  const { data: profiles, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Monta resposta sem nenhuma chamada extra de auth ───────────────────────
  // As colunas novas (email, last_sign_in_at, provider) existem em runtime após a
  // migration mas não estão nos tipos gerados ainda — acessamos via cast para Record.
  const users = (profiles ?? []).map(p => {
    const row = p as typeof p & {
      email?:           string | null
      last_sign_in_at?: string | null
      provider?:        string | null
      created_at?:      string | null
    }
    const plano_expira  = p.plano_expira_em ?? null
    const planoExpirado = p.plano === 'pro' && plano_expira && new Date(plano_expira) < new Date()
    return {
      id:                  p.id,
      email:               row.email           ?? '',
      created_at:          row.created_at      ?? p.updated_at,
      last_sign_in:        row.last_sign_in_at ?? null,
      provider:            row.provider        ?? 'email',
      nome:                p.nome                 ?? '',
      telefone:            p.telefone             ?? '',
      bairro:              p.bairro               ?? '',
      cidade:              p.cidade               ?? '',
      uf:                  p.uf                   ?? '',
      cep:                 p.cep                  ?? '',
      aceitou_termos:      p.aceitou_termos       ?? false,
      aceitou_privacidade: p.aceitou_privacidade  ?? false,
      profile_complete:    !!(p.telefone && p.cep && p.aceitou_termos && p.aceitou_privacidade),
      banned:              p.banned               ?? false,
      banned_at:           p.banned_at            ?? null,
      banned_reason:       p.banned_reason        ?? null,
      plano:               p.plano                ?? 'free',
      plano_expira,
      plano_expirado:      planoExpirado          ?? false,
    }
  })

  const total = count ?? 0
  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) })
}

export async function DELETE(request: Request) {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const sb = createAdminClient()

  // Deleta o auth user primeiro — se falhar, não apagamos os dados do banco
  const { error } = await sb.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auth user deletado com sucesso — limpa os dados do banco
  await Promise.all([
    sb.from('anuncios').delete().eq('user_id', userId),
    sb.from('coladas').delete().eq('user_id', userId),
    sb.from('pedidos').delete().eq('user_id', userId),
    sb.from('propostas').delete().or(`de_user_id.eq.${userId},para_user_id.eq.${userId}`),
    sb.from('user_preferences').delete().eq('user_id', userId),
    sb.from('profiles').delete().eq('id', userId),
  ])

  await sb.from('admin_logs').insert({
    action:    'delete_user',
    target_id: userId,
    details:   'Usuário deletado pelo admin',
  })

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { userId, nome, email, telefone } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const sb = createAdminClient()

  const profileUpdates: Record<string, unknown> = {}
  if (nome     !== undefined) profileUpdates.nome     = nome
  if (telefone !== undefined) profileUpdates.telefone = telefone
  // email é sincronizado via trigger ao atualizar auth.users

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await sb.from('profiles').update(profileUpdates).eq('id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (email) {
    const { error } = await sb.auth.admin.updateUserById(userId, { email })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Trigger `trg_sync_profile_from_auth` atualiza profiles.email automaticamente
  }

  await sb.from('admin_logs').insert({
    action:    'edit_user',
    target_id: userId,
    details:   `Editado: ${JSON.stringify({ nome, email, telefone })}`,
  })

  return NextResponse.json({ ok: true })
}
