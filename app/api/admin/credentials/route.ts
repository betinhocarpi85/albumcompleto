import { NextResponse } from 'next/server'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { currentPassword, newUsername, newPassword } = await request.json()

  if (!newUsername?.trim() || !newPassword?.trim()) {
    return NextResponse.json({ error: 'Novo usuário e senha são obrigatórios.' }, { status: 400 })
  }

  const sb = createAdminClient()

  // Busca credenciais atuais no banco (prioridade) ou env vars
  const { data: settingsData } = await sb
    .from('site_settings')
    .select('key, value')
    .in('key', ['admin_username', 'admin_password_plain'])

  const dbUser = settingsData?.find(r => r.key === 'admin_username')?.value ?? ''
  const dbPass = settingsData?.find(r => r.key === 'admin_password_plain')?.value ?? ''

  const expectedPass = dbPass || (process.env.ADMIN_PASSWORD ?? 'admin').trim()

  if (currentPassword !== expectedPass) {
    return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 })
  }

  // Salva novas credenciais no banco
  await Promise.all([
    sb.from('site_settings').upsert(
      { key: 'admin_username', value: newUsername.trim(), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    ),
    sb.from('site_settings').upsert(
      { key: 'admin_password_plain', value: newPassword.trim(), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    ),
  ])

  await sb.from('admin_logs').insert({
    action: 'update_credentials',
    target_id: null,
    details: `Usuário admin alterado para: ${newUsername.trim()}`,
  })

  return NextResponse.json({ ok: true, message: 'Credenciais atualizadas com sucesso!' })
}
