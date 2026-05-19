import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { buildMatchResultFromAnuncios } from '@/lib/match-engine'
import { albumCopa2026, buildGlobalNumberMap, TOTAL_STICKERS } from '@/data/album-copa-2026'
import type { AlbumId } from '@/data/albums-registry'

const _sidToGnum = buildGlobalNumberMap(albumCopa2026)
// Limita aos 980 stickers oficiais — exclui categorias extra (XGOLD/XSILVER/etc.)
const _allGnums  = new Set([..._sidToGnum.values()].filter(g => g <= TOTAL_STICKERS))

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

  const [myAdsRes, othersAdsRes] = await Promise.all([
    sb.from('anuncios').select('user_id,g_num,sid,preco,sticker_tipo')
      .eq('user_id', user.id).eq('album_id', albumId).eq('tipo', 'tenho'),
    sb.from('anuncios').select('user_id,g_num,sid,preco,sticker_tipo')
      .neq('user_id', user.id).eq('album_id', albumId).eq('tipo', 'tenho'),
  ])

  // Ids dos usuários com anúncios — usados para filtrar coladas e profiles
  const otherUserIds = [...new Set((othersAdsRes.data ?? []).map(a => a.user_id))]
  const allRelevantIds = [user.id, ...otherUserIds]

  const [allColadasRes, profilesRes] = await Promise.all([
    sb.from('coladas').select('user_id,sticker_id')
      .eq('album_id', albumId)
      .in('user_id', allRelevantIds)   // só usuários relevantes, não a tabela inteira
      .limit(50000),
    sb.from('profiles').select('id,nome,bairro,cidade,uf')
      .in('id', allRelevantIds),        // idem — elimina N+1 getUserById e full-table scan
  ])

  const dbProfileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]))

  const profiles = allRelevantIds.map(id => {
    const db = dbProfileMap.get(id)
    const partes = [db?.bairro, db?.cidade, db?.uf].filter(Boolean)
    return {
      id,
      nome:   db?.nome || 'Usuário',
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

  // Filtra anuncios inválidos:
  // 1. g_num deve ser número e existir no mapa do álbum atual
  // 2. Se tiver sid, o sid deve mapear para o mesmo g_num — descarta registros
  //    salvos com numeração antiga onde gnum e sid não mais coincidem
  type AdsRow = { user_id: string; g_num: number | null; sid: string | null; preco: number | null; sticker_tipo: string | null }
  const filterValid = (rows: AdsRow[]): AdsRow[] =>
    rows.filter(a => {
      if (typeof a.g_num !== 'number' || !_allGnums.has(a.g_num)) return false
      if (a.sid) {
        const expectedGnum = _sidToGnum.get(a.sid)
        if (expectedGnum !== undefined && expectedGnum !== a.g_num) return false
      }
      return true
    })

  const result = buildMatchResultFromAnuncios({
    myUserId:      user.id,
    myTenho:       filterValid(myAdsRes.data    ?? []),
    myPreciso:     precisoFor(user.id, coladasGnumsByUser),
    othersTenho:   filterValid(othersAdsRes.data ?? []),
    othersPreciso: otherUserIds.flatMap(id => precisoFor(id, coladasGnumsByUser)),
    profiles,
  })

  // Ordena por proximidade (maior score primeiro)
  result.trocas.sort((a, b) => proximidade(b.id) - proximidade(a.id))
  result.vendas.sort((a, b) => proximidade(b.id) - proximidade(a.id))
  result.doacoes.sort((a, b) => proximidade(b.id) - proximidade(a.id))

  return NextResponse.json(result)
}
