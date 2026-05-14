import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/go-to-album
 * Limpa o cookie profile_pending e redireciona para /album?escolher=1.
 * Usa a origem do request para não quebrar em preview URLs ou localhost.
 */
export async function GET(request: NextRequest) {
  const admin = createAdminClient()
  const origin = request.nextUrl.origin

  // Tenta autenticar via cookie
  let autenticado = false
  const supabase = await createClient()
  const { data: { user: cookieUser } } = await supabase.auth.getUser()
  if (cookieUser) autenticado = true

  // Fallback: token via query param (mobile onde cookie ainda não propagou)
  if (!autenticado) {
    const token = request.nextUrl.searchParams.get('t')
    if (token) {
      const { data: { user: tokenUser } } = await admin.auth.getUser(token)
      if (tokenUser) autenticado = true
    }
  }

  const dest = autenticado ? `${origin}/album?escolher=1` : `${origin}/entrar`

  const res = NextResponse.redirect(dest)

  res.cookies.set('profile_pending', '', {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   0,
  })

  return res
}
