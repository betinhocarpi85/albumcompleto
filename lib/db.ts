/**
 * lib/db.ts
 * Camada de acesso ao Supabase. Mesma API pública de lib/store.ts,
 * mas async e persistida no banco — chamada nos useEffect das páginas.
 */

import { createClient } from '@/lib/supabase/client'
import type { AlbumId } from '@/data/albums-registry'
import type { AnuncioItem, Pedido, PreferenciaEntrega, UserProfile } from '@/lib/store'

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

export async function signUp(email: string, password: string) {
  const sb = createClient()
  return sb.auth.signUp({ email, password })
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
    uf:                 data.uf                 ?? '',
    logradouro:         data.logradouro         ?? '',
    numero:             data.numero             ?? '',
    complemento:        data.complemento        ?? '',
    cidade:             data.cidade             ?? '',
  }
}

export async function dbSaveProfile(p: Partial<UserProfile>) {
  const uid = await getUserId()
  if (!uid) return
  const sb = createClient()
  await sb.from('profiles').upsert({
    id:                  uid,
    nome:                p.nome,
    cpf:                 p.cpf,
    data_nascimento:     p.dataNascimento,
    maior_18:            p.maior18,
    aceitou_termos:      p.aceitouTermos,
    aceitou_privacidade: p.aceitouPrivacidade,
    cep:                 p.cep,
    uf:                  p.uf,
    logradouro:          p.logradouro,
    numero:              p.numero,
    complemento:         p.complemento,
    cidade:              p.cidade,
    updated_at:          new Date().toISOString(),
  })
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

export async function dbGetAnuncios(tipo: 'tenho' | 'preciso'): Promise<AnuncioItem[]> {
  const uid = await getUserId()
  if (!uid) return []
  const sb = createClient()
  const { data } = await sb
    .from('anuncios')
    .select('*')
    .eq('user_id', uid)
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

export async function dbSaveAnuncios(tipo: 'tenho' | 'preciso', items: AnuncioItem[]): Promise<void> {
  const uid = await getUserId()
  if (!uid) return
  const sb = createClient()

  // Substitui todos os anúncios do tipo
  await sb.from('anuncios').delete().eq('user_id', uid).eq('tipo', tipo)

  if (items.length === 0) return

  await sb.from('anuncios').insert(
    items.map(a => ({
      user_id:      uid,
      tipo,
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

// ─── Propostas (estrutura base) ───────────────────────────────────────────────

export interface PropostaDB {
  id:           string
  de_user_id:   string
  para_user_id: string
  eu_ofereco:   number[]
  eu_recebo:    number[]
  status:       'pendente' | 'aceita' | 'recusada'
  minha_escolha?: PreferenciaEntrega
  enviar_para?:   PreferenciaEntrega
  created_at:   string
}

export async function dbGetPropostasRecebidas(): Promise<PropostaDB[]> {
  const uid = await getUserId()
  if (!uid) return []
  const sb = createClient()
  const { data } = await sb
    .from('propostas')
    .select('*')
    .eq('para_user_id', uid)
    .order('created_at', { ascending: false })
  return (data ?? []) as PropostaDB[]
}

export async function dbGetPropostasEnviadas(): Promise<PropostaDB[]> {
  const uid = await getUserId()
  if (!uid) return []
  const sb = createClient()
  const { data } = await sb
    .from('propostas')
    .select('*')
    .eq('de_user_id', uid)
    .order('created_at', { ascending: false })
  return (data ?? []) as PropostaDB[]
}

export async function dbUpdateProposta(
  id: string,
  patch: Partial<Pick<PropostaDB, 'status' | 'minha_escolha' | 'enviar_para'>>
): Promise<void> {
  const sb = createClient()
  await sb.from('propostas').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
}
