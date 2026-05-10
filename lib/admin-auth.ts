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

/** Verifica credenciais: banco tem prioridade sobre env vars */
export async function verifyCredentials(user: string, pass: string): Promise<boolean> {
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
  } catch { /* fallback abaixo */ }

  // Fallback: env vars
  const envUser = (process.env.ADMIN_USERNAME ?? 'admin').trim()
  const envPass = (process.env.ADMIN_PASSWORD ?? 'admin').trim()
  return user === envUser && pass === envPass
}
