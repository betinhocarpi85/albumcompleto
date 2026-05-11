import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export const ADMIN_COOKIE = 'cdo_admin'

/** Token de sessão — derivado apenas do ADMIN_SECRET (independente das credenciais) */
export function getAdminToken(): string {
  const s = (process.env.ADMIN_SECRET ?? 'completando-admin-secret').trim()
  return `cdo-admin-session::${s}`
}

export async function isAdminAuth(): Promise<boolean> {
  try {
    const store = await cookies()
    return store.get(ADMIN_COOKIE)?.value === getAdminToken()
  } catch {
    return false
  }
}

/** Verifica credenciais: env vars têm prioridade; DB é fallback para credenciais alteradas via painel */
export async function verifyCredentials(user: string, pass: string): Promise<boolean> {
  // 1) Env vars (Vercel / .env.local) — fonte primária
  const envUser = (process.env.ADMIN_USERNAME ?? '').trim()
  const envPass = (process.env.ADMIN_PASSWORD ?? '').trim()
  if (envUser && envPass) {
    return user === envUser && pass === envPass
  }

  // 2) Banco de dados — credenciais alteradas via painel admin
  try {
    const sb = createAdminClient()
    const { data } = await sb
      .from('site_settings')
      .select('key, value')
      .in('key', ['admin_username', 'admin_password_plain'])

    const dbUser = data?.find(r => r.key === 'admin_username')?.value ?? ''
    const dbPass = data?.find(r => r.key === 'admin_password_plain')?.value ?? ''

    if (dbUser && dbPass) {
      return user === dbUser && pass === dbPass
    }
  } catch { /* segue */ }

  // 3) Último recurso: padrão seguro (funciona só se nada estiver configurado)
  return user === 'admin' && pass === 'admin'
}
