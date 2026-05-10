import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials, getAdminToken, ADMIN_COOKIE } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!await verifyCredentials(username, password)) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, getAdminToken(), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7, // 7 dias
    path:     '/',
  })
  return res
}
