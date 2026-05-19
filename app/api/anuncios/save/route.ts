import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { pushNovoMatch } from '@/lib/push'
import type { AnuncioItem } from '@/lib/store'
import { ALBUMS_REGISTRY } from '@/data/albums-registry'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: { albumId: string; tipo: 'tenho' | 'preciso'; items: (AnuncioItem & { acao?: string })[] } | null = null
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { albumId, tipo, items } = body!

  if (!albumId || !tipo || !Array.isArray(items)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // Valida que o albumId é conhecido
  const albumMeta = ALBUMS_REGISTRY.find(a => a.id === albumId)
  if (!albumMeta) {
    return NextResponse.json({ error: 'Álbum desconhecido' }, { status: 400 })
  }

  // Filtra itens com sid e gNum válidos (gNum deve ser > 0 e ≤ totalStickers)
  const validItems = items.filter(a => {
    const sid = a.sid
    const gNum = typeof a.gNum === 'string' ? parseInt(a.gNum) : (a.gNum ?? 0)
    if (!sid || typeof sid !== 'string') return false
    if (!gNum || gNum <= 0 || gNum > albumMeta.totalStickers) return false
    return true
  }).map(a => ({
    ...a,
    gNum: typeof a.gNum === 'string' ? parseInt(a.gNum) : (a.gNum ?? 0),
  }))

  const discarded = items.length - validItems.length
  console.log(`[anuncios/save] user=${user.id.slice(0,8)} album=${albumId} tipo=${tipo} total=${items.length} valid=${validItems.length} discarded=${discarded}`)
  if (discarded > 0) {
    const examples = items.filter(a => {
      const gNum = typeof a.gNum === 'string' ? parseInt(a.gNum) : (a.gNum ?? 0)
      return !a.sid || gNum <= 0 || gNum > albumMeta.totalStickers
    }).slice(0, 3).map(a => `sid=${a.sid} gNum=${a.gNum}`)
    console.warn(`[anuncios/save] discarded examples:`, examples)
  }

  // Deduplicar por sid — em caso de troca + venda para o mesmo sid, fica o último (venda)
  const sidMap = new Map<string, typeof validItems[0]>()
  for (const item of validItems) sidMap.set(item.sid, item)
  const deduped = Array.from(sidMap.values())
  if (deduped.length !== validItems.length) {
    console.warn(`[anuncios/save] deduplicated ${validItems.length - deduped.length} duplicate sids`)
  }

  const sb = createAdminClient()

  // 1. Delete existentes
  const { error: delError } = await sb.from('anuncios').delete()
    .eq('user_id', user.id)
    .eq('album_id', albumId)
    .eq('tipo', tipo)

  if (delError) {
    console.error('[anuncios/save] delete error:', delError.message)
    return NextResponse.json({ error: 'Erro ao limpar anúncios', detail: delError.message }, { status: 500 })
  }

  // 2. Insert novos (deduped)
  if (deduped.length > 0) {
    const { error: insError } = await sb.from('anuncios').insert(
      deduped.map(a => ({
        user_id:      user.id,
        album_id:     albumId,
        tipo,
        sid:          a.sid,
        g_num:        a.gNum,
        nome:         a.nome,
        qty:          a.qty ?? 1,
        sticker_tipo: a.tipo,
        preco:        a.preco ?? null,
      }))
    )

    if (insError) {
      console.error('[anuncios/save] insert error:', insError.message, insError.code, insError.details)
      return NextResponse.json({ error: 'Erro ao salvar anúncios', detail: insError.message }, { status: 500 })
    }
  }

  // 3. Notifica matches — só quando salva "tenho" e tem itens válidos
  if (tipo === 'tenho' && deduped.length > 0) {
    const gNums = deduped.map(a => a.gNum).filter(Boolean)

    if (gNums.length > 0) {
      const { data: candidatos } = await sb
        .from('anuncios')
        .select('user_id')
        .eq('album_id', albumId)
        .eq('tipo', 'preciso')
        .in('g_num', gNums)
        .neq('user_id', user.id)

      if (candidatos && candidatos.length > 0) {
        const contagem = new Map<string, number>()
        for (const row of candidatos) {
          contagem.set(row.user_id, (contagem.get(row.user_id) ?? 0) + 1)
        }
        await Promise.allSettled(
          Array.from(contagem.entries()).map(([uid, qtd]) =>
            pushNovoMatch(uid, qtd)
          )
        )
      }
    }
  }

  return NextResponse.json({ ok: true, saved: deduped.length, discarded })
}
