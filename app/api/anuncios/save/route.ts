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
  if (!gnumMap) return null
  const expected = gnumMap.get(sid)
  if (expected === undefined) return null              // sid desconhecido
  const albumMeta = ALBUMS_REGISTRY.find(a => a.id === albumId)
  if (albumMeta && expected > albumMeta.totalStickers) return null  // acima do total oficial
  // Usa o gNum do mapa atual (ignora o hint do cliente, que pode estar desatualizado)
  return expected
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { albumId, tipo, items } = await request.json() as {
    albumId: string
    tipo:    'tenho' | 'preciso'
    items:   (AnuncioItem & { acao?: string })[]
  }

  if (!albumId || !tipo || !Array.isArray(items)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const sb = createAdminClient()

  // 1. Salva os anúncios (delete + insert)
  await sb.from('anuncios').delete()
    .eq('user_id', user.id)
    .eq('album_id', albumId)
    .eq('tipo', tipo)

  // Resolve gNum pelo sid (ignora valor do cliente que pode estar desatualizado)
  const validItems = items.flatMap(a => {
    const gNumHint = typeof a.gNum === 'string' ? parseInt(a.gNum) : (a.gNum ?? 0)
    const gNum = resolveGnum(albumId, a.sid, gNumHint)
    if (gNum === null) return []
    return [{ ...a, gNum }]
  })

  if (validItems.length > 0) {
    await sb.from('anuncios').insert(
      validItems.map(a => ({
        user_id:     user.id,
        album_id:    albumId,
        tipo,
        sid:         a.sid,
        g_num:       a.gNum,
        nome:        a.nome,
        qty:         a.qty ?? 1,
        sticker_tipo: a.tipo,
        preco:       a.preco ?? null,
      }))
    )
  }

  // 2. Notifica matches — só quando salva "tenho" e tem itens válidos
  if (tipo === 'tenho' && validItems.length > 0) {
    const gNums = validItems.map(a => a.gNum).filter(Boolean)

    if (gNums.length > 0) {
      // Quem tem "preciso" com qualquer dessas figurinhas no mesmo álbum (exceto o próprio usuário)
      const { data: candidatos } = await sb
        .from('anuncios')
        .select('user_id')
        .eq('album_id', albumId)
        .eq('tipo', 'preciso')
        .in('g_num', gNums)
        .neq('user_id', user.id)

      if (candidatos && candidatos.length > 0) {
        // Agrupa por user e conta quantas figurinhas batem
        const contagem = new Map<string, number>()
        for (const row of candidatos) {
          contagem.set(row.user_id, (contagem.get(row.user_id) ?? 0) + 1)
        }

        // Dispara push para cada usuário (cooldown 4h protege contra spam)
        await Promise.allSettled(
          Array.from(contagem.entries()).map(([uid, qtd]) =>
            pushNovoMatch(uid, qtd)
          )
        )
      }
    }
  }

  return NextResponse.json({ ok: true })
}
