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
  if (error) return { error: error.message || 'Erro ao atualizar senha.' }
  return { error: null }
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

const LS_KEY = 'cdo_active_albums'

export async function dbGetActiveAlbums(): Promise<AlbumId[]> {
  // 1) localStorage — resposta imediata, sem depender de auth
  try {
    const local = localStorage.getItem(LS_KEY)
    if (local) {
      const parsed = JSON.parse(local) as AlbumId[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignora */ }

  // 2) DB via API com token no header
  try {
    const token = await Promise.race([
      getSession().then(s => s?.access_token ?? '').catch(() => ''),
      new Promise<string>(r => setTimeout(() => r(''), 2000)),
    ])
    const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {}
    const res = await fetch('/api/active-albums', { headers })
    if (!res.ok) return []
    const { albums } = await res.json()
    if (Array.isArray(albums) && albums.length > 0) {
      localStorage.setItem(LS_KEY, JSON.stringify(albums))
    }
    return (albums ?? []) as AlbumId[]
  } catch { return [] }
}

export async function dbSaveActiveAlbums(ids: AlbumId[]): Promise<void> {
  // Salva sempre em localStorage (imediato, sem auth)
  try { localStorage.setItem(LS_KEY, JSON.stringify(ids)) } catch { /* ignora */ }

  // Sincroniza com DB em background
  try {
    const token = await Promise.race([
      getSession().then(s => s?.access_token ?? '').catch(() => ''),
      new Promise<string>(r => setTimeout(() => r(''), 2000)),
    ])
    const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {}
    await fetch('/api/active-albums', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body:    JSON.stringify({ albums: ids }),
    })
  } catch { /* silencioso */ }
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
  /** Preço anunciado originalmente (soma dos preços individuais no momento do envio) */
  valor_original: number | null
  /** Preço oferecido pelo comprador (pode diferir do original se negociou) */
  valor_total:    number | null
  /** Contra-proposta rodada 1 — troca: stickers; compra: novo preço do vendedor */
  contra_eu_ofereco:  number[] | null
  contra_eu_recebo:   number[] | null
  contra_feita_por:   string   | null
  contra_valor:       number   | null   // compra: preço proposto pelo vendedor
  /** Contra-proposta rodada 2 — só para trocas */
  contra2_eu_ofereco: number[] | null
  contra2_eu_recebo:  number[] | null
  contra2_feita_por:  string   | null
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
      valor_original:     (p.valor_original as number | null) ?? null,
      valor_total:        (p.valor_total   as number | null) ?? null,
      contra_eu_ofereco:  (p.contra_eu_ofereco  as number[] | null) ?? null,
      contra_eu_recebo:   (p.contra_eu_recebo   as number[] | null) ?? null,
      contra_feita_por:   (p.contra_feita_por   as string   | null) ?? null,
      contra_valor:       (p.contra_valor        as number   | null) ?? null,
      contra2_eu_ofereco: (p.contra2_eu_ofereco as number[] | null) ?? null,
      contra2_eu_recebo:  (p.contra2_eu_recebo  as number[] | null) ?? null,
      contra2_feita_por:  (p.contra2_feita_por  as string   | null) ?? null,
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
    .neq('status', 'recusada')   // recusadas não aparecem em recebidas
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

export async function dbEnviarContraproposta(
  id: string,
  euOfereco: number[],
  euRecebo: number[]
): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`/api/propostas/${id}/contra`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ eu_ofereco: euOfereco, eu_recebo: euRecebo }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      return { error: (json as { error?: string }).error ?? 'Erro ao enviar contra-proposta' }
    }
    return { error: null }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function dbEnviarProposta(
  para_user_id: string,
  album_id: AlbumId,
  eu_ofereco: number[],
  eu_recebo: number[],
  tipo: TipoProposta,
  valor_total?: number,
  valor_original?: number
): Promise<{ error: string | null }> {
  const uid = await getUserId()
  if (!uid) return { error: 'Não autenticado' }
  if (uid === para_user_id) return { error: 'Não é possível enviar proposta para si mesmo' }
  const sb = createClient()

  // Bloqueia spam: verifica se já existe proposta pendente entre os dois para o mesmo álbum
  const { data: existente } = await sb
    .from('propostas')
    .select('id')
    .eq('de_user_id', uid)
    .eq('para_user_id', para_user_id)
    .eq('album_id', album_id)
    .eq('tipo', tipo)
    .eq('status', 'pendente')
    .limit(1)

  if (existente && existente.length > 0) {
    return { error: 'JA_ENVIADA' }
  }

  const { error } = await sb.from('propostas').insert({
    de_user_id:   uid,
    para_user_id,
    album_id,
    eu_ofereco,
    eu_recebo,
    tipo,
    valor_total:    tipo === 'compra' ? (valor_total    ?? null) : null,
    valor_original: tipo === 'compra' ? (valor_original ?? null) : null,
    status:       'pendente',
  })
  return { error: error?.message ?? null }
}

