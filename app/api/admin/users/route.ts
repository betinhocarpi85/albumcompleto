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

  await sb.from('admin_logs').insert({
    action: 'delete_user',
    target_id: userId,
    details: 'Usuário deletado pelo admin',
  })

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { userId, nome, email, telefone } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const sb = createAdminClient()

  const updates: Record<string, unknown> = {}
  if (nome !== undefined) updates.nome = nome
  if (telefone !== undefined) updates.telefone = telefone

  if (Object.keys(updates).length > 0) {
    const { error } = await sb.from('profiles').update(updates).eq('id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (email) {
    const { error } = await sb.auth.admin.updateUserById(userId, { email })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await sb.from('admin_logs').insert({
    action: 'edit_user',
    target_id: userId,
    details: `Editado: ${JSON.stringify({ nome, email, telefone })}`,
  })

  return NextResponse.json({ ok: true })
}
