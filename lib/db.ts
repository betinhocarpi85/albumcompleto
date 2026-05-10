/**
 * lib/db.ts
 * Camada de acesso ao Supabase. Mesma API pública de lib/store.ts,
 * mas async e persistida no banco — chamada nos useEffect das páginas.
 */

import { createClient } from '@/lib/supabase/client'
import type { AlbumId } from '@/data/albums-registry'
import type { AnuncioItem, Pedido, PreferenciaEntrega, UserProfile } from '@/lib/store'
import type { MatchResult } from '@/lib/match-engine'

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function getSession() {
  const sb = createClient()
  const { data: { session } } = await sb.auth.getSession()
  return session
}

export async function getUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.id ?? null
}

export async function signIn(email: string, password: string) {
  const sb = createClient()
  return sb.auth.signInWithPassword({ email, password })
}

export async function signUp(
  email: string,
  password: string,
  metadata?: Record<string, unknown>
) {
  const sb = createClient()
  return sb.auth.signUp({
    email,
    password,
    options: { data: metadata },
  })
}

export async function signInWithMagicLink(
  email: string,
  metadata?: Record<string, string | boolean>
) {
  const sb = createClient()
  return sb.auth.signInWithOtp({
    email,
    options: {
      data: metadata,
      emailRedirectTo: `${location.origin}/auth/callback`,
    },
  })
}

export async function signInWithGoogle() {
  const sb = createClient()
  return sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}/auth/callback` },
  })
}

export async function signOut() {
  const sb = createClient()
  return sb.auth.signOut()
}

export async function dbUpdatePassword(novaSenha: string): Promise<{ error: string | null }> {
  const sb = createClient()
  const { error } = await sb.auth.updateUser({ password: novaSenha })
  return { error: error?.message ?? null }
}

export async function dbResetPassword(email: string): Promise<{ error: string | null }> {
  const sb = createClient()
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset`,
  })
  return { error: error?.message ?? null }
}

// ─── Perfil ───────────────────────────────────────────────────────────────────

export async function dbGetProfile(): Promise<Partial<UserProfile>> {
  const uid = await getUserId()
  if (!uid) return {}
  const sb = createClient()
  const { data } = await sb
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single()
  if (!data) return {}
  return {
    nome:               data.nome               ?? '',
    cpf:                data.cpf                ?? '',
    dataNascimento:     data.data_nascimento    ?? '',
    maior18:            data.maior_18           ?? false,
    aceitouTermos:      data.aceitou_termos     ?? false,
    aceitouPrivacidade: data.aceitou_privacidade ?? false,
    cep:                data.cep                ?? '',
    bairro:             data.bairro             ?? '',
    cidade:             data.cidade             ?? '',
    uf:                 data.uf                 ?? '',
    logradouro:         data.logradouro         ?? '',
    numero:             data.numero             ?? '',
    complemento:        data.complemento        ?? '',
    telefone:           data.telefone           ?? '',
  }
}

export async function dbSaveProfile(p: Partial<UserProfile>) {
  const uid = await getUserId()
  if (!uid) return
  const sb = createClient()
  const { error } = await sb.from('profiles').upsert({
    id:                  uid,
    nome:                p.nome,
    cpf:                 p.cpf,
    data_nascimento:     p.dataNascimento,
    maior_18:            p.maior18,
    aceitou_termos:      p.aceitouTermos,
    aceitou_privacidade: p.aceitouPrivacidade,
    cep:                 p.cep,
    bairro:              p.bairro,
    cidade:              p.cidade,
    uf:                  p.uf,
    logradouro:          p.logradouro,
    numero:              p.numero,
    complemento:         p.complemento,
    telefone:            p.telefone,
    updated_at:          new Date().toISOString(),
  })
  if (error) console.error('[dbSaveProfile] erro ao salvar perfil:', error.message)
}

// ─── Coladas ──────────────────────────────────────────────────────────────────

/** Toggle rápido — single row insert/delete (sem diff completo) */
export async function dbColaSticker(albumId: AlbumId, stickerId: string): Promise<void> {
  const uid = await getUserId()
  if (!uid) return
  const sb = createClient()
  await sb.from('coladas').upsert({ user_id: uid, album_id: albumId, sticker_id: stickerId })
}

export async function dbDescolaSticker(albumId: AlbumId, stickerId: string): Promise<void> {
  const uid = await getUserId()
  if (!uid) return
  const sb = createClient()
  await sb.from('coladas').delete()
    .eq('user_id', uid).eq('album_id', albumId).eq('sticker_id', stickerId)
}