export async function dbGetPhoneForProposta(proposta_id: string): Promise<string | null> {
  try {
    const r = await fetch(`/api/propostas/${proposta_id}/phone`, { credentials: 'include' })
    if (!r.ok) return null
    const d = await r.json()
    return d.telefone ?? null
  } catch {
    return null
  }
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

// ─── Histórico ───────────────────────────────────────────────────────────────

export interface HistoricoItem {
  id:             string
  tipo:           TipoProposta
  contraparte:    string
  figurinhas:     number[]   // eu_ofereco (enviadas) ou eu_recebo (recebidas)
  created_at:     string
}

export async function dbGetHistorico(): Promise<HistoricoItem[]> {
  const uid = await getUserId()
  if (!uid) return []
  const sb = createClient()

  // 1. Busca avaliações do usuário — só propostas com 2 avaliações (mútua)
  const { data: avals } = await sb
    .from('avaliacoes')
    .select('proposta_id, de_user_id, para_user_id')
    .or(`de_user_id.eq.${uid},para_user_id.eq.${uid}`)

  if (!avals || avals.length === 0) return []

  // Filtra proposta_ids que envolvem o usuário E têm 2 avaliações
  const counts = new Map<string, number>()
  for (const a of avals) {
    if (a.de_user_id === uid || a.para_user_id === uid) {
      counts.set(a.proposta_id, (counts.get(a.proposta_id) ?? 0) + 1)
    }
  }
  const propostaIds = [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .map(([id]) => id)

  if (propostaIds.length === 0) return []

  // 2. Busca os dados das propostas confirmadas
  const { data: propostas } = await sb
    .from('propostas')
    .select('id, tipo, de_user_id, para_user_id, eu_ofereco, eu_recebo, created_at')
    .in('id', propostaIds)
    .order('created_at', { ascending: false })

  if (!propostas || propostas.length === 0) return []

  // 3. Busca nomes das contrapartes
  const contraparteIds = [...new Set(propostas.map(p =>
    p.de_user_id === uid ? p.para_user_id : p.de_user_id
  ))]
  const { data: profiles } = await sb
    .from('profiles')
    .select('id, nome')
    .in('id', contraparteIds)
  const nomeMap = new Map((profiles ?? []).map(p => [p.id, p.nome ?? 'Usuário']))

  return propostas.map(p => {
    const isEnviada      = p.de_user_id === uid
    const contraparteId  = isEnviada ? p.para_user_id : p.de_user_id
    const figurinhas     = isEnviada ? (p.eu_ofereco as number[]) : (p.eu_recebo as number[])
    return {
      id:          p.id,
      tipo:        p.tipo as TipoProposta,
      contraparte: nomeMap.get(contraparteId) ?? 'Usuário',
      figurinhas,
      created_at:  p.created_at as string,
    }
  })
}

// ─── Conta ────────────────────────────────────────────────────────────────────

export async function dbDeleteAccount(): Promise<{ error: string | null }> {
  const res = await fetch('/api/delete-account', { method: 'POST' })
  if (res.ok) return { error: null }
  const d = await res.json().catch(() => ({}))
  return { error: d?.error ?? `Erro ${res.status}` }
}
