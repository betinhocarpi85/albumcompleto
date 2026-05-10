import { NextResponse } from 'next/server'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { userId, banned, reason } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const sb = createAdminClient()

  const update: Record<string, unknown> = { banned: !!banned }
  if (banned) {
    update.banned_at = new Date().toISOString()
    update.banned_reason = reason ?? null
  } else {
    update.banned_at = null
    update.banned_reason = null
  }

  const { error } = await sb.from('profiles').update(update).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await sb.from('admin_logs').insert({
    action: banned ? 'ban_user' : 'unban_user',
    target_id: userId,
    details: banned ? `Banido: ${reason ?? 'sem motivo'}` : 'Desbanido',
  })

  return NextResponse.json({ ok: true })
}
