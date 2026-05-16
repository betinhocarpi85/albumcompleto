import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { pushNovoMatch } from '@/lib/push'
import type { AnuncioItem } from '@/lib/store'

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

  if (items.length > 0) {
    await sb.from('anuncios').insert(
      items.map(a => ({
        user_id:  user.id,
        album_id: albumId,
        tipo,
        sid:      a.sid,
        g_num:    typeof a.gNum === 'string' ? parseInt(a.gNum) : a.gNum,
        nome:     a.nome,
        qty:      a.qty ?? 1,
        sticker_type: a.tipo,
        preco:    a.preco ?? null,
        acao:     a.acao  ?? 'troca',
      }))
    )
  }

  // 2. Notifica matches — só quando salva "tenho" e tem itens
  if (tipo === 'tenho' && items.length > 0) {
    const gNums = items.map(a => typeof a.gNum === 'string' ? parseInt(a.gNum) : a.gNum).filter(Boolean)

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
