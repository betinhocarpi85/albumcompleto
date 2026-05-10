import { NextResponse } from 'next/server'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: Request) {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const sb = createAdminClient()

  // Deleta dados do usuário em todas as tabelas
  await Promise.all([
    sb.from('anuncios').delete().eq('user_id', userId),
    sb.from('coladas').delete().eq('user_id', userId),
    sb.from('pedidos').delete().eq('user_id', userId),
    sb.from('propostas').delete().or(`de_user_id.eq.${userId},para_user_id.eq.${userId}`),
    sb.from('user_preferences').delete().eq('user_id', userId),
    sb.from('profiles').delete().eq('id', userId),
  ])
  const { error } = await sb.auth.admin.deleteUser(userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
