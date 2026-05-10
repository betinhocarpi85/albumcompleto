import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const admin = createAdminClient()
    await Promise.all([
      admin.from('anuncios').delete().eq('user_id', user.id),
      admin.from('coladas').delete().eq('user_id', user.id),
      admin.from('pedidos').delete().eq('user_id', user.id),
      admin.from('propostas').delete().or(`de_user_id.eq.${user.id},para_user_id.eq.${user.id}`),
      admin.from('user_preferences').delete().eq('user_id', user.id),
      admin.from('profiles').delete().eq('id', user.id),
    ])
    await admin.auth.admin.deleteUser(user.id)
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('profile_pending', '', { maxAge: 0, path: '/' })
  return res
}
