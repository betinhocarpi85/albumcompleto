import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set('profile_pending', '', {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   0,
  })
  return res
}
