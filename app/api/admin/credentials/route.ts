import { NextResponse } from 'next/server'
import { isAdminAuth, verifyCredentials, hashPassword } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { currentPassword, newUsername, newPassword } = await request.json()

  if (!newUsername?.trim() || !newPassword?.trim()) {
    return NextResponse.json({ error: 'Novo usuário e senha são obrigatórios.' }, { status: 400 })
  }

  if (newPassword.trim().length < 8) {
    return NextResponse.json({ error: 'Nova senha deve ter ao menos 8 caracteres.' }, { status: 400 })
  }

  // Verifica senha atual com a mesma lógica de login
  const adminUser = (process.env.ADMIN_USERNAME ?? '').trim() || 'admin'
  if (!await verifyCredentials(adminUser, currentPassword)) {
    return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 })
  }

  const sb = createAdminClient()

  // Salva novas credenciais com hash seguro
  const passwordHash = hashPassword(newPassword.trim())

  await Promise.all([
    sb.from('site_settings').upsert(
      { key: 'admin_username', value: newUsername.trim(), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    ),
    sb.from('site_settings').upsert(
      { key: 'admin_password_hash', value: passwordHash, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    ),
    // Remove legado plaintext se existir
    sb.from('site_settings').delete().eq('key', 'admin_password_plain'),
  ])

  await sb.from('admin_logs').insert({
    action: 'update_credentials',
    target_id: null,
    details: `Credenciais admin atualizadas para usuário: ${newUsername.trim()}`,
  })

  return NextResponse.json({ ok: true, message: 'Credenciais atualizadas com sucesso!' })
}