export async function dbGetColadas(albumId: AlbumId): Promise<string[]> {
  const uid = await getUserId()
  if (!uid) return []
  const sb = createClient()
  const { data } = await sb
    .from('coladas')
    .select('sticker_id')
    .eq('user_id', uid)
    .eq('album_id', albumId)
  return (data ?? []).map(r => r.sticker_id)
}

export async function dbSaveColadas(albumId: AlbumId, ids: string[]): Promise<void> {
  const uid = await getUserId()
  if (!uid) return
  const sb = createClient()

  // 1. Busca coladas atuais
  const { data: existing } = await sb
    .from('coladas')
    .select('sticker_id')
    .eq('user_id', uid)
    .eq('album_id', albumId)

  const existingSet = new Set((existing ?? []).map(r => r.sticker_id))
  const newSet      = new Set(ids)

  // 2. Insere as que não existem
  const toInsert = ids
    .filter(sid => !existingSet.has(sid))
    .map(sid => ({ user_id: uid, album_id: albumId, sticker_id: sid }))

  if (toInsert.length > 0) {
    await sb.from('coladas').insert(toInsert)
  }

  // 3. Remove as que foram desmarcadas
  const toDelete = [...existingSet].filter(sid => !newSet.has(sid))
  if (toDelete.length > 0) {
    await sb
      .from('coladas')
      .delete()
      .eq('user_id', uid)
      .eq('album_id', albumId)
      .in('sticker_id', toDelete)
  }
}

// ─── Anúncios ─────────────────────────────────────────────────────────────────

export async function dbGetAnuncios(
  albumId: AlbumId,
  tipo: 'tenho' | 'preciso'
): Promise<AnuncioItem[]> {
  const uid = await getUserId()
  if (!uid) return []
  const sb = createClient()
  const { data } = await sb
    .from('anuncios')
    .select('*')
    .eq('user_id', uid)
    .eq('album_id', albumId)
    .eq('tipo', tipo)
  return (data ?? []).map(r => ({
    sid:   r.sid,
    gNum:  r.g_num ?? r.sid,
    nome:  r.nome ?? '',
    qty:   r.qty,
    tipo:  r.sticker_tipo ?? 'normal',
    preco: r.preco ?? undefined,
  }))
}

export async function dbSaveAnuncios(
  albumId: AlbumId,
  tipo: 'tenho' | 'preciso',
  items: AnuncioItem[]
): Promise<void> {
  const uid = await getUserId()
  if (!uid) return
  const sb = createClient()

  // Substitui todos os anúncios do tipo
  await sb
    .from('anuncios')
    .delete()
    .eq('user_id', uid)
    .eq('album_id', albumId)
    .eq('tipo', tipo)

  if (items.length === 0) return

  await sb.from('anuncios').insert(
    items.map(a => ({
      user_id:      uid,
      tipo,
      album_id:     albumId,
      sid:          a.sid,
      g_num:        typeof a.gNum === 'number' ? a.gNum : null,
      nome:         a.nome,
      qty:          a.qty,
      sticker_tipo: a.tipo,
      preco:        a.preco ?? null,
      updated_at:   new Date().toISOString(),
    }))
  )
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export async function dbGetPedidos(): Promise<Pedido[]> {
  const uid = await getUserId()
  if (!uid) return []
  const sb = createClient()
  const { data } = await sb
    .from('pedidos')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => ({
    id:               r.id,
    data:             r.data,
    tipo:             r.tipo,
    status:           r.status,
    contraparte:      r.contraparte,
    fig:              r.fig,
    valor:            r.valor ?? undefined,
    enderecoEntrega:  r.endereco_entrega ?? undefined,
  }))
}

export async function dbAddPedido(p: Pedido): Promise<void> {
  const uid = await getUserId()
  if (!uid) return
  const sb = createClient()
  await sb.from('pedidos').insert({
    id:               p.id,
    user_id:          uid,
    data:             p.data,
    tipo:             p.tipo,
    status:           p.status,
    contraparte:      p.contraparte,
    fig:              p.fig,
    valor:            p.valor ?? null,
    endereco_entrega: p.enderecoEntrega ?? null,
  })
}

export async function dbUpdatePedidoStatus(id: string, status: Pedido['status']): Promise<void> {
  const uid = await getUserId()
  if (!uid) return
  const sb = createClient()
  await sb.from('pedidos').update({ status }).eq('id', id).eq('user_id', uid)
}

// ─── Matches ─────────────────────────────────────────────────────────────────

// Tipos re-exportados de match-engine para consumidores que importam só de db.ts
export type { MatchTroca, MatchVenda, MatchDoacao, MatchResult } from '@/lib/match-engine'

