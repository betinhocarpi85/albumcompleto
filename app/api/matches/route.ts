import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { buildMatchResultFromAnuncios } from '@/lib/match-engine'
import { albumCopa2026, buildGlobalNumberMap } from '@/data/album-copa-2026'
import type { AlbumId } from '@/data/albums-registry'

const _sidToGnum = buildGlobalNumberMap(albumCopa2026)
const _allGnums  = new Set(_sidToGnum.values())

type PrecisoRow = { user_id: string; g_num: number; preco: null; sticker_tipo: null }

function precisoFor(userId: string, coladasGnumsByUser: Map<string, Set<number>>): PrecisoRow[] {
  const have = coladasGnumsByUser.get(userId) ?? new Set<number>()
  const rows: PrecisoRow[] = []
  for (const gnum of _allGnums) {
    if (!have.has(gnum)) rows.push({ user_id: userId, g_num: gnum, preco: null, sticker_tipo: null })
  }
  return rows
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const albumId = (request.nextUrl.searchParams.get('albumId') ?? 'copa-2026') as AlbumId
  const sb = createAdminClient()

  const [myAdsRes, othersAdsRes, allColadasRes, profilesRes] = await Promise.all([
    sb.from('anuncios').select('user_id,g_num,preco,sticker_tipo')
      .eq('user_id', user.id).eq('album_id', albumId).eq('tipo', 'tenho'),
    sb.from('anuncios').select('user_id,g_num,preco,sticker_tipo')
      .neq('user_id', user.id).eq('album_id', albumId).eq('tipo', 'tenho'),
    sb.from('coladas').select('user_id,sticker_id')
      .eq('album_id', albumId),
    sb.from('profiles').select('id,nome,bairro,cidade,uf'),
  ])

  // Fallback de nome via auth admin para perfis sem nome no banco
  const otherUserIds = [...new Set((othersAdsRes.data ?? []).map(a => a.user_id))]
  const emailMap = new Map<string, string>()
  await Promise.all([user.id, ...otherUserIds].map(async id => {
    try {
      const { data } = await sb.auth.admin.getUserById(id)
      const u = data?.user
      if (!u) return
      const display =
        (u.user_metadata?.full_name as string | undefined) ||
        (u.user_metadata?.name     as string | undefined) ||
        u.email?.split('@')[0] ||
        ''
      if (display) emailMap.set(id, display)
    } catch { /* silencioso */ }
  }))

  const dbProfileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]))
  const allRelevantIds = [user.id, ...otherUserIds]

  const profiles = allRelevantIds.map(id => {
    const db = dbProfileMap.get(id)
    const partes = [db?.bairro, db?.cidade, db?.uf].filter(Boolean)
    return {
      id,
      nome:   db?.nome   || emailMap.get(id) || 'Usuário',
      cidade: partes.join(', '),
    }
  })

  // Localidade do usuário atual para ordenar por proximidade
  const myDb = dbProfileMap.get(user.id)
  const myBairro = myDb?.bairro ?? ''
  const myCidade = myDb?.cidade ?? ''
  const myUf     = myDb?.uf     ?? ''

  function proximidade(otherId: string): number {
    const db = dbProfileMap.get(otherId)
    if (!db) return 0
    if (db.bairro && db.bairro === myBairro && db.cidade === myCidade) return 3
    if (db.cidade && db.cidade === myCidade) return 2
    if (db.uf && db.uf === myUf) return 1
    return 0
  }

  const coladasGnumsByUser = new Map<string, Set<number>>()
  for (const c of (allColadasRes.data ?? [])) {
    const gnum = _sidToGnum.get(c.sticker_id)
    if (gnum == null) continue
    if (!coladasGnumsByUser.has(c.user_id)) coladasGnumsByUser.set(c.user_id, new Set())
    coladasGnumsByUser.get(c.user_id)!.add(gnum)
  }

  const result = buildMatchResultFromAnuncios({
    myUserId:      user.id,
    myTenho:       myAdsRes.data    ?? [],
    myPreciso:     precisoFor(user.id, coladasGnumsByUser),
    othersTenho:   othersAdsRes.data ?? [],
    othersPreciso: otherUserIds.flatMap(id => precisoFor(id, coladasGnumsByUser)),
    profiles,
  })

  // Ordena por proximidade (maior score primeiro)
  result.trocas.sort((a, b) => proximidade(b.id) - proximidade(a.id))
  result.vendas.sort((a, b) => proximidade(b.id) - proximidade(a.id))
  result.doacoes.sort((a, b) => proximidade(b.id) - proximidade(a.id))

  return NextResponse.json(result)
}
