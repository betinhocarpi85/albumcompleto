import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Só processa pagamentos confirmados
  if (body.type !== 'order.paid' && body.type !== 'charge.paid') {
    return NextResponse.json({ ok: true })
  }

  const metadata = body.data?.metadata ?? body.data?.order?.metadata ?? {}
  const userId   = metadata.user_id as string | undefined
  const plano    = metadata.plano   as string | undefined

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

  console.log(`[webhook/pagarme] plano ${plano} ativado para ${userId} até ${expira.toISOString()}`)
  return NextResponse.json({ ok: true })
}
