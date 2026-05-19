import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Define o cookie profile_pending=1 (httpOnly).
 *  Chamado pelo client após signUp/signIn quando o perfil ainda está incompleto.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set('profile_pending', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24, // 24h
  })
  return res
}
