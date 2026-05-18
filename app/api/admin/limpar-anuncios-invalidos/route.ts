/**
 * POST /api/admin/limpar-anuncios-invalidos
 *
 * Varredura completa de dados obsoletos:
 *  1. anuncios com g_num > totalStickers do álbum
 *  2. anuncios com g_num NULL (inutilizáveis para match/notificação)
 *  3. anuncios com g_num < 1 (valor inválido)
 *  4. anuncios com sid NULL ou vazio
 *  5. anuncios de album_id não registrado
 *  6. coladas de album_id não registrado
 *  7. coladas com sticker_id inexistente no álbum
 *  8. propostas com album_id não registrado → delete
 *  9. propostas com tipo NULL → corrige para 'troca'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuth } from '@/lib/admin-auth'
import { ALBUMS_REGISTRY } from '@/data/albums-registry'
import { albumCopa2026, buildGlobalNumberMap } from '@/data/album-copa-2026'
import { albumBrasileiraoMasc2026 } from '@/data/album-brasileirao-masc-2025'
import { albumBrasileiraoFem2026 } from '@/data/album-brasileirao-fem-2025'

// Mapa de album_id → Set de sids OFICIAIS (gnums ≤ totalStickers do registry)
// Exclui categorias extra como XGOLD/XSILVER/XBRONZE/XPURPLE/COCA-COLA
function buildValidSidsMap(): Map<string, Set<string>> {
  const albums = [albumCopa2026, albumBrasileiraoMasc2026, albumBrasileiraoFem2026]
  const result = new Map<string, Set<string>>()
  for (const album of albums) {
    const gnumMap  = buildGlobalNumberMap(album)
    const maxGnum  = ALBUMS_REGISTRY.find(a => a.id === album.id)?.totalStickers ?? Infinity
    const validSids = new Set(
      [...gnumMap.entries()].filter(([, g]) => g <= maxGnum).map(([sid]) => sid)
    )
    result.set(album.id, validSids)
  }
  return result
}

const VALID_ALBUM_IDS = new Set<string>(ALBUMS_REGISTRY.map(a => a.id))
const VALID_SIDS_BY_ALBUM = buildValidSidsMap()

interface CleanupStep {
  step: string
  removidos: number
  corrigidos?: number
  erro?: string
}

export async function POST(_request: NextRequest) {
  if (!(await isAdminAuth())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const sb = createAdminClient()
  const resultados: CleanupStep[] = []
  let totalRemovidos = 0
  let totalCorrigidos = 0

  // ─── 1. Anúncios com g_num > totalStickers ────────────────────────────────
  {
    let removidos = 0
    for (const album of ALBUMS_REGISTRY) {
      const { data, error } = await sb
        .from('anuncios')
        .delete()
        .eq('album_id', album.id)
        .gt('g_num', album.totalStickers)
        .select('id')
      if (error) {
        resultados.push({ step: `1. g_num > ${album.totalStickers} (${album.id})`, removidos: 0, erro: error.message })
      } else {
        removidos += data?.length ?? 0
      }
    }
    resultados.push({ step: '1. Anúncios com g_num acima do total do álbum', removidos })
    totalRemovidos += removidos
  }

  // ─── 2. Anúncios com g_num NULL ────────────────────────────────────────────
  {
    const { data, error } = await sb
      .from('anuncios')
      .delete()
      .is('g_num', null)
      .select('id')
    const removidos = data?.length ?? 0
    resultados.push({ step: '2. Anúncios com g_num NULL', removidos, ...(error ? { erro: error.message } : {}) })
    totalRemovidos += removidos
  }

  // ─── 3. Anúncios com g_num < 1 ─────────────────────────────────────────────
  {
    const { data, error } = await sb
      .from('anuncios')
      .delete()
      .lt('g_num', 1)
      .select('id')
    const removidos = data?.length ?? 0
    resultados.push({ step: '3. Anúncios com g_num < 1 (inválido)', removidos, ...(error ? { erro: error.message } : {}) })
    totalRemovidos += removidos
  }

  // ─── 4. Anúncios com sid NULL ou vazio ─────────────────────────────────────
  {
    const { data: nullSid, error: e1 } = await sb
      .from('anuncios').delete().is('sid', null).select('id')
    const { data: emptySid, error: e2 } = await sb
      .from('anuncios').delete().eq('sid', '').select('id')
    const removidos = (nullSid?.length ?? 0) + (emptySid?.length ?? 0)
    const erro = e1?.message ?? e2?.message
    resultados.push({ step: '4. Anúncios com sid NULL ou vazio', removidos, ...(erro ? { erro } : {}) })
    totalRemovidos += removidos
  }

  // ─── 5. Anúncios de álbum não registrado ───────────────────────────────────
  {
    let removidos = 0
    // Busca todos album_ids distintos
    const { data: rows } = await sb
      .from('anuncios')
      .select('album_id')
    const albumIds = [...new Set((rows ?? []).map((r: { album_id: string }) => r.album_id))]
    const invalidos = albumIds.filter(id => !VALID_ALBUM_IDS.has(id))
    for (const aid of invalidos) {
      const { data, error } = await sb
        .from('anuncios').delete().eq('album_id', aid).select('id')
      if (!error) removidos += data?.length ?? 0
    }
    resultados.push({
      step: `5. Anúncios de álbum não registrado${invalidos.length ? ` (${invalidos.join(', ')})` : ''}`,
      removidos,
    })
    totalRemovidos += removidos
  }

  // ─── 6. Coladas de álbum não registrado ────────────────────────────────────
  {
    let removidos = 0
    const { data: rows } = await sb.from('coladas').select('album_id')
    const albumIds = [...new Set((rows ?? []).map((r: { album_id: string }) => r.album_id))]
    const invalidos = albumIds.filter(id => !VALID_ALBUM_IDS.has(id))
    for (const aid of invalidos) {
      const { data, error } = await sb
        .from('coladas').delete().eq('album_id', aid).select('id')
      if (!error) removidos += data?.length ?? 0
    }
    resultados.push({
      step: `6. Coladas de álbum não registrado${invalidos.length ? ` (${invalidos.join(', ')})` : ''}`,
      removidos,
    })
    totalRemovidos += removidos
  }

  // ─── 7. Coladas com sticker_id inexistente no álbum ────────────────────────
  {
    let removidos = 0
    for (const [albumId, validSids] of VALID_SIDS_BY_ALBUM) {
      // Pega todos os sticker_ids desse álbum
      const { data: rows } = await sb
        .from('coladas')
        .select('id, sticker_id')
        .eq('album_id', albumId)

      if (!rows || rows.length === 0) continue

      const invalidos = rows
        .filter((r: { sticker_id: string }) => !validSids.has(r.sticker_id))
        .map((r: { id: string }) => r.id)

      if (invalidos.length === 0) continue

      // Deleta em lotes de 500
      for (let i = 0; i < invalidos.length; i += 500) {
        const batch = invalidos.slice(i, i + 500)
        const { data } = await sb.from('coladas').delete().in('id', batch).select('id')
        removidos += data?.length ?? 0
      }
    }
    resultados.push({ step: '7. Coladas com sticker_id inválido para o álbum', removidos })
    totalRemovidos += removidos
  }

  // ─── 8. Propostas de álbum não registrado ──────────────────────────────────
  {
    let removidos = 0
    const { data: rows } = await sb.from('propostas').select('album_id')
    const albumIds = [...new Set((rows ?? []).map((r: { album_id: string }) => r.album_id))]
    const invalidos = albumIds.filter(id => id && !VALID_ALBUM_IDS.has(id))
    for (const aid of invalidos) {
      const { data, error } = await sb
        .from('propostas').delete().eq('album_id', aid).select('id')
      if (!error) removidos += data?.length ?? 0
    }
    resultados.push({
      step: `8. Propostas de álbum não registrado${invalidos.length ? ` (${invalidos.join(', ')})` : ''}`,
      removidos,
    })
    totalRemovidos += removidos
  }

  // ─── 9. Anúncios com sid ≠ g_num do mapa atual (estrutura antiga) ─────────
  // Detecta registros onde o sid aponta para um gnum diferente do armazenado —
  // ou seja, foram salvos quando o álbum tinha outra numeração.
  {
    let removidos = 0
    for (const album of [albumCopa2026]) {
      const gnumMap = buildGlobalNumberMap(album)
      const { data: rows } = await sb
        .from('anuncios')
        .select('id, sid, g_num')
        .eq('album_id', album.id)
        .not('sid', 'is', null)
        .not('g_num', 'is', null)

      if (!rows || rows.length === 0) continue

      const invalidos = rows
        .filter((r: { sid: string; g_num: number }) => {
          const expectedGnum = gnumMap.get(r.sid)
          return expectedGnum !== undefined && expectedGnum !== r.g_num
        })
        .map((r: { id: string }) => r.id)

      for (let i = 0; i < invalidos.length; i += 500) {
        const batch = invalidos.slice(i, i + 500)
        const { data } = await sb.from('anuncios').delete().in('id', batch).select('id')
        removidos += data?.length ?? 0
      }
    }
    resultados.push({ step: '9. Anúncios com sid/g_num dessincronizados (numeração antiga)', removidos })
    totalRemovidos += removidos
  }

  // ─── 10. Propostas com tipo NULL → corrige para 'troca' ────────────────────
  {
    const { data, error } = await sb
      .from('propostas')
      .update({ tipo: 'troca' })
      .is('tipo', null)
      .select('id')
    const corrigidos = data?.length ?? 0
    resultados.push({ step: '10. Propostas com tipo NULL → corrigido para "troca"', removidos: 0, corrigidos, ...(error ? { erro: error.message } : {}) })
    totalCorrigidos += corrigidos
  }

  return NextResponse.json({
    ok: true,
    totalRemovidos,
    totalCorrigidos,
    resultados,
    mensagem: `Varredura concluída: ${totalRemovidos} removidos, ${totalCorrigidos} corrigidos`,
  })
}
