import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { pushNovoMatch } from '@/lib/push'
import type { AnuncioItem } from '@/lib/store'
import { albumCopa2026, buildGlobalNumberMap } from '@/data/album-copa-2026'
import { albumBrasileiraoMasc2026 } from '@/data/album-brasileirao-masc-2025'
import { albumBrasileiraoFem2026 } from '@/data/album-brasileirao-fem-2025'
import { ALBUMS_REGISTRY } from '@/data/albums-registry'

// Mapas sid→gnum por álbum, pré-computados no boot
const GNUM_MAPS: Record<string, Map<string, number>> = {
  'copa-2026':              buildGlobalNumberMap(albumCopa2026),
  'brasileirao-masc-2026':  buildGlobalNumberMap(albumBrasileiraoMasc2026),
  'brasileirao-fem-2026':   buildGlobalNumberMap(albumBrasileiraoFem2026),
}

function resolveGnum(albumId: string, sid: string, gNumHint: number): number | null {
  const gnumMap = GNUM_MAPS[albumId]
  if (!gnumMap) {
    console.warn(`[anuncios/save] resolveGnum: albumId '${albumId}' not in GNUM_MAPS`)
    return null
  }
  const expected = gnumMap.get(sid)
  if (expected === undefined) {
    console.warn(`[anuncios/save] resolveGnum: sid '${sid}' not found in map for '${albumId}' (hint=${gNumHint})`)
    return null              // sid desconhecido
  }
  const albumMeta = ALBUMS_REGISTRY.find(a => a.id === albumId)
  if (albumMeta && expected > albumMeta.totalStickers) {
    console.warn(`[anuncios/save] resolveGnum: gNum ${expected} > totalStickers ${albumMeta.totalStickers} for sid '${sid}'`)
    return null  // acima do total oficial
  }
  return expected
}

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

  // ── Resolução de gNums ANTES do delete (evita perda de dados se validação falhar) ──
  const validItems = items.flatMap(a => {
    const gNumHint = typeof a.gNum === 'string' ? parseInt(a.gNum) : (a.gNum ?? 0)
    const gNum = resolveGnum(albumId, a.sid, gNumHint)
    if (gNum === null) return []
    return [{ ...a, gNum }]
  })

  const discarded = items.length - validItems.length
  console.log(`[anuncios/save] user=${user.id.slice(0,8)} album=${albumId} tipo=${tipo} total=${items.length} valid=${validItems.length} discarded=${discarded}`)

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

  // 2. Insert novos
  if (validItems.length > 0) {
    const { error: insError } = await sb.from('anuncios').insert(
      validItems.map(a => ({
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
      console.error('[anuncios/save] insert error:', insError.message, insError.code)
      return NextResponse.json({ error: 'Erro ao salvar anúncios', detail: insError.message }, { status: 500 })
    }
  }

  // 3. Notifica matches — só quando salva "tenho" e tem itens válidos
  if (tipo === 'tenho' && validItems.length > 0) {
    const gNums = validItems.map(a => a.gNum).filter(Boolean)

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

  return NextResponse.json({ ok: true, saved: validItems.length, discarded })
}
