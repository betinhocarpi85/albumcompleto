import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials, getAdminToken, ADMIN_COOKIE } from '@/lib/admin-auth'

// Rate limiting simples em memória (por IP)
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000 // 15 minutos

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function isRateLimited(ip: string): boolean {
  const now  = Date.now()
  const rec  = attempts.get(ip)

  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  rec.count += 1
  if (rec.count > MAX_ATTEMPTS) return true
  return false
}

function clearAttempts(ip: string) {
  attempts.delete(ip)
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
      { status: 429 }
    )
  }

  const { username, password } = await request.json()

  if (!await verifyCredentials(username, password)) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
  }

  clearAttempts(ip)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, getAdminToken(), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   30 * 60, // 30 minutos de inatividade
    path:     '/',
  })
  return res
}
