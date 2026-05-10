import { NextResponse } from 'next/server'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: Request) {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { anuncioId } = await request.json()
  if (!anuncioId) return NextResponse.json({ error: 'anuncioId obrigatório' }, { status: 400 })

  const sb = createAdminClient()

  const { error } = await sb.from('anuncios').delete().eq('id', anuncioId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await sb.from('admin_logs').insert({
    action: 'delete_anuncio',
    target_id: String(anuncioId),
    details: 'Anúncio deletado pelo admin',
  })

  return NextResponse.json({ ok: true })
}
