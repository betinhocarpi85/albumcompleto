import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/go-to-album
 * Limpa o cookie profile_pending e redireciona para /album?escolher=1.
 * Usa a origem do request para não quebrar em preview URLs ou localhost.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin

  // Autentica via cookie de sessão
  const supabase = await createClient()
  const { data: { user: cookieUser } } = await supabase.auth.getUser()
  const autenticado = !!cookieUser

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
