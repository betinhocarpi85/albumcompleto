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

  // Filtra itens com sid e gNum válidos
  // Nota: o sid pode conter sufixo "__troca" ou "__venda" (codificado pelo cliente para
  // permitir que a mesma figurinha apareça como troca E venda sem violar UNIQUE(sid))
  // Regex que cobre todos os formatos de sid usados no app: "BRA-1__troca", "#10__venda", etc.
  const SID_SAFE = /^[A-Za-z0-9#\-_]+$/

  const validItems = items.filter(a => {
    if (!a.sid || typeof a.sid !== 'string') return false
    // Garante que o sid contém apenas caracteres seguros para interpolação no filtro PostgREST
    if (!SID_SAFE.test(a.sid)) return false
    const gNum = typeof a.gNum === 'string' ? parseInt(a.gNum) : (a.gNum ?? 0)
    if (!gNum || gNum <= 0 || gNum > albumMeta.totalStickers) return false
    // Preço: se for anúncio de venda, precisa de preço > 0 e ≤ 9999
    if (a.acao === 'venda') {
      const preco = typeof a.preco === 'number' ? a.preco : parseFloat(a.preco ?? '0')
      if (!preco || preco <= 0 || preco > 9999) return false
    }
    return true
  }).map(a => ({
    ...a,
    gNum: typeof a.gNum === 'string' ? parseInt(a.gNum) : (a.gNum ?? 0),
  }))

  const discarded = items.length - validItems.length
  console.log(`[anuncios/save] user=${user.id.slice(0,8)} album=${albumId} tipo=${tipo} total=${items.length} valid=${validItems.length} discarded=${discarded}`)

  const sb = createAdminClient()

  // 1. Upsert novos primeiro — garante que dados existem antes de remover os antigos
  //    (evita perda de dados se o insert falhar após o delete)
  if (validItems.length > 0) {
    const { error: upsError } = await sb.from('anuncios').upsert(
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
      })),
      { onConflict: 'user_id,tipo,album_id,sid' }
    )

    if (upsError) {
      console.error('[anuncios/save] upsert error:', upsError.message, upsError.code)
      return NextResponse.json({ error: 'Erro ao salvar anúncios', detail: upsError.message }, { status: 500 })
    }
  }

  // 2. Remove apenas os que não estão mais na lista (sids removidos pelo usuário)
  const newSids = validItems.map(a => a.sid)
  const deleteQuery = sb.from('anuncios')
    .delete()
    .eq('user_id', user.id)
    .eq('album_id', albumId)
    .eq('tipo', tipo)

  const { error: delError } = newSids.length > 0
    ? await deleteQuery.not('sid', 'in', `(${newSids.map(s => `"${s}"`).join(',')})`)
    : await deleteQuery

  if (delError) {
    console.error('[anuncios/save] delete error:', delError.message)
    // Não retorna erro — upsert já salvou os dados novos
  }

  // 3. Notifica matches — usa gNums únicos para não duplicar notificações
  if (tipo === 'tenho' && validItems.length > 0) {
    const gNums = [...new Set(validItems.map(a => a.gNum).filter(Boolean))]

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
