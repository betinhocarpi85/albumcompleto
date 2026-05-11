import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { timingSafeEqual } from 'crypto'

function verifyBasicAuth(authHeader: string): boolean {
  const user   = (process.env.PAGARME_WEBHOOK_USER   ?? '').trim()
  const secret = (process.env.PAGARME_WEBHOOK_SECRET ?? '').trim()

  if (!user || !secret) {
    console.warn('[webhook/pagarme] ⚠️  PAGARME_WEBHOOK_USER ou PAGARME_WEBHOOK_SECRET não configurados — verificação ignorada')
    return true
  }

  if (!authHeader.startsWith('Basic ')) return false

  const decoded  = Buffer.from(authHeader.slice(6), 'base64').toString('utf8')
  const expected = `${user}:${secret}`

  try {
    const a = Buffer.alloc(512); a.write(decoded)
    const b = Buffer.alloc(512); b.write(expected)
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? ''

  if (!verifyBasicAuth(authHeader)) {
    console.warn('[webhook/pagarme] ❌ autenticação inválida')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()

  console.log('[webhook/pagarme] evento recebido:', body.type)

  if (body.type !== 'order.paid' && body.type !== 'charge.paid') {
    return NextResponse.json({ ok: true })
  }

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
