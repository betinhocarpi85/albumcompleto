import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { timingSafeEqual } from 'crypto'
import { sendPagamentoEmail } from '@/lib/email'

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

  // Idempotência: usa o ID do evento para não processar duas vezes em retentativas
  const orderId = (body.data?.id ?? body.id ?? '') as string
  const sb = createAdminClient()

  if (orderId) {
    const { count } = await sb
      .from('admin_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'webhook_paid')
      .eq('target_id', orderId)

    if (count && count > 0) {
      console.log(`[webhook/pagarme] ℹ️  evento ${orderId} já processado — ignorando`)
      return NextResponse.json({ ok: true })
    }
  }

  const { error } = await sb
    .from('profiles')
    .update({ plano: 'pro', plano_expira_em: expira.toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('[webhook/pagarme] erro ao atualizar plano:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Registra evento processado para idempotência futura
  await sb.from('admin_logs').insert({
    action:    'webhook_paid',
    target_id: orderId || userId,
    details:   `plano=${plano} userId=${userId} expira=${expira.toISOString()}`,
  }).catch(e => console.error('[webhook/pagarme] log:', e))

  console.log(`[webhook/pagarme] ✅ plano ${plano} ativado para ${userId} até ${expira.toISOString()}`)

  // Email de confirmação (fire-and-forget)
  const { data: authUser } = await sb.auth.admin.getUserById(userId)
  const { data: profile }  = await sb.from('profiles').select('nome, email').eq('id', userId).single()
  const emailDest = profile?.email ?? authUser?.user?.email
  if (emailDest) {
    sendPagamentoEmail({
      to:     emailDest,
      nome:   profile?.nome ?? 'Usuário',
      plano,
      expira,
    }).catch(e => console.error('[webhook/pagarme] email:', e))
  }

  return NextResponse.json({ ok: true })
}
