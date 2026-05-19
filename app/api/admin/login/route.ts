import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials, getAdminToken, ADMIN_COOKIE } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000 // 15 minutos

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

/** Conta tentativas falhas do IP nas últimas WINDOW_MS ms usando admin_logs */
async function countRecentFailures(ip: string): Promise<number> {
  const sb  = createAdminClient()
  const since = new Date(Date.now() - WINDOW_MS).toISOString()
  const { count } = await sb
    .from('admin_logs')
    .select('*', { count: 'exact', head: true })
    .eq('action', 'login_failed')
    .eq('target_id', ip)
    .gte('created_at', since)
  return count ?? 0
}

async function logFailure(ip: string) {
  const sb = createAdminClient()
  await sb.from('admin_logs').insert({
    action:    'login_failed',
    target_id: ip,
    details:   `Tentativa de login inválida de ${ip}`,
  })
}

async function logSuccess(ip: string) {
  const sb = createAdminClient()
  await sb.from('admin_logs').insert({
    action:    'login_success',
    target_id: ip,
    details:   `Login de admin bem-sucedido de ${ip}`,
  })
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  const failures = await countRecentFailures(ip)
  if (failures >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
      { status: 429 }
    )
  }

  const { username, password } = await request.json()

  if (!await verifyCredentials(username, password)) {
    await logFailure(ip)
    // Delay artificial para dificultar brute-force mesmo sem rate limit
    await new Promise(r => setTimeout(r, 1000))
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
  }

  await logSuccess(ip)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, getAdminToken(), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   30 * 60,
    path:     '/',
  })
  return res
}
