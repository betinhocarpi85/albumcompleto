import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()
  // Deleta auth user primeiro — se falhar, dados do banco são preservados
  const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id)
  if (deleteErr) {
    console.error('[cancel-registration] deleteUser error:', deleteErr.message)
    return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  }
  await Promise.all([
    admin.from('anuncios').delete().eq('user_id', user.id),
    admin.from('coladas').delete().eq('user_id', user.id),
    admin.from('pedidos').delete().eq('user_id', user.id),
    admin.from('propostas').delete().or(`de_user_id.eq.${user.id},para_user_id.eq.${user.id}`),
    admin.from('user_preferences').delete().eq('user_id', user.id),
    admin.from('profiles').delete().eq('id', user.id),
  ])

  const res = NextResponse.json({ ok: true })
  res.cookies.set('profile_pending', '', { maxAge: 0, path: '/' })
  return res
}
