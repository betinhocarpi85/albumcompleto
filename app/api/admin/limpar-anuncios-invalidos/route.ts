import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { ALBUMS_REGISTRY } from '@/data/albums-registry'

const ADMIN_TOKEN = process.env.ADMIN_SECRET_TOKEN ?? ''

async function isAdmin(): Promise<boolean> {
  const jar = await cookies()
  const token = jar.get('admin_token')?.value
  return !!token && token === ADMIN_TOKEN
}

export async function POST(_request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const sb = createAdminClient()

  let totalRemovidos = 0
  const detalhes: string[] = []

  for (const album of ALBUMS_REGISTRY) {
    // Remove anúncios com g_num > totalStickers do álbum
    const { data: invalidos, error: errSelect } = await sb
      .from('anuncios')
      .select('id, g_num, user_id')
      .eq('album_id', album.id)
      .gt('g_num', album.totalStickers)

    if (errSelect) {
      detalhes.push(`${album.id}: erro ao buscar — ${errSelect.message}`)
      continue
    }

    if (!invalidos || invalidos.length === 0) {
      detalhes.push(`${album.id}: nenhum anúncio inválido`)
      continue
    }

    const ids = invalidos.map(r => r.id)
    const { error: errDel } = await sb
      .from('anuncios')
      .delete()
      .in('id', ids)

    if (errDel) {
      detalhes.push(`${album.id}: erro ao remover — ${errDel.message}`)
    } else {
      totalRemovidos += ids.length
      detalhes.push(`${album.id}: removidos ${ids.length} anúncios (gnums > ${album.totalStickers})`)
    }
  }

  return NextResponse.json({
    ok: true,
    totalRemovidos,
    detalhes,
    mensagem: `${totalRemovidos} anúncios inválidos removidos`,
  })
}
