import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json()

  console.log('[webhook/pagarme] evento recebido:', body.type)

  // Aceita order.paid e charge.paid
  if (body.type !== 'order.paid' && body.type !== 'charge.paid') {
    return NextResponse.json({ ok: true })
  }

  // Pagar.me v5: metadata pode vir em lugares diferentes dependendo do evento
  // order.paid  → body.data.metadata
  // charge.paid → body.data.metadata OU body.data.order.metadata
  const metadata =
    body.data?.metadata ??
    body.data?.order?.metadata ??
    {}

  const userId = metadata.user_id as string | undefined
  const plano  = metadata.plano   as string | undefined

  console.log('[webhook/pagarme] metadata:', { userId, plano })

  if (!userId || !plano || !['mensal', 'anual'].includes(plano)) {
    console.warn('[webhook/pagarme] metadata inválida:', metadata)
    return NextResponse.json({ error: 'metadata inválida' }, { status: 400 })
  }

  const expira = new Date()
  if (plano === 'mensal') {
    expira.setMonth(expira.getMonth() + 1)
  } else {
    expira.setFullYear(expira.getFullYear() + 1)
  }

  const sb = createAdminClient()
  const { error } = await sb
    .from('profiles')
    .update({ plano: 'pro', plano_expira_em: expira.toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('[webhook/pagarme] erro ao atualizar plano:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[webhook/pagarme] ✅ plano ${plano} ativado para ${userId} até ${expira.toISOString()}`)
  return NextResponse.json({ ok: true })
}