export async function dbGetMatches(albumId: AlbumId): Promise<MatchResult> {
  const uid = await getUserId()
  if (!uid) return { trocas: [], vendas: [], doacoes: [] }

  // Chama API server-side que usa admin client (bypassa RLS)
  const res = await fetch(`/api/matches?albumId=${encodeURIComponent(albumId)}`, {
    credentials: 'include',
  })
  if (!res.ok) return { trocas: [], vendas: [], doacoes: [] }
  return res.json() as Promise<MatchResult>
}


// ─── Preferências ─────────────────────────────────────────────────────────────

export async function dbGetActiveAlbums(): Promise<AlbumId[]> {
  const uid = await getUserId()
  if (!uid) return []
  const sb = createClient()
  const { data } = await sb
    .from('user_preferences')
    .select('active_albums')
    .eq('user_id', uid)
    .single()
  return (data?.active_albums ?? []) as AlbumId[]
}

export async function dbSaveActiveAlbums(ids: AlbumId[]): Promise<void> {
  const uid = await getUserId()
  if (!uid) return
  const sb = createClient()
  await sb.from('user_preferences').upsert({
    user_id:       uid,
    active_albums: ids,
    updated_at:    new Date().toISOString(),
  })
}

// ─── Propostas ────────────────────────────────────────────────────────────────

export type TipoProposta = 'troca' | 'compra'

/** Proposta enriquecida com dados de perfil da contraparte */
export interface PropostaComPerfil {
  id:           string
  de_user_id:   string
  para_user_id: string
  /** Nome da contraparte (de quem enviou, para recebidas; de quem vai receber, para enviadas) */
  contraparte_nome:       string
  contraparte_localidade: string
  eu_ofereco:   number[]
  eu_recebo:    number[]
  tipo:         TipoProposta
  album_id:     string
  status:       'pendente' | 'aceita' | 'recusada'
  created_at:   string
}

async function enrichPropostas(
  propostas: Record<string, unknown>[],
  profileIdField: 'de_user_id' | 'para_user_id'
): Promise<PropostaComPerfil[]> {
  if (propostas.length === 0) return []
  const sb = createClient()
  const ids = [...new Set(propostas.map(p => p[profileIdField] as string))]
  const { data: profiles } = await sb
    .from('profiles')
    .select('id, nome, bairro, cidade, uf')
    .in('id', ids)
  const pm = new Map((profiles ?? []).map(p => [p.id, p]))
  return propostas.map(p => {
    const pr = pm.get(p[profileIdField] as string)
    const partes = [pr?.bairro, pr?.cidade, pr?.uf].filter(Boolean)
    return {
      id:                     p.id as string,
      de_user_id:             p.de_user_id as string,
      para_user_id:           p.para_user_id as string,
      contraparte_nome:       pr?.nome ?? 'Usuário',
      contraparte_localidade: partes.join(', '),
      eu_ofereco:         (p.eu_ofereco  as number[]) ?? [],
      eu_recebo:          (p.eu_recebo   as number[]) ?? [],
      tipo:               (p.tipo as TipoProposta)    ?? 'troca',
      album_id:           (p.album_id as string)      ?? 'copa-2026',
      status:             p.status as 'pendente' | 'aceita' | 'recusada',
      created_at:         p.created_at as string,
    }
  })
}

export async function dbGetPropostasRecebidas(): Promise<PropostaComPerfil[]> {
  const uid = await getUserId()
  if (!uid) return []
  const sb = createClient()
  const { data } = await sb
    .from('propostas')
    .select('*')
    .eq('para_user_id', uid)
    .order('created_at', { ascending: false })
  return enrichPropostas((data ?? []) as Record<string, unknown>[], 'de_user_id')
}

export async function dbGetPropostasEnviadas(): Promise<PropostaComPerfil[]> {
  const uid = await getUserId()
  if (!uid) return []
  const sb = createClient()
  const { data } = await sb
    .from('propostas')
    .select('*')
    .eq('de_user_id', uid)
    .order('created_at', { ascending: false })
  return enrichPropostas((data ?? []) as Record<string, unknown>[], 'para_user_id')
}

export async function dbEnviarProposta(
  para_user_id: string,
  album_id: AlbumId,
  eu_ofereco: number[],
  eu_recebo: number[],
  tipo: TipoProposta
): Promise<{ error: string | null }> {
  const uid = await getUserId()
  if (!uid) return { error: 'Não autenticado' }
  const sb = createClient()
  const { error } = await sb.from('propostas').insert({
    de_user_id:   uid,
    para_user_id,
    album_id,
    eu_ofereco,
    eu_recebo,
    tipo,
    status:       'pendente',
  })
  return { error: error?.message ?? null }
}

