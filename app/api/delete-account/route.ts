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

  // Remove o usuário do auth primeiro — se falhar, dados do banco são preservados
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[delete-account] erro ao deletar usuário:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Apaga dados dependentes após remoção do auth user
  const deletions = await Promise.allSettled([
    admin.from('propostas').delete().or(`de_user_id.eq.${user.id},para_user_id.eq.${user.id}`),
    admin.from('anuncios').delete().eq('user_id', user.id),
    admin.from('coladas').delete().eq('user_id', user.id),
    admin.from('pedidos').delete().eq('user_id', user.id),
    admin.from('user_preferences').delete().eq('user_id', user.id),
    admin.from('profiles').delete().eq('id', user.id),
  ])

  // Loga erros não críticos
  for (const d of deletions) {
    if (d.status === 'rejected') console.error('[delete-account] erro limpando dados:', d.reason)
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('profile_pending', '', { maxAge: 0, path: '/' })
  return res
}
