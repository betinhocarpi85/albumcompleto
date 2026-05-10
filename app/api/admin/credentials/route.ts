import { NextResponse } from 'next/server'
import { isAdminAuth, verifyCredentials } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { currentPassword, newUsername, newPassword } = await request.json()

  // Verify current password against env vars
  const currentUsername = (process.env.ADMIN_USERNAME ?? 'admin').trim()
  if (!verifyCredentials(currentUsername, currentPassword)) {
    return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 })
  }

  if (!newUsername || !newPassword) {
    return NextResponse.json({ error: 'Novo usuário e senha são obrigatórios.' }, { status: 400 })
  }

  const sb = createAdminClient()

  // Save new credentials to site_settings as plain text
  // (env vars are immutable at runtime, so we store overrides in DB)
  await Promise.all([
    sb.from('site_settings').upsert(
      { key: 'admin_username', value: newUsername, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    ),
    sb.from('site_settings').upsert(
      { key: 'admin_password_plain', value: newPassword, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    ),
  ])

  await sb.from('admin_logs').insert({
    action: 'update_credentials',
    target_id: null,
    details: `Credenciais atualizadas para usuário: ${newUsername}. Nota: mudanças só fazem efeito após reconfigurar variáveis de ambiente.`,
  })

  return NextResponse.json({
    ok: true,
    message: 'Credenciais salvas no banco. Para aplicar, atualize ADMIN_USERNAME e ADMIN_PASSWORD nas variáveis de ambiente.',
  })
}
