import { NextResponse } from 'next/server'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { userId, plano, meses } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })
  if (!['free', 'pro', 'mensal', 'anual'].includes(plano)) {
    return NextResponse.json({ error: 'plano inválido' }, { status: 400 })
  }

  const sb = createAdminClient()

  let plano_expira_em: string | null = null
  if (plano !== 'free' && meses && meses > 0) {
    const expira = new Date()
    expira.setMonth(expira.getMonth() + Number(meses))
    plano_expira_em = expira.toISOString()
  }

  const { error } = await sb.from('profiles').update({ plano, plano_expira_em }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await sb.from('admin_logs').insert({
    action: 'set_plan',
    target_id: userId,
    details: `Plano: ${plano}, meses: ${meses ?? 0}, expira: ${plano_expira_em ?? 'nunca'}`,
  })

  return NextResponse.json({ ok: true })
}