export async function dbGetPhoneForProposta(proposta_id: string): Promise<string | null> {
  const sb = createClient()
  const { data } = await sb.rpc('get_phone_for_proposta', { p_proposta_id: proposta_id })
  return (data as string | null) ?? null
}

export async function dbUpdateProposta(
  id: string,
  patch: { status: 'aceita' | 'recusada' }
): Promise<void> {
  const sb = createClient()
  await sb.from('propostas').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
}

// ─── Plano ───────────────────────────────────────────────────────────────────

export async function dbGetPlano(): Promise<{ plano: 'free' | 'pro'; expira_em: string | null }> {
  const uid = await getUserId()
  if (!uid) return { plano: 'free', expira_em: null }
  const sb = createClient()
  const { data } = await sb.from('profiles').select('plano, plano_expira_em').eq('id', uid).single()
  const plano     = (data?.plano as 'free' | 'pro') ?? 'free'
  const expira_em = (data?.plano_expira_em as string | null) ?? null
  // Verifica expiração
  if (plano === 'pro' && expira_em && new Date(expira_em) < new Date()) {
    return { plano: 'free', expira_em: null }
  }
  return { plano, expira_em }
}

// ─── Trocas / Estatísticas ────────────────────────────────────────────────────

export async function dbGetTradeCount(userId: string): Promise<number> {
  // Só conta propostas onde AMBOS os usuários avaliaram (confirmação mútua)
  const sb = createClient()
  const { data } = await sb
    .from('avaliacoes')
    .select('proposta_id')
    .or(`de_user_id.eq.${userId},para_user_id.eq.${userId}`)

  if (!data || data.length === 0) return 0

  // Agrupa por proposta_id e conta as que têm 2 avaliações
  const counts = new Map<string, number>()
  for (const row of data) {
    counts.set(row.proposta_id, (counts.get(row.proposta_id) ?? 0) + 1)
  }
  return [...counts.values()].filter(n => n >= 2).length
}

export interface PublicProfileData {
  nome:        string
  localidade:  string
  tradeCount:  number
  ratingMedia: number | null
  ratingCount: number
}

export async function dbGetPublicProfile(userId: string): Promise<PublicProfileData> {
  const sb = createClient()
  const [profileRes, allAvalRes, ratingsRes] = await Promise.all([
    sb.from('profiles').select('nome, bairro, cidade, uf').eq('id', userId).single(),
    // Busca todas avaliações relacionadas ao usuário para calcular trocas mútuas
    sb.from('avaliacoes').select('proposta_id, de_user_id, para_user_id'),
    // Avaliações recebidas (para rating)
    sb.from('avaliacoes').select('nota').eq('para_user_id', userId),
  ])

  const p = profileRes.data

  // Trocas confirmadas = propostas com 2 avaliações envolvendo este usuário
  const allAval = allAvalRes.data ?? []
  const userAval = allAval.filter(a => a.de_user_id === userId || a.para_user_id === userId)
  const countByProposta = new Map<string, number>()
  for (const a of userAval) {
    countByProposta.set(a.proposta_id, (countByProposta.get(a.proposta_id) ?? 0) + 1)
  }
  const tradeCount = [...countByProposta.values()].filter(n => n >= 2).length

  const ratings = ratingsRes.data ?? []
  const ratingMedia = ratings.length > 0
    ? ratings.reduce((s, r) => s + (r.nota as number), 0) / ratings.length
    : null

  return {
    nome:        p?.nome ?? 'Usuário',
    localidade:  [p?.bairro, p?.cidade, p?.uf].filter(Boolean).join(', '),
    tradeCount,
    ratingMedia,
    ratingCount: ratings.length,
  }
}

export async function dbAvaliar(
  proposta_id:  string,
  para_user_id: string,
  nota:         number,
  comentario?:  string
): Promise<{ error: string | null }> {
  const uid = await getUserId()
  if (!uid) return { error: 'Não autenticado' }
  const sb = createClient()
  const { error } = await sb.from('avaliacoes').insert({
    de_user_id:  uid,
    para_user_id,
    proposta_id,
    nota,
    comentario: comentario || null,
  })
  return { error: error?.message ?? null }
}

export async function dbJaAvaliou(proposta_id: string): Promise<boolean> {
  const uid = await getUserId()
  if (!uid) return false
  const sb = createClient()
  const { count } = await sb
    .from('avaliacoes')
    .select('id', { count: 'exact', head: true })
    .eq('de_user_id', uid)
    .eq('proposta_id', proposta_id)
  return (count ?? 0) > 0
}

// ─── Conta ────────────────────────────────────────────────────────────────────

export async function dbDeleteAccount(): Promise<{ error: string | null }> {
  const sb = createClient()
  const { error } = await sb.rpc('delete_my_account')
  return { error: error?.message ?? null }
}
