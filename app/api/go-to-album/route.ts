import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/go-to-album
 * Limpa o cookie profile_pending e redireciona para /album?escolher=1.
 * Chamado após completar o cadastro para garantir que o cookie é
 * removido no mesmo response da navegação (sem race condition).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const dest = user ? '/album?escolher=1' : '/entrar'

  const res = NextResponse.redirect(
    new URL(dest, process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
  )

  res.cookies.set('profile_pending', '', {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   0,
  })

  return res
}
